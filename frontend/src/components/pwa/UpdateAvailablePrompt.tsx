// UpdateAvailablePrompt — Notifies the user when a new service worker version is available.
// Works with vite-plugin-pwa's 'prompt' registerType.
// The user can choose to update; the page will reload to activate the new service worker.

import { useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateAvailablePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Periodically check for SW updates (every 60 minutes)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  const handleDismiss = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 inset-x-4 z-[var(--z-toast)] md:left-auto md:right-6 md:inset-x-auto md:max-w-sm sf-animate-in"
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <RefreshCw className="w-5 h-5 text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">New version available</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            A new SmartFarm version is ready. Update now for the latest features and fixes.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <Button
              size="sm"
              onClick={handleUpdate}
              className="h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Later
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss update notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
