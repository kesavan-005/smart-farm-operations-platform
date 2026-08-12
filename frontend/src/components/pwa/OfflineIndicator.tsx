// OfflineIndicator — Global connectivity status banner
// Shows a non-intrusive indicator when the device is offline.
// Integrates with the existing SyncStatusProvider context.

import { useSyncStatus } from '@/offline';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useSyncStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[var(--z-toast)] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-medium transition-all duration-300 md:bottom-6 ${
        !isOnline
          ? 'bg-amber-600 text-white'
          : 'bg-blue-600 text-white'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline — Some data may be outdated</span>
        </>
      ) : (
        <>
          <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
          <span>Syncing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}…</span>
        </>
      )}
    </div>
  );
}
