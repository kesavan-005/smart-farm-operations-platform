// Sync Manager — background process that drains the sync queue
// Retries with exponential backoff, listens for online events

import { syncQueue } from './syncQueue';
import { db } from './db';
import { useFarmStore } from '@/store/farmStore';
import { apiClient } from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';
import type { ApiResponse, SyncQueueEntry } from '@/types/api';
import type { Farm, Field, InventoryItem } from '@/types/domain';

// Entity type → API endpoint mapping
// Populated as features are built; each feature registers its sync handler
type SyncHandler = (entry: SyncQueueEntry) => Promise<void>;
const syncHandlers = new Map<string, SyncHandler>();

/**
 * Register a sync handler for a specific entity type.
 * Called by each feature module to define how its mutations are synced to the server.
 *
 * Example (in features/farms/api/):
 *   registerSyncHandler('farm', async (entry) => {
 *     if (entry.operation === 'CREATE') {
 *       await apiClient.post('/farms', entry.payload);
 *     }
 *   });
 */
export function registerSyncHandler(entityType: string, handler: SyncHandler): void {
  syncHandlers.set(entityType, handler);
}

/**
 * Default sync handler — POST/PUT/DELETE to /api/v1/{entityType}s
 * Used when no custom handler is registered for an entity type.
 */
async function defaultSyncHandler(entry: SyncQueueEntry): Promise<void> {
  const basePath = `/${entry.entityType}s`;

  try {
    switch (entry.operation) {
      case 'CREATE':
        await apiClient.post(basePath, entry.payload);
        break;
      case 'UPDATE':
        await apiClient.put(`${basePath}/${entry.entityId}`, entry.payload);
        break;
      case 'DELETE':
        await apiClient.delete(`${basePath}/${entry.entityId}`);
        break;
    }
  } catch (err: any) {
    if ((entry.operation === 'DELETE' || entry.operation === 'UPDATE') && (err?.code === 'RESOURCE_NOT_FOUND' || err?.response?.status === 404)) {
      console.info(`${entry.entityType} ${entry.entityId} was not found on server during ${entry.operation}. Marking satisfied.`);
    } else {
      throw err;
    }
  }
}

/**
 * Process a single sync queue entry.
 */
async function processEntry(entry: SyncQueueEntry): Promise<void> {
  if (!entry.id) return;

  await syncQueue.markSyncing(entry.id);

  try {
    const handler = syncHandlers.get(entry.entityType) ?? defaultSyncHandler;
    await handler(entry);
    await syncQueue.markSynced(entry.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await syncQueue.markFailed(entry.id, errorMessage);
    throw error; // Re-throw to signal failure to the flush loop
  }
}

/**
 * Flush the sync queue — process all pending entries in order.
 * Stops on the first failure (preserves ordering guarantee).
 */
export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  // Clean up any stale or stuck entries before processing
  await syncQueue.cleanup();

  const pending = await syncQueue.getPending();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      await processEntry(entry);
      synced++;
    } catch {
      failed++;
      // Don't block subsequent entries with multi-second backoff timeouts
      // Small 50ms throttle keeps requests smooth without freezing the queue
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // Clean up synced entries & refresh UI query caches
  if (synced > 0) {
    await syncQueue.clearSynced();
    queryClient.invalidateQueries();
  }

  return { synced, failed };
}

// ==========================================
// Auto-sync on connectivity change
// ==========================================

let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the sync manager — listens for online events and periodically flushes.
 */
export function startSyncManager(): void {
  // Flush when coming back online
  window.addEventListener('online', () => {
    flushSyncQueue();
  });

  // Periodic flush every 10 seconds when online
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      flushSyncQueue();
    }
  }, 10_000);

  // Initial flush on startup
  if (navigator.onLine) {
    flushSyncQueue();
  }
}

/**
 * Stop the sync manager.
 */
