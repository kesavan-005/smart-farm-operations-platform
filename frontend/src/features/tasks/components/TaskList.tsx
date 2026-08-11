import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Eye,
  Calendar,
  Flame
} from 'lucide-react';
import type { FarmTask, TaskStatus, TaskPriority } from '@/types/task';
import type { Field } from '@/types/domain';

interface TaskListProps {
  tasks: FarmTask[];
  fields: Field[];
  filters: {
    farmId: string;
    fieldId: string;
    activityId: string;
    assignedUserId: string;
    status: string;
    priority: string;
    search: string;
  };
  onFilterChange: (filters: any) => void;
  onSelectTask: (id: string) => void;
  onCreateNew: () => void;
  canCreate: boolean;
  users: any[];
}

export default function TaskList({ 
  tasks, 
  fields, 
  filters, 
  onFilterChange, 
  onSelectTask, 
  onCreateNew,
  canCreate,
  users
}: TaskListProps) {
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  // Sorting state
  const [sortField, setSortField] = useState<'title' | 'dueDate' | 'priority' | 'status'>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting logic
  const handleSort = (field: 'title' | 'dueDate' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const priorityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusWeights = { TODO: 1, IN_PROGRESS: 2, ON_HOLD: 3, COMPLETED: 4, CANCELLED: 5 };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'priority') {
      valA = priorityWeights[a.priority] || 0;
      valB = priorityWeights[b.priority] || 0;
    } else if (sortField === 'status') {
      valA = statusWeights[a.status] || 0;
      valB = statusWeights[b.status] || 0;
    } else if (sortField === 'dueDate') {
      valA = new Date(a.dueDate).getTime();
      valB = new Date(b.dueDate).getTime();
    } else {
      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sortedTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, startIndex + itemsPerPage);

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-destructive/10 text-destructive border border-destructive/20"><Flame className="w-3 h-3 animate-pulse" /> {isTa ? 'அபாயகரமானது' : 'Critical'}</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">{isTa ? 'உயர் முன்னுரிமை' : 'High'}</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">{isTa ? 'நடுத்தரம்' : 'Medium'}</span>;
      case 'LOW':
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">{isTa ? 'குறைவு' : 'Low'}</span>;
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'TODO':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-muted text-muted-foreground border border-muted-foreground/20">{isTa ? 'செய்ய வேண்டியவை' : 'To Do'}</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">{isTa ? 'செயல்பாட்டில்' : 'In Progress'}</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">{isTa ? 'நிறுத்தப்பட்டுள்ளது' : 'On Hold'}</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{isTa ? 'முடிந்தது' : 'Completed'}</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">{isTa ? 'ரத்து செய்யப்பட்டது' : 'Cancelled'}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Shell */}
      <div className="bg-card border border-border/60 shadow-sm rounded-xl p-4.5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder={t('titlePlaceholder')}
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full h-9.5 pl-9.5 pr-4 rounded-lg border border-input bg-background text-sm shadow-sm transition-all focus-visible:outline-none focus:border-primary"
            />
          </div>

          {/* Action trigger button */}
          {canCreate && (
            <button 
              onClick={onCreateNew}
              className="h-9.5 px-4.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5 shadow transition-all shrink-0"
            >
              <Plus className="w-4.5 h-4.5" />
              {t('createTask')}
            </button>
          )}
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Priority Filter */}
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground uppercase">{t('priority')}</span>
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
              className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 py-1 shadow-sm focus-visible:outline-none"
            >
              <option value="">{isTa ? '-- அனைத்து முன்னுரிமைகளும் --' : '-- All Priorities --'}</option>
              <option value="LOW">{isTa ? 'குறைவு' : 'Low'}</option>
              <option value="MEDIUM">{isTa ? 'நடுத்தரம்' : 'Medium'}</option>
              <option value="HIGH">{isTa ? 'உயர் முன்னுரிமை' : 'High'}</option>
              <option value="CRITICAL">{isTa ? 'அபாயகரமானது' : 'Critical'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground uppercase">{t('status')}</span>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 py-1 shadow-sm focus-visible:outline-none"
            >
              <option value="">{isTa ? '-- அனைத்து நிலைகளும் --' : '-- All Statuses --'}</option>
              <option value="TODO">{isTa ? 'செய்ய வேண்டியவை' : 'To Do'}</option>
              <option value="IN_PROGRESS">{isTa ? 'செயல்பாட்டில் உள்ளது' : 'In Progress'}</option>
              <option value="ON_HOLD">{isTa ? 'நிறுத்தி வைக்கப்பட்டுள்ளது' : 'On Hold'}</option>
              <option value="COMPLETED">{isTa ? 'முடிந்தது' : 'Completed'}</option>
              <option value="CANCELLED">{isTa ? 'ரத்து செய்யப்பட்டது' : 'Cancelled'}</option>
            </select>
          </div>

          {/* Worker Filter */}
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground uppercase">{t('assignedTo')}</span>
            <select
              value={filters.assignedUserId}
              onChange={(e) => onFilterChange({ ...filters, assignedUserId: e.target.value })}
              className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 py-1 shadow-sm focus-visible:outline-none"
            >
              <option value="">{isTa ? '-- அனைவரும் --' : '-- All Personnel --'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Field Filter */}
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground uppercase">{isTa ? 'வயல்' : 'Field'}</span>
            <select
              value={filters.fieldId}
              onChange={(e) => onFilterChange({ ...filters, fieldId: e.target.value })}
              className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 py-1 shadow-sm focus-visible:outline-none"
            >
              <option value="">{isTa ? '-- அனைத்து வயல்களும் --' : '-- All Fields --'}</option>
              {fields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tabular Grid */}
      <div className="bg-card border border-border/60 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase select-none">
                <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">
                    {t('title')}
                    {sortField === 'title' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="p-4">{t('activity')}</th>
                <th className="p-4">{t('assignedTo')}</th>
                <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1">
                    {t('priority')}
                    {sortField === 'priority' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    {t('status')}
                    {sortField === 'status' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center gap-1">
                    {t('dueDate')}
                    {sortField === 'dueDate' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground/60">
                    {t('noTasks')}
                  </td>
                </tr>
              ) : (
                paginatedTasks.map(task => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{task.title}</div>
                      {task.description && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground truncate max-w-[150px]">{task.activityTitle}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5.5 h-5.5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                          {task.assignedToName?.slice(0, 2) || '?'}
                        </div>
                        <span className="truncate text-foreground max-w-[120px]">{task.assignedToName || (isTa ? 'ஒதுக்கப்படவில்லை' : 'Unassigned')}</span>
                      </div>
                    </td>
                    <td className="p-4">{getPriorityBadge(task.priority)}</td>
                    <td className="p-4">{getStatusBadge(task.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(task.dueDate).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onSelectTask(task.id)}
                        className="p-1.5 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        title={t('taskDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginated Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
            <div className="text-xs text-muted-foreground">
              {isTa 
                ? `${totalItems} பணிகளில் ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} காட்டப்படுகின்றன` 
                : `Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems} tasks`}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1 rounded-lg border border-input bg-card hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold border ${
                    currentPage === idx + 1 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-card text-muted-foreground border-input hover:bg-muted'
                  } transition-all`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1 rounded-lg border border-input bg-card hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
