// Offline module — public exports
// Every feature imports from '@/offline' — never directly from individual files

export { db, SmartFarmDB } from './db';
export { syncQueue, SyncQueue } from './syncQueue';
export { registerSyncHandler, flushSyncQueue, startSyncManager, stopSyncManager } from './syncManager';
export { useOfflineMutation } from './useOfflineMutation';
export { useOfflineQuery, useOfflineQueryById } from './useOfflineQuery';
export { SyncStatusProvider, useSyncStatus } from './SyncStatusProvider';