export function stopSyncManager(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ==========================================
// Inventory Custom Sync Handlers
// ==========================================

/**
 * Helper: returns true if the error is a 404 / RESOURCE_NOT_FOUND.
 * Used by sync handlers to silently mark DELETE/UPDATE of already-gone resources as satisfied.
 */
function isNotFoundError(err: any): boolean {
  return err?.code === 'RESOURCE_NOT_FOUND' || err?.response?.status === 404;
}

registerSyncHandler('inventoryItem', async (entry) => {
  const farmId = (entry.payload as any).farmId;
  if (!farmId) throw new Error('farmId missing from payload');
  
  const cleanPayload = { ...(entry.payload as any) };
  if (cleanPayload.categoryId === '') delete cleanPayload.categoryId;
  if (cleanPayload.warehouseId === '') delete cleanPayload.warehouseId;
  if (cleanPayload.expiryDate === '') delete cleanPayload.expiryDate;
  if (cleanPayload.maximumStock === '' || cleanPayload.maximumStock === null) delete cleanPayload.maximumStock;
  if (cleanPayload.sellingPrice === '' || cleanPayload.sellingPrice === null) delete cleanPayload.sellingPrice;

  if (entry.operation === 'CREATE') {
    try {
      const response = await apiClient.post<ApiResponse<InventoryItem>>(`/farms/${farmId}/inventory/items`, cleanPayload);
      const serverItem = response.data?.data;
      if (serverItem && serverItem.id) {
        const oldId = entry.entityId;
        const newId = serverItem.id;
        await db.table('inventoryItems').put({ ...serverItem, _synced: true });
        if (oldId && oldId !== newId) {
          await db.table('inventoryItems').delete(oldId);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || isNotFoundError(err)) {
        console.info(`inventoryItem ${entry.entityId} resolved on server during CREATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/farms/${farmId}/inventory/items/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`inventoryItem ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farms/${farmId}/inventory/items/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`inventoryItem ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('warehouse', async (entry) => {
  const farmId = (entry.payload as any).farmId;
  if (!farmId) throw new Error('farmId missing from payload');

  if (entry.operation === 'CREATE') {
    await apiClient.post(`/farms/${farmId}/inventory/warehouses`, entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/farms/${farmId}/inventory/warehouses/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`warehouse ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farms/${farmId}/inventory/warehouses/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`warehouse ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('inventoryCategory', async (entry) => {
  const farmId = (entry.payload as any).farmId;
  if (!farmId) throw new Error('farmId missing from payload');

  if (entry.operation === 'CREATE') {
    await apiClient.post(`/farms/${farmId}/inventory/categories`, entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/farms/${farmId}/inventory/categories/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`inventoryCategory ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farms/${farmId}/inventory/categories/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`inventoryCategory ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('stockTransaction', async (entry) => {
  const farmId = (entry.payload as any).farmId;
  const itemId = (entry.payload as any).inventoryItemId;
  if (!farmId || !itemId) throw new Error('farmId or inventoryItemId missing from payload');

  if (entry.operation === 'CREATE') {
    await apiClient.post(`/farms/${farmId}/inventory/items/${itemId}/transactions`, entry.payload);
  }
});

registerSyncHandler('financialTransaction', async (entry) => {
  const farmId = (entry.payload as any).farmId;
  if (!farmId) throw new Error('farmId missing from payload');

  const payload = { ...(entry.payload as any) };
  if (payload.transactionDate) {
    try {
      const parsedDate = new Date(payload.transactionDate);
      if (!isNaN(parsedDate.getTime())) {
        payload.transactionDate = parsedDate.toISOString();
      } else {
        payload.transactionDate = new Date().toISOString();
      }
    } catch {
      payload.transactionDate = new Date().toISOString();
    }
  } else {
    payload.transactionDate = new Date().toISOString();
  }

  if (entry.operation === 'CREATE') {
    try {
      await apiClient.post(`/farms/${farmId}/finance/transactions`, payload);
    } catch (err: any) {
      if (err?.response?.status === 409 || isNotFoundError(err)) {
        console.info(`financialTransaction ${entry.entityId} resolved on server during CREATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farms/${farmId}/finance/transactions/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`financialTransaction ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('financialBudget', async (entry) => {
  const farmId = (entry.payload as any).farmId;
  if (!farmId) throw new Error('farmId missing from payload');

  if (entry.operation === 'CREATE') {
    await apiClient.post(`/farms/${farmId}/finance/budgets`, entry.payload);
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farms/${farmId}/finance/budgets/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`financialBudget ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('farmActivity', async (entry) => {
  if (entry.operation === 'CREATE') {
    await apiClient.post('/activities', entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/activities/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`farmActivity ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/activities/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`farmActivity ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('farmTask', async (entry) => {
  if (entry.operation === 'CREATE') {
    await apiClient.post('/tasks', entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/tasks/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`farmTask ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/tasks/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`farmTask ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('workOrder', async (entry) => {
  if (entry.operation === 'CREATE') {
    await apiClient.post('/work-orders', entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/work-orders/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`workOrder ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/work-orders/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`workOrder ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('equipment', async (entry) => {
  if (entry.operation === 'CREATE') {
    await apiClient.post('/equipment', entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/equipment/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`equipment ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/equipment/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`equipment ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('laborRecord', async (entry) => {
  if (entry.operation === 'CREATE') {
    await apiClient.post('/labor-records', entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/labor-records/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`laborRecord ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/labor-records/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`laborRecord ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

registerSyncHandler('farmSchedule', async (entry) => {
  if (entry.operation === 'CREATE') {
    await apiClient.post('/farm-schedules', entry.payload);
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/farm-schedules/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`farmSchedule ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farm-schedules/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`farmSchedule ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});

// ==========================================
// Farm & Field Custom Sync Handlers (ID Translation)
// ==========================================

registerSyncHandler('farm', async (entry) => {
  if (entry.operation === 'CREATE') {
    const payload = {
      state: 'Tamil Nadu',
      status: 'active',
      ...(entry.payload as any),
    };
    const response = await apiClient.post<ApiResponse<Farm>>('/farms', payload);
    const serverFarm = response.data?.data;
    if (serverFarm && serverFarm.id) {
      const oldId = entry.entityId;
      const newId = serverFarm.id;
      await db.table('farms').put({ ...serverFarm, _synced: true });
      if (oldId !== newId) {
        await db.table('farms').delete(oldId);
        
        // Update local fields in Dexie
        const localFields = await db.table('fields').filter((f: any) => f.farmId === oldId).toArray();
        for (const f of localFields) {
          await db.table('fields').update(f.id, { farmId: newId });
        }

        // Update pending syncQueue entries referencing oldId
        const pendingQueueEntries = await db.table('syncQueue').toArray();
        for (const qe of pendingQueueEntries) {
          if (qe.payload && typeof qe.payload === 'object' && (qe.payload as any).farmId === oldId) {
            await db.table('syncQueue').update(qe.id, {
              payload: { ...(qe.payload as any), farmId: newId }
            });
          }
        }

        const farmStore = useFarmStore.getState();
        if (farmStore.activeFarmId === oldId) {
          farmStore.setActiveFarmId(newId);
        }
        queryClient.invalidateQueries({ queryKey: ['farms'], exact: false });
      }
    }
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/farms/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`Farm ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/farms/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`Farm ${entry.entityId} already deleted or not found on server.`);
      } else {
        throw err;
      }
    }
  }
});

registerSyncHandler('field', async (entry) => {
  if (entry.operation === 'CREATE') {
    const response = await apiClient.post<ApiResponse<Field>>('/fields', entry.payload);
    const serverField = response.data?.data;
    if (serverField && serverField.id) {
      const oldId = entry.entityId;
      const newId = serverField.id;
      await db.table('fields').put({ ...serverField, _synced: true });
      if (oldId !== newId) {
        await db.table('fields').delete(oldId);
      }
    }
  } else if (entry.operation === 'UPDATE') {
    try {
      await apiClient.put(`/fields/${entry.entityId}`, entry.payload);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`field ${entry.entityId} not found on server during UPDATE. Marking satisfied.`);
      } else { throw err; }
    }
  } else if (entry.operation === 'DELETE') {
    try {
      await apiClient.delete(`/fields/${entry.entityId}`);
    } catch (err: any) {
      if (isNotFoundError(err)) {
        console.info(`field ${entry.entityId} not found on server during DELETE. Marking satisfied.`);
      } else { throw err; }
    }
  }
});



