// useOfflineMutation — the mutation hook every feature must use
// Write to IndexedDB first → update TanStack Query cache → enqueue sync
// This is the core of the offline-first architecture (ADR-001)

import { useMutation, useQueryClient, type MutationOptions } from '@tanstack/react-query';
import { db } from './db';
import { syncQueue } from './syncQueue';
import { flushSyncQueue } from './syncManager';
import { v4 as uuidv4 } from 'uuid';

interface OfflineMutationOptions<TData, TPayload> {
  /** The entity type (e.g., 'farm', 'field', 'crop', 'activity') */
  entityType: string;
  /** The Dexie table name to write to */
  tableName: string;
  /** The operation: CREATE, UPDATE, DELETE */
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  /** TanStack Query keys to invalidate on success */
  invalidateKeys?: unknown[][];
  /** Optional: transform the payload before storing locally */
  transformForLocal?: (payload: TPayload) => TData;
  /** Optional: additional TanStack Query mutation options */
  mutationOptions?: Omit<MutationOptions<TData, Error, TPayload>, 'mutationFn'>;
}

/**
 * Offline-first mutation hook.
 *
 * Usage:
 *   const { mutate } = useOfflineMutation({
 *     entityType: 'activity',
 *     tableName: 'activities',
 *     operation: 'CREATE',
 *     invalidateKeys: [['activities', cropId]],
 *   });
 *
 *   mutate({ cropId, date: '2026-01-15', description: 'Watering' });
 */
export function useOfflineMutation<
  TData extends { id: string },
  TPayload extends Record<string, unknown> = Record<string, unknown>,
>(options: OfflineMutationOptions<TData, TPayload>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TPayload>({
    mutationFn: async (payload: TPayload): Promise<TData> => {
      const {
        entityType,
        tableName,
        operation,
        transformForLocal,
      } = options;

      // Generate client-side ID for new entities
      const entityId = (payload as Record<string, unknown>).id as string ?? uuidv4();
      const now = new Date().toISOString();

      // Build the local entity
      const localEntity = (transformForLocal
        ? transformForLocal(payload)
        : {
            ...payload,
            id: entityId,
            createdAt: operation === 'CREATE' ? now : (payload as Record<string, unknown>).createdAt,
            updatedAt: now,
            _synced: false,
          }) as TData;

      // Step 1: Write to IndexedDB
      const table = db.table(tableName);
      switch (operation) {
        case 'CREATE':
          await table.add(localEntity);
          break;
        case 'UPDATE':
          await table.update(entityId, localEntity);
          break;
        case 'DELETE':
          await table.delete(entityId);
          break;
      }

      // Step 2: Enqueue for sync
      await syncQueue.enqueue(entityType, entityId, operation, payload);

      // Step 3: Attempt immediate flush if online
      if (navigator.onLine) {
        // Fire and forget — don't block the UI on network
        flushSyncQueue().catch(() => {
          // Failure is expected offline; sync queue will retry
        });
      }

      return localEntity;
    },

    onSuccess: (_data, _variables) => {
      // Step 4: Invalidate TanStack Query cache so UI re-fetches/re-reads
      if (options.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },

    ...options.mutationOptions,
  });
}
