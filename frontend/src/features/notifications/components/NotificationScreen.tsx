import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function NotificationScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mock notifications connected to i18n keys
  const notifications = [
    {
      id: 1,
      title: t('notifications.syncCompletedTitle'),
      message: t('notifications.syncCompletedMessage'),
      time: t('notifications.minsAgo', { count: 10 }),
      type: 'success',
      read: false,
    },
    {
      id: 2,
      title: t('notifications.irrigationAlertTitle'),
      message: t('notifications.irrigationAlertMessage'),
      time: t('notifications.hoursAgo', { count: 2 }),
      type: 'warning',
      read: false,
    },
    {
      id: 3,
      title: t('notifications.inventoryAlertTitle'),
      message: t('notifications.inventoryAlertMessage'),
      time: t('notifications.yesterday'),
      type: 'warning',
      read: true,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 sf-stagger">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t('notifications.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('notifications.subtitle')}</p>
        </div>
        <Button variant="outline" className="gap-1.5 h-9 text-xs">
          <Check className="w-3.5 h-3.5" /> {t('notifications.markAllRead')}
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.noNotificationsTitle')}
          description={t('notifications.noNotificationsDesc')}
          actionLabel={t('notifications.returnToDashboard')}
          onAction={() => navigate('/dashboard')}
          secondaryActionLabel={t('notifications.configureAlerts')}
          onSecondaryAction={() => navigate('/settings')}
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`sf-card p-5 flex gap-4 transition-all ${
                notif.read ? 'opacity-70 bg-background' : 'bg-primary/[0.02] dark:bg-primary/5 border-primary/20'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {notif.type === 'success' && (
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                  </div>
                )}
                {notif.type === 'warning' && (
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="text-amber-500 w-5 h-5" />
                  </div>
                )}
                {notif.type === 'info' && (
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Info className="text-blue-500 w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`text-sm font-semibold truncate ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{notif.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
