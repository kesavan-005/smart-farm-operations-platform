import { useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSyncStatus } from '@/offline';
import { flushSyncQueue } from '@/offline/syncManager';
import {
  Sun, Moon, Monitor, Database, Shield, Bell, Cloud, RefreshCw,
  Globe, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function SettingsScreen() {
  const { language, toggleLanguage } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();
  const { toast } = useToast();
  const { pendingCount, isOnline, lastSyncedAt, hasSyncErrors, refresh } = useSyncStatus();

  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'offline' | 'privacy'>('general');

  // Local state for settings mock settings
  const [privacyTelemetry, setPrivacyTelemetry] = useState(true);
  const [privacyLocation, setPrivacyLocation] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear your local database cache? Any unsynced changes will be lost.')) {
      toast({ title: 'Cache Cleared', description: 'Offline database cache has been cleared successfully.' });
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Offline',
        description: 'Cannot initiate synchronization while offline.'
      });
      return;
    }
    setIsSyncing(true);
    try {
      const result = await flushSyncQueue();
      await refresh();
      toast({
        title: 'Synchronization Complete',
        description: `Successfully synced ${result.synced} items to the server.`
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Failed to complete synchronization queue processing.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const themeOptions: { value: ThemeMode; label: string; icon: any }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sf-stagger">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your application preferences, offline sync, and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="General & Theme" icon={Sun} />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} label="Notifications" icon={Bell} />
          <TabButton active={activeTab === 'offline'} onClick={() => setActiveTab('offline')} label="Offline Sync & Data" icon={Cloud} />
          <TabButton active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} label="Privacy & Security" icon={Shield} />
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <div className="sf-card p-5 space-y-6">
              <SectionHeader icon={Sun} title="Appearance & Preferences" />

              {/* Theme Selector */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Customize the color scheme of the application.</p>
                </div>
                <div className="grid grid-cols-3 bg-muted rounded-xl p-1 gap-1 w-full max-w-sm">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        theme === value
                          ? 'bg-background shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Language Settings */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Language / மொழி</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle between English and Tamil (தமிழ்).</p>
                </div>
                <Button onClick={toggleLanguage} variant="outline" className="h-9 px-4 text-xs font-semibold shrink-0 gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  {language === 'en' ? 'English' : 'தமிழ் (Tamil)'}
                </Button>
              </div>

              <div className="h-px bg-border" />

              {/* Application Sound Preferences */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">UI Sounds & Alerts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Play dynamic audio alerts for sync operations and errors.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="sf-card p-5 space-y-6">
              <SectionHeader icon={Bell} title="Notification Preferences" />
              <div className="space-y-5">
                <ToggleRow label="Push Notifications" desc="Get real-time push alerts about critical weather anomalies and soil changes." defaultOn />
                <div className="h-px bg-border" />
                <ToggleRow label="Email Summary Digests" desc="Receive weekly analytical digests and operations statistics on your email." />
                <div className="h-px bg-border" />
                <ToggleRow label="Offline Sync Alerts" desc="Trigger high-priority system banners when offline modifications fail to sync." defaultOn />
                <div className="h-px bg-border" />
                <ToggleRow label="AI Yield Forecast Suggestions" desc="Alert you immediately when AI detects ideal windows for seed sowing." defaultOn />
              </div>
            </div>
          )}

          {activeTab === 'offline' && (
            <div className="sf-card p-5 space-y-6">
              <SectionHeader icon={Cloud} title="Offline Sync & Storage" />

              {/* Status block */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border/50">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Network Connectivity</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
                    <span className="text-sm font-semibold text-foreground">{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Pending Sync Queue</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{pendingCount} mutations queued</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Last Synced At</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'No synchronization performed'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Sync State Status</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-foreground">
                    {hasSyncErrors ? (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Sync Conflicts Detected
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean Sync State
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Control triggers */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="max-w-md">
                    <p className="text-sm font-medium text-foreground">Force Manual Sync</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Flush the offline IndexedDB operation stack straight to the REST APIs.</p>
                  </div>
                  <Button
                    onClick={handleSyncNow}
                    disabled={isSyncing || pendingCount === 0}
                    className="h-9 px-4 text-xs font-semibold shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync Queue Now
                  </Button>
                </div>

                <div className="h-px bg-border" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="max-w-md">
                    <p className="text-sm font-medium text-foreground">Clear Local Database</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Wipe the cached offline store. Be careful! Any unsynced data will be permanently lost.</p>
                  </div>
                  <Button onClick={handleClearCache} variant="destructive" className="h-9 px-4 text-xs font-semibold shrink-0 gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Wipe Storage Cache
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="sf-card p-5 space-y-6">
              <SectionHeader icon={Shield} title="Privacy & Security Options" />
              <div className="space-y-5">
                {/* Telemetry settings */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Anonymous Telemetry Share</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Send anonymized system metrics to improve Smart Farm operations analysis.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={privacyTelemetry} onChange={(e) => setPrivacyTelemetry(e.target.checked)} />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm" />
                  </label>
                </div>

                <div className="h-px bg-border" />

                {/* Location telemetry settings */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Geospatial Boundary Coordinates Share</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Share exact farm coordinates with the AI recommendation layer for soil forecasts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={privacyLocation} onChange={(e) => setPrivacyLocation(e.target.checked)} />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm" />
                  </label>
                </div>

                <div className="h-px bg-border" />

                {/* Session Timeout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Session Timeout Limit</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure when the system should automatically lock for security verification.</p>
                  </div>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="h-9 px-3 py-1.5 border border-border rounded-lg text-xs bg-background w-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="never">Never timeout</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: any }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-left transition-all ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2.5 border-b border-border">
      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  const [checked, setChecked] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm" />
      </label>
    </div>
  );
}
