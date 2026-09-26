// PWAInstallPrompt — Install banner for PWA installation
// Captures the beforeinstallprompt event and shows a non-intrusive install button.
// Hides itself after installation or user dismissal.
// Respects the 'pwa-install-dismissed' flag in localStorage to avoid repeated prompts.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed the banner
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        dismissed.current = true;
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed.current) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch {
      // User may have cancelled — safe to ignore
    } finally {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    dismissed.current = true;
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  }, []);

  if (!showBanner || isInstalled) return null;

  return (
    <div
      role="banner"
      aria-label="Install application"
      className="fixed bottom-20 inset-x-4 z-[var(--z-toast)] md:bottom-6 md:left-auto md:right-6 md:inset-x-auto md:max-w-sm sf-animate-in"
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install SmartFarm</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Get faster access and use SmartFarm like a native app — even offline.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 px-4 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Not now
            </Button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
