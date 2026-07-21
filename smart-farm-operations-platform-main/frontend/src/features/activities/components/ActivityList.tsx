import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Eye
} from 'lucide-react';
import type { FarmActivity, ActivityStatus, ActivityPriority } from '@/types/activity';
import type { Farm, Field } from '@/types/domain';

interface ActivityListProps {
  activities: FarmActivity[];
  farms: Farm[];
  fields: Field[];
  filters: {
    farmId: string;
    fieldId: string;
    activityType: string;
    status: string;
    priority: string;
    search: string;
  };
  setFilters: (filters: any) => void;
  onSelectActivity: (id: string) => void;
  onCreateNew: () => void;
  canCreate: boolean;
}

export default function ActivityList({ 
  activities, 
  farms, 
  fields, 
  filters, 
  setFilters, 
  onSelectActivity, 
  onCreateNew,
  canCreate
}: ActivityListProps) {
  const { t, i18n } = useTranslation(['activities', 'common']);
  const isTa = i18n.language === 'ta';

  // Sort state
  const [sortBy, setSortBy] = useState<keyof FarmActivity>('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  // Filter fields based on selected farm
  const filteredFields = filters.farmId 
    ? fields.filter(f => f.farmId === filters.farmId)
    : fields;

  const handleSort = (field: keyof FarmActivity) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => {
      const next = { ...prev, [key]: value };
      if (key === 'farmId') {
        next.fieldId = ''; // Reset field filter when farm changes
      }
      return next;
    });
    setPage(0); // Reset page on filter change
  };

  // Sort activities locally
  const sortedActivities = [...activities].sort((a, b) => {
    const aVal = a[sortBy] ?? '';
    const bVal = b[sortBy] ?? '';
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedActivities = sortedActivities.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const getPriorityBadge = (priority: ActivityPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t('critical')}</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">{t('high')}</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{t('medium')}</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-muted/10">{t('low')}</span>;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{t('completed')}</span>;
      case 'IN_PROGRESS':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{t('in_progress')}</span>;
      case 'CANCELLED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t('cancelled')}</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">{t('planned')}</span>;
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
    <div className="space-y-4 sf-slide-up">
      {/* Search & Filtering Panel */}
      <div className="sf-card p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder={isTa ? 'செயல்பாட்டைத் தேடுக...' : 'Search activities...'}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full lg:w-auto">
          {/* Farm filter */}
          <select
            value={filters.farmId}
            onChange={(e) => handleFilterChange('farmId', e.target.value)}
            className="h-9.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="">{isTa ? 'அனைத்து பண்ணைகள்' : 'All Farms'}</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Field filter */}
          <select
            value={filters.fieldId}
            onChange={(e) => handleFilterChange('fieldId', e.target.value)}
            className="h-9.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="">{isTa ? 'அனைத்து நிலங்கள்' : 'All Fields'}</option>
            {filteredFields.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={filters.activityType}
            onChange={(e) => handleFilterChange('activityType', e.target.value)}
            className="h-9.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="">{isTa ? 'அனைத்து வகைகள்' : 'All Types'}</option>
            <option value="IRRIGATION">{t('irrigation')}</option>
            <option value="FERTILIZER">{t('fertilizer')}</option>
            <option value="PESTICIDE">{t('pesticide')}</option>
            <option value="HARVEST">{t('harvest')}</option>
            <option value="PLANTING">{t('planting')}</option>
            <option value="SOIL_TEST">{t('soil_test')}</option>
            <option value="MAINTENANCE">{t('maintenance')}</option>
            <option value="INSPECTION">{t('inspection')}</option>
            <option value="OTHER">{t('other')}</option>
          </select>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-9.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="">{isTa ? 'அனைத்து நிலைகள்' : 'All Statuses'}</option>
            <option value="PLANNED">{t('planned')}</option>
            <option value="IN_PROGRESS">{t('in_progress')}</option>
            <option value="COMPLETED">{t('completed')}</option>
            <option value="CANCELLED">{t('cancelled')}</option>
          </select>

          {/* Priority filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="h-9.5 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none col-span-2 md:col-span-1"
          >
            <option value="">{isTa ? 'அனைத்து முன்னுரிமை' : 'All Priorities'}</option>
            <option value="LOW">{t('low')}</option>
            <option value="MEDIUM">{t('medium')}</option>
            <option value="HIGH">{t('high')}</option>
            <option value="CRITICAL">{t('critical')}</option>
          </select>
        </div>

        {/* Action Button */}
        {canCreate && (
          <button
            onClick={onCreateNew}
            className="h-9.5 w-full lg:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4.5 h-4.5" />
            {t('create_activity')}
          </button>
        )}
      </div>

      {/* Activities Table */}
      <div className="sf-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-muted">
                {/* Title */}
                <th 
                  onClick={() => handleSort('title')}
                  className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {t('title')}
                    {sortBy === 'title' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                
                {/* Type */}
                <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('activity_type')}
                </th>

                {/* Farm/Field */}
                <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('field')}
                </th>

                {/* Priority */}
                <th 
                  onClick={() => handleSort('priority')}
                  className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {t('priority')}
                    {sortBy === 'priority' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>

                {/* Status */}
                <th 
                  onClick={() => handleSort('status')}
                  className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {t('status')}
                    {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>

                {/* Scheduled Date */}
                <th 
                  onClick={() => handleSort('scheduledDate')}
                  className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {t('scheduled_date')}
                    {sortBy === 'scheduledDate' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>

                {/* Worker */}
                <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('assigned_to')}
                </th>

                {/* Actions */}
                <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                    {t('no_activities')}
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((act) => (
                  <tr 
                    key={act.id} 
                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => onSelectActivity(act.id)}
                  >
                    <td className="p-3 font-semibold text-foreground text-xs max-w-[200px] truncate">
                      {act.title}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {getActivityTypeLabel(act.activityType)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      <div>{act.fieldName}</div>
                      <div className="text-[10px] text-muted-foreground/80">{act.farmName}</div>
                    </td>
                    <td className="p-3 text-xs">
                      {getPriorityBadge(act.priority)}
                    </td>
                    <td className="p-3 text-xs">
                      {getStatusBadge(act.status)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(act.scheduledDate).toLocaleDateString(isTa ? 'ta-IN' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground font-medium">
                      {act.performedByName || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActivity(act.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-md transition-all text-muted-foreground hover:text-foreground"
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

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-muted bg-muted/10">
            <span className="text-xs text-muted-foreground">
              {isTa 
                ? `பக்கம் ${page + 1} / ${totalPages} (${activities.length} செயல்பாடுகள்)`
                : `Page ${page + 1} of ${totalPages} (${activities.length} activities)`}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 border border-muted hover:bg-muted/50 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 border border-muted hover:bg-muted/50 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
