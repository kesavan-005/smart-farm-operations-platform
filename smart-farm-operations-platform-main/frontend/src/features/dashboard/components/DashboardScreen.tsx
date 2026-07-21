import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useFarms } from '@/features/farms/api/farmsApi';
import {
  Tractor, CloudRain, Calendar, DollarSign, Activity, Leaf,
  Package, ArrowRight, PlusCircle, Bell, TrendingUp, TrendingDown,
  Droplets, Thermometer, Wind, Sparkles, CheckCircle2
} from 'lucide-react';

export default function DashboardScreen() {
  const { i18n } = useTranslation(['common', 'nav']);
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: farms = [] } = useFarms();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? (isTa ? 'காலை வணக்கம்' : 'Good morning') : hour < 17 ? (isTa ? 'மதிய வணக்கம்' : 'Good afternoon') : (isTa ? 'மாலை வணக்கம்' : 'Good evening');

  // Interactive state for the crop performance chart filter
  const [chartCropFilter, setChartCropFilter] = useState<'all' | 'paddy' | 'maize'>('all');

  return (
    <div className="space-y-6 sf-stagger">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20z' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-emerald-100/80 text-sm font-medium mb-1">{greeting}</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
              {user?.name || 'Farmer'} 👋
            </h1>
            <p className="text-emerald-50/70 text-sm max-w-lg">
              {isTa ? 'இன்றைய பண்ணை நடவடிக்கைகள் மற்றும் நிலவரங்களை காணலாம்.' : 'Here\'s an overview of your farm operations today.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <div className="text-xs">
              <p className="font-semibold">Local Offline Cache</p>
              <p className="opacity-80">Synced successfully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isTa ? 'பண்ணைகள்' : 'Active Farms'}
          value={farms.length || 0}
          change="+2 this month"
          trend="up"
          sparkData={[20, 25, 23, 28, 30, 35, 40]}
          icon={Tractor}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-500/10"
          onClick={() => navigate('/farms')}
        />
        <StatCard
          title={isTa ? 'பயிர்கள்' : 'Active Crops'}
          value={3}
          change="1 harvesting"
          trend="up"
          sparkData={[10, 15, 12, 18, 15, 22, 25]}
          icon={Leaf}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          title={isTa ? 'பணிகள்' : 'Today\'s Tasks'}
          value={4}
          change="2 pending"
          trend="down"
          sparkData={[50, 45, 48, 42, 38, 32, 28]}
          icon={Calendar}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard
          title={isTa ? 'செலவுகள்' : 'Monthly Expenses'}
          value="₹12,500"
          change="-8% vs last"
          trend="down"
          sparkData={[70, 65, 80, 75, 62, 58, 52]}
          icon={DollarSign}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-50 dark:bg-rose-500/10"
          onClick={() => navigate('/expenses')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analytics Chart Card */}
          <div className="sf-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{isTa ? 'பயிர் மகசூல் பகுப்பாய்வு' : 'Yield & Expense Analytics'}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Crop yield projections and corresponding management expenses.</p>
              </div>
              <div className="flex bg-muted p-0.5 rounded-lg text-xs gap-0.5 self-start">
                <button
                  onClick={() => setChartCropFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${chartCropFilter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  All Crops
                </button>
                <button
                  onClick={() => setChartCropFilter('paddy')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${chartCropFilter === 'paddy' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  Paddy
                </button>
                <button
                  onClick={() => setChartCropFilter('maize')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${chartCropFilter === 'maize' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  Maize
                </button>
              </div>
            </div>

            {/* Custom SVG Area & Bar Chart */}
            <div className="h-64 w-full relative pt-4">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="30" y1="20" x2="480" y2="20" className="stroke-border" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="30" y1="70" x2="480" y2="70" className="stroke-border" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="30" y1="120" x2="480" y2="120" className="stroke-border" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="30" y1="170" x2="480" y2="170" className="stroke-border" strokeWidth="1" />

                {/* Area Gradient Definitions */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--color-primary))" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="hsl(var(--color-primary))" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Simulated Data Render */}
                {chartCropFilter === 'all' && (
                  <>
                    {/* Projection Line & Area (All Crops) */}
                    <path
                      d="M 30,150 Q 105,120 180,90 T 330,60 T 480,30 L 480,170 L 30,170 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M 30,150 Q 105,120 180,90 T 330,60 T 480,30"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="2.5"
                    />
                    {/* Cost Bars */}
                    <rect x="50" y="130" width="16" height="40" rx="3" className="fill-destructive/20 hover:fill-destructive/30 transition-colors" />
                    <rect x="125" y="110" width="16" height="60" rx="3" className="fill-destructive/20 hover:fill-destructive/30 transition-colors" />
                    <rect x="200" y="80" width="16" height="90" rx="3" className="fill-destructive/20 hover:fill-destructive/30 transition-colors" />
                    <rect x="275" y="95" width="16" height="75" rx="3" className="fill-destructive/20 hover:fill-destructive/30 transition-colors" />
                    <rect x="350" y="70" width="16" height="100" rx="3" className="fill-destructive/20 hover:fill-destructive/30 transition-colors" />
                    <rect x="425" y="40" width="16" height="130" rx="3" className="fill-destructive/20 hover:fill-destructive/30 transition-colors" />
                  </>
                )}

                {chartCropFilter === 'paddy' && (
                  <>
                    <path
                      d="M 30,160 Q 105,110 180,120 T 330,80 T 480,45 L 480,170 L 30,170 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M 30,160 Q 105,110 180,120 T 330,80 T 480,45"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="2.5"
                    />
                    <rect x="50" y="145" width="16" height="25" rx="3" className="fill-primary/20" />
                    <rect x="125" y="120" width="16" height="50" rx="3" className="fill-primary/20" />
                    <rect x="200" y="110" width="16" height="60" rx="3" className="fill-primary/20" />
                    <rect x="275" y="90" width="16" height="80" rx="3" className="fill-primary/20" />
                    <rect x="350" y="75" width="16" height="95" rx="3" className="fill-primary/20" />
                    <rect x="425" y="60" width="16" height="110" rx="3" className="fill-primary/20" />
                  </>
                )}

                {chartCropFilter === 'maize' && (
                  <>
                    <path
                      d="M 30,140 Q 105,130 180,95 T 330,70 T 480,50 L 480,170 L 30,170 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M 30,140 Q 105,130 180,95 T 330,70 T 480,50"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="2.5"
                    />
                    <rect x="50" y="125" width="16" height="45" rx="3" className="fill-amber-500/20" />
                    <rect x="125" y="130" width="16" height="40" rx="3" className="fill-amber-500/20" />
                    <rect x="200" y="90" width="16" height="80" rx="3" className="fill-amber-500/20" />
                    <rect x="275" y="85" width="16" height="85" rx="3" className="fill-amber-500/20" />
                    <rect x="350" y="65" width="16" height="105" rx="3" className="fill-amber-500/20" />
                    <rect x="425" y="55" width="16" height="115" rx="3" className="fill-amber-500/20" />
                  </>
                )}

                {/* X Axis Labels */}
                <text x="50" y="190" className="fill-muted-foreground text-[9px] font-semibold text-center">Jan</text>
                <text x="125" y="190" className="fill-muted-foreground text-[9px] font-semibold">Mar</text>
                <text x="200" y="190" className="fill-muted-foreground text-[9px] font-semibold">May</text>
                <text x="275" y="190" className="fill-muted-foreground text-[9px] font-semibold">Jul</text>
                <text x="350" y="190" className="fill-muted-foreground text-[9px] font-semibold">Sep</text>
                <text x="425" y="190" className="fill-muted-foreground text-[9px] font-semibold">Nov</text>
              </svg>

              {/* Legend overlay */}
              <div className="absolute top-2 left-6 flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-primary" />
                  <span className="text-foreground">Projected Yield</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-destructive/30" />
                  <span className="text-foreground">Operational Cost</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">{isTa ? 'விரைவான செயல்கள்' : 'Quick Actions'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ActionBtn icon={PlusCircle} label={isTa ? 'பண்ணை சேர்' : 'Add Farm'} onClick={() => navigate('/farms')} />
              <ActionBtn icon={Leaf} label={isTa ? 'பயிர் பதிவு' : 'Record Crop'} />
              <ActionBtn icon={Activity} label={isTa ? 'செயல்பாடு' : 'Log Activity'} />
              <ActionBtn icon={DollarSign} label={isTa ? 'செலவு சேர்' : 'Add Expense'} onClick={() => navigate('/expenses')} />
            </div>
          </div>

          {/* Recent Activities */}
          <div className="sf-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-foreground">{isTa ? 'சமீபத்திய செயல்பாடுகள்' : 'Recent Activities'}</h3>
              <button className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              <ActivityItem icon={Tractor} title="Field plowing completed" desc="North Field — Green Valley Farm" time="2 hours ago" />
              <ActivityItem icon={Leaf} title="Paddy seeds sown" desc="East Field — 10 kgs seeds used" time="5 hours ago" />
              <ActivityItem icon={Package} title="Fertilizer stock updated" desc="Added 50 kgs Urea to inventory" time="Yesterday" />
              <ActivityItem icon={DollarSign} title="Labour expense recorded" desc="₹2,400 — 3 workers for planting" time="Yesterday" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Weather */}
          <div className="sf-card overflow-hidden">
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sky-100 text-xs font-medium mb-1">Chennai, TN</p>
                  <h3 className="text-3xl font-bold tracking-tight">32°C</h3>
                  <p className="text-sky-100/80 text-xs mt-1">Partly cloudy</p>
                </div>
                <CloudRain className="w-10 h-10 text-sky-200/60" />
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <WeatherMini icon={Droplets} label="Humidity" value="68%" />
              <WeatherMini icon={Wind} label="Wind" value="12 km/h" />
              <WeatherMini icon={Thermometer} label="Feels" value="35°C" />
            </div>
          </div>

          {/* Notifications */}
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> {isTa ? 'அறிவிப்புகள்' : 'Alerts'}
            </h3>
            <div className="space-y-3">
              <AlertItem color="amber" title="Irrigation Due" desc="Tomato crop in Sector A needs watering." />
              <AlertItem color="red" title="Low Inventory" desc="Pesticide stock below minimum." />
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="sf-card p-5 border-primary/20 bg-primary/[0.02] dark:bg-primary/5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> {isTa ? 'AI பரிந்துரைகள்' : 'AI Insights'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on current weather patterns and soil moisture data, consider starting irrigation for your paddy fields within the next 48 hours for optimal yield.
            </p>
            <button className="mt-3 text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              Learn more <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ title, value, change, trend, sparkData, icon: Icon, color, bg, onClick }: any) {
  return (
    <div onClick={onClick} className={`sf-card p-4 relative overflow-hidden group ${onClick ? 'cursor-pointer sf-card-interactive' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {change.split(' ')[0]}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              {change.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{title}</p>
        <div className="flex items-end justify-between">
          <p className="text-lg font-bold text-foreground tracking-tight">{value}</p>
          
          {/* Custom Mini Sparkline SVG */}
          {sparkData && (
            <div className="h-6 w-16 opacity-75 group-hover:opacity-100 transition-opacity">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d={sparkData.reduce((acc: string, val: number, i: number) => {
                    const x = (i / (sparkData.length - 1)) * 100;
                    const y = 30 - ((val - 10) / (70 - 10)) * 30; // map value to height
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  }, '')}
                  fill="none"
                  className={trend === 'up' ? 'stroke-emerald-500' : 'stroke-rose-500'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
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
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>
      <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap shrink-0">{time}</span>
    </div>
  );
}

function WeatherMini({ icon: Icon, label, value }: any) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-xs font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
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
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[11px] opacity-80 mt-0.5">{desc}</p>
    </div>
  );
}
