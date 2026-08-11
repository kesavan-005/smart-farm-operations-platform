import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Layers,
  User as UserIcon,
  Flame,
  Plus
} from 'lucide-react';
import type { FarmTask } from '@/types/task';

interface TaskDashboardProps {
  tasks: FarmTask[];
  onSelectTask: (id: string) => void;
  onCreateNew: () => void;
  currentUserId: string;
}

export default function TaskDashboard({ tasks, onSelectTask, onCreateNew, currentUserId }: TaskDashboardProps) {
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  // Calculate metrics
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === 'TODO').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const onHold = tasks.filter(t => t.status === 'ON_HOLD').length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;

  const pending = todo + inProgress + onHold;
  
  // Overdue
  const now = new Date();
  const overdue = tasks.filter(t => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    return new Date(t.dueDate) < now;
  }).length;

  // Assigned to me
  const myTasks = tasks.filter(t => t.assignedTo === currentUserId).length;

  // Today's tasks
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date();
  endOfToday.setHours(23,59,59,999);
  const todaysTasks = tasks.filter(t => {
    const due = new Date(t.dueDate);
    return due >= startOfToday && due <= endOfToday;
  }).length;

  // Recent 5 tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Status breakdown percentage
  const compRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progRate = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const todoRate = total > 0 ? Math.round((todo / total) * 100) : 0;

  const cardStyle = "bg-card border border-border/60 shadow-sm rounded-xl p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group";

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Tasks */}
        <div className={cardStyle}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{todaysTasks}</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('todaysTasks')}</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">{isTa ? 'இன்று முடிக்க வேண்டியவை' : 'Scheduled for today'}</p>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className={cardStyle}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{pending}</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pendingTasks')}</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">{isTa ? 'செயல்பாட்டில் உள்ளவை' : 'In backlog or progress'}</p>
          </div>
        </div>

        {/* Overdue */}
        <div className={cardStyle}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-destructive">{overdue}</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('overdueTasks')}</h3>
            <p className="text-[11px] text-destructive/60 mt-0.5">{isTa ? 'தேதி கடந்த பணிகள்' : 'Missed target due dates'}</p>
          </div>
        </div>

        {/* Completed */}
        <div className={cardStyle}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{completed}</span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('completedTasks')}</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">{isTa ? 'வெற்றிகரமாக முடிந்தது' : 'Successfully completed'}</p>
          </div>
        </div>
      </div>

      {/* Second Row: Charts & Tasks Assigned / High Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Premium Completion Chart */}
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">{t('progress')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{isTa ? 'பணிகள் நிறைவு விகிதம்' : 'Task completion rate breakdown'}</p>
          </div>

          <div className="flex flex-col items-center py-6">
            {/* Custom SVG Radial Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="60" stroke="currentColor" className="text-muted/15" strokeWidth="12" fill="transparent" />
                <circle cx="72" cy="72" r="60" stroke="currentColor" className="text-primary" strokeWidth="12" fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - compRate / 100)}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-foreground">{compRate}%</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('completed')}</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-6 text-center text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('todo')}</span>
                <div className="text-sm font-extrabold text-foreground">{todo} ({todoRate}%)</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase">{t('inProgress')}</span>
                <div className="text-sm font-extrabold text-primary">{inProgress} ({progRate}%)</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{t('completed')}</span>
                <div className="text-sm font-extrabold text-emerald-500">{completed} ({compRate}%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Priority Gauge & Quick Summaries */}
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">{isTa ? 'முன்னுரிமைப் பகுப்பாய்வு' : 'Priority Breakdown'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{isTa ? 'முக்கியத்துவம் வாரியாகப் பணிகள்' : 'High priority & critical task allocation'}</p>
          </div>

          <div className="space-y-3.5">
            {/* Critical */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-destructive flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" />{isTa ? 'அபாயகரமானது' : 'Critical'}</span>
                <span>{tasks.filter(t => t.priority === 'CRITICAL').length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive" style={{ width: `${total > 0 ? (tasks.filter(t => t.priority === 'CRITICAL').length / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-orange-500">{isTa ? 'உயர் முன்னுரிமை' : 'High'}</span>
                <span>{tasks.filter(t => t.priority === 'HIGH').length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${total > 0 ? (tasks.filter(t => t.priority === 'HIGH').length / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-500">{isTa ? 'நடுத்தரம்' : 'Medium'}</span>
                <span>{tasks.filter(t => t.priority === 'MEDIUM').length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${total > 0 ? (tasks.filter(t => t.priority === 'MEDIUM').length / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">{isTa ? 'குறைவு' : 'Low'}</span>
                <span>{tasks.filter(t => t.priority === 'LOW').length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: `${total > 0 ? (tasks.filter(t => t.priority === 'LOW').length / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5 text-primary" />{t('assignedTasks')}:</span>
            <span className="text-foreground">{myTasks}</span>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="bg-card border border-border/60 shadow-sm rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">{t('recentTasks')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{isTa ? 'சமீபத்தில் சேர்க்கப்பட்ட பணிகள்' : 'Latest logged operational tasks'}</p>
            </div>
            <button 
              onClick={onCreateNew}
              className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60">
              <Layers className="w-10 h-10 mb-2 opacity-35" />
              <p className="text-xs">{t('noTasks')}</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3.5">
              {recentTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => onSelectTask(t.id)}
                  className="flex items-start justify-between p-2.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/40 transition-all cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{t.title}</h4>
                    <p className="text-[10px] text-muted-foreground/75 truncate mt-0.5">{t.activityTitle || t.farmName}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    t.priority === 'CRITICAL' ? 'bg-destructive/10 text-destructive' :
                    t.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600' :
                    t.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-slate-500/10 text-slate-600'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
