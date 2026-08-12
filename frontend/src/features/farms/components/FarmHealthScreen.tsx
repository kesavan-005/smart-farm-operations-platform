import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFarmContext } from '../api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useFarmStore } from '@/store/farmStore';
import {
  HeartPulse, LayoutGrid, Tractor, DollarSign, Activity, Leaf,
  Package, AlertTriangle, CheckCircle2, TrendingUp, AlertOctagon, Info
} from 'lucide-react';

import { WeatherOverlay } from '@/features/weather/components/WeatherOverlay';

export default function FarmHealthScreen() {
  const { farmId: urlFarmId } = useParams<{ farmId: string }>();
  const { i18n } = useTranslation(['common', 'nav']);
  const isTa = i18n.language === 'ta';
  const { activeFarmId, setActiveFarmId } = useFarmStore();

  const effectiveFarmId = urlFarmId || activeFarmId || '';

  useEffect(() => {
    if (urlFarmId && !activeFarmId) {
      setActiveFarmId(urlFarmId);
    }
  }, [urlFarmId, activeFarmId, setActiveFarmId]);

  const { data: context, isLoading, isError, error, isFetching } = useFarmContext(effectiveFarmId);
  const { data: fieldsList = [] } = useFields(effectiveFarmId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">
            {isTa ? 'தரவு ஏற்றப்படுகிறது...' : 'Loading Farm Health...'}
          </p>
        </div>
      </div>
    );
  }

  if (isError || !context) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">{isTa ? 'பிழை' : 'Error'}</h3>
            <p className="text-sm mt-1">
              {isTa 
                ? 'பண்ணை ஆரோக்கிய தரவை ஏற்ற முடியவில்லை.' 
                : 'Failed to load Farm Health data.'}
              <br />
              <span className="text-xs opacity-75">{String(error)}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { farmProfile, summary, cropStates, recentActivities, financeSummary, inventorySummary, attentionItems } = context;

  // Determine overall health status based on attention items
  const highSeverityItems = attentionItems.filter(item => item.severity === 'HIGH' || item.type === 'FAILED_CROP');
  const hasIssues = attentionItems.length > 0;
  
  const headerGradient = highSeverityItems.length > 0 
    ? 'from-red-700 via-red-600 to-orange-700' 
    : hasIssues 
      ? 'from-orange-600 via-orange-500 to-amber-600'
      : 'from-emerald-700 via-emerald-600 to-teal-700';

  return (
    <div className="space-y-6 sf-stagger pb-12">
      {/* Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 md:p-8 text-white transition-colors duration-500`}>
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20z' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className="h-6 w-6 text-white/90" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {isTa ? 'பண்ணை ஆரோக்கியம்' : 'Farm Health'}
              </h1>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              {farmProfile.name} • {farmProfile.location}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            {isFetching && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>{isTa ? 'புதுப்பிக்கப்படுகிறது...' : 'Syncing...'}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
              {highSeverityItems.length > 0 ? (
                <AlertOctagon className="w-5 h-5 text-red-300" />
              ) : hasIssues ? (
                <AlertTriangle className="w-5 h-5 text-orange-300" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              )}
              <div className="text-xs">
                <p className="font-semibold">
                  {highSeverityItems.length > 0 
                    ? (isTa ? 'சிக்கல் உள்ளது' : 'Critical Issues')
                    : hasIssues 
                      ? (isTa ? 'கவனம் தேவை' : 'Attention Required')
                      : (isTa ? 'நன்றாக உள்ளது' : 'Healthy')}
                </p>
                <p className="opacity-80">
                  {attentionItems.length} {isTa ? 'எச்சரிக்கைகள்' : 'alerts'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Items */}
      {attentionItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {isTa ? 'கவனம் தேவை' : 'Attention Required'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attentionItems.map((item, idx) => {
              const isHigh = item.severity === 'HIGH' || item.type === 'FAILED_CROP';
              return (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-gray-800 shadow-sm border-l-4 rounded-lg p-4 flex gap-3"
                  style={{ borderLeftColor: isHigh ? 'rgb(239, 68, 68)' : 'rgb(249, 115, 22)' }}
                >
                  <div className={`mt-0.5 ${isHigh ? 'text-red-500' : 'text-orange-500'}`}>
                    {item.type === 'OVERDUE_TASK' ? <Activity className="h-5 w-5" /> :
                     item.type === 'LOW_STOCK' ? <Package className="h-5 w-5" /> :
                     item.type === 'FAILED_CROP' ? <Leaf className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Farm Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title={isTa ? 'மொத்த நிலப்பரப்பு' : 'Total Area'} 
          value={`${summary.totalFarmArea} ${summary.areaUnit}`}
          icon={LayoutGrid}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <MetricCard 
          title={isTa ? 'வயல்கள்' : 'Fields'} 
          value={(fieldsList.length > 0 ? fieldsList.length : summary.fieldCount).toString()}
          icon={Tractor}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <MetricCard 
          title={isTa ? 'பயிர்கள்' : 'Active Crops'} 
          value={summary.activeCropCount.toString()}
          icon={Leaf}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <MetricCard 
          title={isTa ? 'இருப்பு பொருட்கள்' : 'Inventory Items'} 
          value={inventorySummary.totalUniqueItems.toString()}
          subtitle={`${inventorySummary.lowStockCount} low stock`}
          icon={Package}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Fields List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Tractor className="h-5 w-5 text-emerald-600" />
            {isTa ? 'பண்ணை வயல்கள்' : 'Farm Fields'} ({fieldsList.length > 0 ? fieldsList.length : summary.fieldCount})
          </h2>
        </div>

        {fieldsList.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            {isTa ? 'வயல்கள் எதுவும் இல்லை.' : 'No fields created for this farm yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldsList.map((f: any) => (
              <div key={f.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground">{isTa && f.nameTa ? f.nameTa : f.name}</h3>
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{f.fieldCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{f.area ? `${f.area} ${f.areaUnit || 'Acres'}` : 'N/A'}</span>
                  <span className="capitalize text-emerald-600 dark:text-emerald-400 font-medium">{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Overlay */}
        <div className="lg:col-span-1">
          <WeatherOverlay farmId={effectiveFarmId} className="w-full sm:max-w-none" />
        </div>

        {/* Crops Lifecycle Status */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              {isTa ? 'பயிர்களின் நிலை' : 'Crop Lifecycle'}
            </h2>
          </div>
          
          {cropStates.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              {isTa ? 'செயலில் பயிர்கள் இல்லை' : 'No active crops found.'}
            </div>
          ) : (
            <div className="space-y-4">
              {cropStates.map(crop => (
                <div key={crop.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{crop.name}</h3>
                      <p className="text-xs text-gray-500">{crop.variety}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {crop.currentLifecycleStage}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{isTa ? 'விதைப்பு: ' : 'Sown: '} {crop.sowingDate || 'N/A'}</span>
                    {crop.isCalculatedStage && (
                      <span className="italic flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Calculated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities & Finances */}
        <div className="space-y-6">
          {/* Finances */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              {isTa ? 'இந்த மாத செலவுகள்' : 'Current Month Expenses'}
            </h2>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {financeSummary.currency} {financeSummary.currentMonthExpenses.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-emerald-600" />
              {isTa ? 'சமீபத்திய செயல்பாடுகள்' : 'Recent Activities'}
            </h2>
            
            {recentActivities.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm">
                {isTa ? 'சமீபத்திய செயல்பாடுகள் இல்லை' : 'No recent activities found.'}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      activity.status === 'COMPLETED' ? 'bg-emerald-500' :
                      activity.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-orange-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()} • {activity.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Metric Card
function MetricCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
