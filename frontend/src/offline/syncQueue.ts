// Sync Queue — manages pending offline mutations
// Entries are processed in order with exponential backoff on failure

import { db } from './db';
import { SyncStatus } from '@/types/api';
import type { SyncQueueEntry } from '@/types/api';

const MAX_RETRY_COUNT = 10;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 60_000;

export class SyncQueue {
  /**
   * Add a mutation to the sync queue.
   * Called by useOfflineMutation after writing to IndexedDB.
   */
  async enqueue(
    entityType: string,
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: unknown,
  ): Promise<number | undefined> {
    const entry: Omit<SyncQueueEntry, 'id'> = {
      entityType,
      entityId,
      operation,
      payload,
      status: SyncStatus.PENDING,
      retryCount: 0,
      conflictStatus: 'none',
      createdAt: new Date(),
    };

    return db.syncQueue.add(entry as SyncQueueEntry);
  }

  /**
   * Get all pending entries in creation order.
   */
  async getPending(): Promise<SyncQueueEntry[]> {
    return db.syncQueue
      .where('status')
      .anyOf([SyncStatus.PENDING, SyncStatus.FAILED])
      .and((entry) => entry.retryCount < MAX_RETRY_COUNT)
      .sortBy('createdAt');
  }

  /**
   * Get count of pending (unsynced) entries.
   */
  async getPendingCount(): Promise<number> {
    return db.syncQueue
      .where('status')
      .anyOf([SyncStatus.PENDING, SyncStatus.FAILED])
      .count();
  }

  /**
   * Mark an entry as syncing (in progress).
   */
  async markSyncing(id: number): Promise<void> {
    await db.syncQueue.update(id, { status: SyncStatus.SYNCING });
  }

  /**
   * Mark an entry as successfully synced.
   */
  async markSynced(id: number): Promise<void> {
    await db.syncQueue.update(id, {
      status: SyncStatus.SYNCED,
      syncedAt: new Date(),
    });
  }

  /**
   * Mark an entry as failed with error details.
   */
  async markFailed(id: number, error: string): Promise<void> {
    const entry = await db.syncQueue.get(id);
    if (!entry) return;

    await db.syncQueue.update(id, {
      status: SyncStatus.FAILED,
      retryCount: entry.retryCount + 1,
      lastError: error,
    });
  }

  /**
   * Remove all synced entries (cleanup).
   */
  async clearSynced(): Promise<void> {
    await db.syncQueue.where('status').equals(SyncStatus.SYNCED).delete();
  }

  /**
   * Get all failed entries that have exhausted retries.
   */
  async getExhausted(): Promise<SyncQueueEntry[]> {
    return db.syncQueue
      .where('status')
      .equals(SyncStatus.FAILED)
      .and((entry) => entry.retryCount >= MAX_RETRY_COUNT)
      .toArray();
  }

  /**
   * Reset a failed entry for manual retry.
   */
  async resetForRetry(id: number): Promise<void> {
    await db.syncQueue.update(id, {
      status: SyncStatus.PENDING,
      retryCount: 0,
      lastError: undefined,
    });
  }

  /**
   * Calculate delay for exponential backoff.
   */
  static getRetryDelay(retryCount: number): number {
    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
    return Math.min(delay, MAX_RETRY_DELAY_MS);
  }
}

// Singleton instance
export const syncQueue = new SyncQueue();
