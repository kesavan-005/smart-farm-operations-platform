import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useFarmStore } from '@/store/farmStore';
import { useFarms, useFarmContext } from '@/features/farms/api/farmsApi';
import {
  Tractor, Calendar, DollarSign, Activity, Leaf,
  PlusCircle, Bell,
  CheckCircle2, HeartPulse, AlertOctagon, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeatherOverlay } from '@/features/weather/components/WeatherOverlay';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeFarmId, initializeActiveFarm } = useFarmStore();
  
  const { data: farms, isLoading: isFarmsLoading, isError: isFarmsError } = useFarms();

  useEffect(() => {
    if (farms && farms.length > 0) {
      initializeActiveFarm(farms, user?.farmId);
    }
  }, [farms, user?.farmId, initializeActiveFarm]);

  const farmId = activeFarmId || (farms && farms.length > 0 ? farms[0]?.id : user?.farmId);
  const hasNoFarms = !isFarmsLoading && !isFarmsError && farms && farms.length === 0 && !user?.farmId;

  // Real Data: Farm Context (only fetches if farmId is valid)
  const { data: farmContext, isLoading: isContextLoading } = useFarmContext(farmId || '');

  const hour = new Date().getHours();
  const greeting = hour < 12 
    ? t('dashboard.greetingMorning', 'Good morning') 
    : hour < 17 
      ? t('dashboard.greetingAfternoon', 'Good afternoon') 
      : t('dashboard.greetingEvening', 'Good evening');

  if (isFarmsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">{t('loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (isFarmsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">{t('errorStateTitle', 'Error')}</h3>
            <p className="text-sm mt-1">{t('errorStateDescription', 'Failed to load dashboard data.')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasNoFarms) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 md:p-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
            {user?.name || 'Farmer'} 👋
          </h1>
          <p className="text-emerald-50/70 text-sm max-w-lg mb-6">
            {t('dashboard.noFarmSet', 'Your farm is not set up yet.')}
          </p>
          <Button 
            onClick={() => navigate('/onboarding')}
            className="bg-white text-emerald-800 hover:bg-emerald-50 border-none font-semibold"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {t('dashboard.setUpFarm', 'Set Up Farm')}
          </Button>
        </div>
      </div>
    );
  }

  // Farm Available State
  return (
    <div className="space-y-6 sf-stagger">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20z' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-emerald-100/80 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              {user?.name || 'Farmer'} 👋
            </h1>
            <p className="text-emerald-50/70 text-sm max-w-lg">
              {t('dashboard.overview', 'Here\'s an overview of your farm operations today.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate(`/farms/${farmId}/health`)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            >
              <HeartPulse className="w-4 h-4 mr-2 text-emerald-200" />
              {t('dashboard.farmHealth', 'Farm Health')}
            </Button>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0 hidden sm:flex">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <div className="text-xs">
                <p className="font-semibold">Local Cache</p>
                <p className="opacity-80">Synced</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isContextLoading || !farmContext ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Farm Intelligence Section */}
          <div className="mb-2 mt-8 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t('dashboard.farmIntelligence', 'Farm Intelligence')}</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('dashboard.activeFarms', 'Active Farm')}
              value={farmContext.farmProfile.name}
              icon={Tractor}
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-50 dark:bg-emerald-500/10"
              onClick={() => navigate(`/farms/${farmId}`)}
            />
            <StatCard
              title={t('dashboard.totalFields', 'Field Count')}
              value={farmContext.summary.fieldCount}
              icon={LayoutGrid}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-50 dark:bg-blue-500/10"
            />
            <StatCard
              title={t('dashboard.activeCrops', 'Active Crops')}
              value={farmContext.summary.activeCropCount}
              icon={Leaf}
              color="text-amber-600 dark:text-amber-400"
              bg="bg-amber-50 dark:bg-amber-500/10"
            />
            <StatCard
              title={t('dashboard.attentionItems', 'Attention Items')}
              value={farmContext.attentionItems.length}
              icon={AlertOctagon}
              color={farmContext.attentionItems.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}
              bg={farmContext.attentionItems.length > 0 ? "bg-rose-50 dark:bg-rose-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"}
              onClick={() => navigate(`/farms/${farmId}/health`)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <div className="sf-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.quickActions', 'Quick Actions')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ActionBtn icon={HeartPulse} label={t('dashboard.farmHealth', 'Farm Health')} onClick={() => navigate(`/farms/${farmId}/health`)} />
                  <ActionBtn icon={Leaf} label={t('dashboard.addCrop', 'Record Crop')} onClick={() => navigate(`/farms/${farmId}`)} />
                  <ActionBtn icon={Activity} label={t('dashboard.logActivity', 'Log Activity')} />
                  <ActionBtn icon={DollarSign} label={t('dashboard.addExpense', 'Add Expense')} onClick={() => navigate('/expenses')} />
                </div>
              </div>

              {/* Recent Activities from Context Engine */}
              <div className="sf-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-foreground">{t('dashboard.recentActivities', 'Recent Activities')}</h3>
                </div>
                <div className="space-y-4">
                  {farmContext.recentActivities.length > 0 ? (
                    farmContext.recentActivities.map(activity => (
                      <ActivityItem 
                        key={activity.id} 
                        icon={Calendar} 
                        title={activity.activityType} 
                        desc={activity.status} 
                        time={activity.date} 
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('activity.noActivities', 'No recent activities.')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Weather Overlay */}
              <WeatherOverlay farmId={farmId} className="w-full sm:max-w-none" />

              {/* Real Alerts from Context Engine */}
              <div className="sf-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" /> {t('nav.notifications', 'Alerts')}
                </h3>
                <div className="space-y-3">
                  {farmContext.attentionItems.length > 0 ? (
                    farmContext.attentionItems.map((item, idx) => (
                      <AlertItem 
                        key={idx} 
                        color={item.severity === 'HIGH' ? 'red' : 'amber'} 
                        title={item.title || item.type} 
                        desc={item.description} 
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('dashboard.noAttentionItems', 'No new alerts.')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Sub-components ---

function StatCard({ title, value, icon: Icon, color, bg, onClick }: any) {
  return (
    <div onClick={onClick} className={`sf-card p-4 relative overflow-hidden group ${onClick ? 'cursor-pointer sf-card-interactive' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{title}</p>
        <div className="flex items-end justify-between">
          <p className="text-lg font-bold text-foreground tracking-tight line-clamp-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group"
    >
      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

function ActivityItem({ icon: Icon, title, desc, time }: any) {
  return (
    <div className="flex gap-3 items-start group">
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground capitalize">{title?.toLowerCase().replace(/_/g, ' ')}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>
      <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap shrink-0">{time}</span>
    </div>
  );
}

function AlertItem({ color, title, desc }: any) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-800 dark:text-amber-300',
    red: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-300',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <p className="text-xs font-semibold capitalize">{title?.toLowerCase().replace(/_/g, ' ')}</p>
      <p className="text-[11px] opacity-80 mt-0.5">{desc}</p>
    </div>
  );
}
