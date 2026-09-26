// Sync Status Provider — React context exposing sync state to the UI
// Consumed by the SyncIndicator component in AppLayout

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { syncQueue } from './syncQueue';

interface SyncState {
  pendingCount: number;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  hasSyncErrors: boolean;
  refresh: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncState>({
  pendingCount: 0,
  isOnline: true,
  lastSyncedAt: null,
  hasSyncErrors: false,
  refresh: async () => {},
});

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [hasSyncErrors, setHasSyncErrors] = useState(false);

  const refresh = useCallback(async () => {
    const count = await syncQueue.getPendingCount();
    setPendingCount(count);

    const exhausted = await syncQueue.getExhausted();
    setHasSyncErrors(exhausted.length > 0);

    if (count === 0 && navigator.onLine) {
      setLastSyncedAt(new Date());
    }
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll sync status every 5 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <SyncStatusContext.Provider
      value={{ pendingCount, isOnline, lastSyncedAt, hasSyncErrors, refresh }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus(): SyncState {
  return useContext(SyncStatusContext);
}
