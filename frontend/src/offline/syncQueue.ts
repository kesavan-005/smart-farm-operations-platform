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
   * Reset entries stuck in SYNCING state (e.g. from page reload) back to PENDING.
   */
  async resetStuckSyncing(): Promise<void> {
    const stuck = await db.syncQueue
      .where('status')
      .equals(SyncStatus.SYNCING)
      .toArray();

    for (const entry of stuck) {
      if (entry.id) {
        await db.syncQueue.update(entry.id, { status: SyncStatus.PENDING });
      }
    }
  }

  /**
   * Get all pending entries in creation order.
   */
  async getPending(): Promise<SyncQueueEntry[]> {
    await this.resetStuckSyncing();
    return db.syncQueue
      .where('status')
      .anyOf([SyncStatus.PENDING, SyncStatus.FAILED])
      .and((entry) => entry.retryCount < MAX_RETRY_COUNT)
      .sortBy('createdAt');
  }

  /**
   * Get count of pending (unsynced) active entries.
   */
  async getPendingCount(): Promise<number> {
    const entries = await db.syncQueue
      .where('status')
      .anyOf([SyncStatus.PENDING, SyncStatus.SYNCING, SyncStatus.FAILED])
      .toArray();

    return entries.filter((entry) => entry.retryCount < MAX_RETRY_COUNT).length;
  }

  /**
   * Mark an entry as syncing (in progress).
   */
  async markSyncing(id: number): Promise<void> {
    await db.syncQueue.update(id, { status: SyncStatus.SYNCING });
  }

  /**
   * Mark an entry as successfully synced — and delete it immediately from the queue.
   */
  async markSynced(id: number): Promise<void> {
    await db.syncQueue.delete(id);
  }

  /**
   * Mark an entry as failed with error details.
   */
  async markFailed(id: number, error: string): Promise<void> {
    const entry = await db.syncQueue.get(id);
    if (!entry) return;

    const newRetryCount = entry.retryCount + 1;
    if (newRetryCount >= MAX_RETRY_COUNT) {
      console.warn(`Sync entry ${id} for ${entry.entityType} exhausted retries (${newRetryCount}). Removing from queue.`);
      await db.syncQueue.delete(id);
    } else {
      await db.syncQueue.update(id, {
        status: SyncStatus.FAILED,
        retryCount: newRetryCount,
        lastError: error,
      });
    }
  }

  /**
   * Remove all synced entries (cleanup).
   */
  async clearSynced(): Promise<void> {
    await db.syncQueue.where('status').equals(SyncStatus.SYNCED).delete();
  }

  /**
   * Clean up any stale or orphaned entries in the sync queue.
   */
  async cleanup(): Promise<void> {
    await this.clearSynced();
    await this.resetStuckSyncing();
    const exhausted = await db.syncQueue
      .where('status')
      .equals(SyncStatus.FAILED)
      .and((entry) => entry.retryCount >= MAX_RETRY_COUNT)
      .toArray();
    for (const entry of exhausted) {
      if (entry.id) {
        await db.syncQueue.delete(entry.id);
      }
    }
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
