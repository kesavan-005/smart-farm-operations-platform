import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Calendar, 
  Play, 
  XOctagon, 
  ArrowUpRight, 
  Layers,
  Thermometer,
  Shield,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import type { FarmActivity } from '@/types/activity';

interface ActivityDashboardProps {
  activities: FarmActivity[];
  onSelectActivity: (id: string) => void;
  onCreateNew: () => void;
}

export default function ActivityDashboard({ activities, onSelectActivity, onCreateNew }: ActivityDashboardProps) {
  const { t, i18n } = useTranslation(['activities', 'common']);
  const isTa = i18n.language === 'ta';

  // Compute status metrics
  const total = activities.length;
  const planned = activities.filter(a => a.status === 'PLANNED').length;
  const inProgress = activities.filter(a => a.status === 'IN_PROGRESS').length;
  const completed = activities.filter(a => a.status === 'COMPLETED').length;
  const cancelled = activities.filter(a => a.status === 'CANCELLED').length;

  // Priority counts
  const critical = activities.filter(a => a.priority === 'CRITICAL').length;
  const high = activities.filter(a => a.priority === 'HIGH').length;
  const medium = activities.filter(a => a.priority === 'MEDIUM').length;
  const low = activities.filter(a => a.priority === 'LOW').length;

  // Next activities (planned or in progress, sorted by scheduledDate)
  const incoming = [...activities]
    .filter(a => a.status === 'PLANNED' || a.status === 'IN_PROGRESS')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'CANCELLED': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'IRRIGATION': return t('irrigation');
      case 'FERTILIZER': return t('fertilizer');
      case 'PESTICIDE': return t('pesticide');
      case 'HARVEST': return t('harvest');
      case 'PLANTING': return t('planting');
      case 'SOIL_TEST': return t('soil_test');
      case 'MAINTENANCE': return t('maintenance');
      case 'INSPECTION': return t('inspection');
      default: return t('other');
    }
  };

  return (
    <div className="space-y-6 sf-slide-up">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Activities Card */}
        <div className="sf-card p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform duration-300">
            <Layers className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('kpi_total')}</p>
              <h3 className="text-2xl font-bold text-foreground">{total}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Planned */}
        <div className="sf-card p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('kpi_planned')}</p>
              <h3 className="text-2xl font-bold text-foreground">{planned}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="sf-card p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('kpi_in_progress')}</p>
              <h3 className="text-2xl font-bold text-foreground">{inProgress}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse">
              <Play className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="sf-card p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('kpi_completed')}</p>
              <h3 className="text-2xl font-bold text-foreground">{completed}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Cancelled */}
        <div className="sf-card p-5 relative overflow-hidden group hover:border-destructive/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('kpi_cancelled')}</p>
              <h3 className="text-2xl font-bold text-foreground">{cancelled}</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <XOctagon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Priority and Calendar Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline & incoming activities */}
          <div className="sf-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                {t('timeline')}
              </h4>
              <button
                onClick={onCreateNew}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {t('create_activity')}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {incoming.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {t('no_activities')}
              </div>
            ) : (
              <div className="relative border-l border-muted pl-5 ml-2.5 space-y-6 py-2">
                {incoming.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Circle bullet indicator */}
                    <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 bg-background transition-transform group-hover:scale-125 ${
                      act.status === 'IN_PROGRESS' ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-amber-500'
                    }`} />
                    
                    <div 
                      onClick={() => onSelectActivity(act.id)}
                      className="sf-card p-4 hover:bg-muted/30 hover:border-primary/20 cursor-pointer transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityColor(act.priority)}`}>
                            {act.priority}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {getActivityTypeLabel(act.activityType)}
                          </span>
                        </div>
                        <h5 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                          {act.title}
                        </h5>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {act.fieldName} ({act.farmName})
                          </span>
                          {act.cropName && (
                            <span>• {act.cropName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-muted">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">
                            {new Date(act.scheduledDate).toLocaleDateString(isTa ? 'ta-IN' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {act.performedByName && (
                            <p className="text-[10px] text-muted-foreground">{act.performedByName}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(act.status)}`}>
                          {act.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: KPI Breakdown */}
        <div className="space-y-6">
          {/* Priority Breakdown */}
          <div className="sf-card p-6">
            <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('priority')}
            </h4>
            
            <div className="space-y-4">
              {/* Critical */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-destructive">{t('critical')}</span>
                  <span>{critical}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full" style={{ width: `${total ? (critical / total) * 100 : 0}%` }} />
                </div>
              </div>

              {/* High */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-orange-500">{t('high')}</span>
                  <span>{high}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${total ? (high / total) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-primary">{t('medium')}</span>
                  <span>{medium}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${total ? (medium / total) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Low */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">{t('low')}</span>
                  <span>{low}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground rounded-full" style={{ width: `${total ? (low / total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Operations Metrics */}
          <div className="sf-card p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-primary" />
              {isTa ? 'செயல்பாட்டு விழிப்புணர்வு' : 'Operational Metrics'}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {isTa 
                ? 'அனைத்து செயல்பாடுகளும் தற்போது திட்டமிட்டபடி சிறப்பாக நடைபெற்று வருகின்றன. தேதிகள் மற்றும் தொழிலாளர் சுழற்சிகளை சரிபார்க்கவும்.'
                : 'Operational security remains high. Scheduled tasks are running within standard target durations. Keep fields irrigated.'}
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-muted pt-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{isTa ? 'சராசரி நேரம்' : 'Avg Duration'}</p>
                <p className="text-lg font-bold text-foreground">
                  {total ? Math.round(activities.reduce((acc, a) => acc + (a.actualDuration || a.estimatedDuration || 0), 0) / total) : 0} {isTa ? 'நிமி' : 'min'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{isTa ? 'முடிக்கப்பட்ட வீதம்' : 'Completion Rate'}</p>
                <p className="text-lg font-bold text-foreground">
                  {total ? Math.round((completed / total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
