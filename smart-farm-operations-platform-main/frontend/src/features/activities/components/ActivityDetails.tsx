import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  CheckCircle2, 
  Play, 
  XOctagon, 
  Edit, 
  Trash, 
  X,
  FileCheck,
  Eye
} from 'lucide-react';
import type { FarmActivity, ActivityStatus, ActivityPriority } from '@/types/activity';
import { Button } from '@/components/ui/button';

interface ActivityDetailsProps {
  activity: FarmActivity;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onUpdateStatus: (status: ActivityStatus) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function ActivityDetails({
  activity,
  onEdit,
  onDelete,
  onClose,
  onUpdateStatus,
  canEdit,
  canDelete
}: ActivityDetailsProps) {
  const { t, i18n } = useTranslation(['activities', 'common']);
  const isTa = i18n.language === 'ta';

  const getPriorityBadge = (priority: ActivityPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t('critical')}</span>;
      case 'HIGH':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">{t('high')}</span>;
      case 'MEDIUM':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{t('medium')}</span>;
      default:
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-muted/10">{t('low')}</span>;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{t('completed')}</span>;
      case 'IN_PROGRESS':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{t('in_progress')}</span>;
      case 'CANCELLED':
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t('cancelled')}</span>;
      default:
        return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">{t('planned')}</span>;
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
    <div className="sf-card p-6 relative max-w-2xl mx-auto sf-slide-up">
      {/* Top Close Header */}
      <div className="flex justify-between items-start border-b border-muted pb-4 mb-6">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {getActivityTypeLabel(activity.activityType)}
          </span>
          <h3 className="text-lg font-bold text-foreground mt-0.5">{activity.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body grids */}
      <div className="space-y-6">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {getStatusBadge(activity.status)}
          {getPriorityBadge(activity.priority)}
        </div>

        {/* Description */}
        {activity.description && (
          <div className="p-4 bg-muted/20 border border-muted/50 rounded-xl">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t('description')}
            </h5>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {activity.description}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
            <span>{isTa ? 'செயல்பாட்டின் முன்னேற்றம்' : 'Activity Progress'}</span>
            <span>{Math.round(activity.progress || 0)}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${activity.progress || 0}%` }} 
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {isTa 
              ? '* பணிகளின் நிறைவின் அடிப்படையில் முன்னேற்றம் தானாகவே கணக்கிடப்படுகிறது.' 
              : '* Progress is calculated automatically based on sub-task completion.'}
          </p>
        </div>

        {/* Core details mapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 border-t border-b border-muted py-5 text-sm">
          {/* Farm/Field */}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4.5 h-4.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{t('field')}</p>
              <p className="font-semibold text-foreground mt-0.5">
                {activity.fieldName} ({activity.farmName})
              </p>
              {activity.cropName && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {t('crop')}: {activity.cropName}
                </p>
              )}
            </div>
          </div>

          {/* Performer */}
          <div className="flex items-start gap-2.5">
            <UserIcon className="w-4.5 h-4.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{t('assigned_to')}</p>
              <p className="font-semibold text-foreground mt-0.5">
                {activity.performedByName || '-'}
              </p>
              {activity.performedByPhone && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {activity.performedByPhone}
                </p>
              )}
            </div>
          </div>

          {/* Supervisor */}
          <div className="flex items-start gap-2.5">
            <UserIcon className="w-4.5 h-4.5 text-primary/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'கண்காணிப்பாளர்' : 'Supervisor'}</p>
              <p className="font-semibold text-foreground mt-0.5">
                {activity.supervisorName || '-'}
              </p>
            </div>
          </div>

          {/* Season & Cost */}
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4.5 h-4.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'பருவம் / செலவு' : 'Season / Estimated Cost'}</p>
              <p className="font-semibold text-foreground mt-0.5">
                {activity.season || 'N/A'} {activity.estimatedCost ? ` / $${activity.estimatedCost}` : ''}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4.5 h-4.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">{t('scheduled_date')}</p>
              <p className="font-semibold text-foreground mt-0.5">
                {new Date(activity.scheduledDate).toLocaleString(isTa ? 'ta-IN' : 'en-US')}
              </p>
              {(activity.startDate || activity.endDate) && (
                <div className="mt-2 text-xs space-y-0.5 text-muted-foreground">
                  {activity.startDate && <p>{isTa ? 'ஆரம்பம்:' : 'Start:'} {new Date(activity.startDate).toLocaleString(isTa ? 'ta-IN' : 'en-US')}</p>}
                  {activity.endDate && <p>{isTa ? 'முடிவு:' : 'End:'} {new Date(activity.endDate).toLocaleString(isTa ? 'ta-IN' : 'en-US')}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Durations */}
          <div className="flex items-start gap-2.5">
            <Clock className="w-4.5 h-4.5 text-muted-foreground/60 shrink-0 mt-0.5" />
            <div className="w-full">
              <p className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'நேரம்' : 'Duration Tracker'}</p>
              <div className="mt-1 space-y-1">
                <p className="font-semibold text-foreground">
                  {activity.actualDuration ? `${activity.actualDuration} min` : '-'}
                  <span className="text-xs text-muted-foreground font-normal">
                    {isTa ? ' (மதிப்பீடு: ' : ' (Estimated: '} {activity.estimatedDuration || 0} min)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Required Equipment & Materials */}
          {(activity.requiredEquipment || activity.requiredInventory) && (
            <div className="flex items-start gap-2.5 md:col-span-2 border-t border-muted/30 pt-3">
              <FileCheck className="w-4.5 h-4.5 text-muted-foreground/60 shrink-0 mt-0.5" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {activity.requiredEquipment && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'தேவைப்படும் உபகரணம்' : 'Required Equipment'}</p>
                    <p className="text-xs text-foreground font-medium mt-0.5 bg-muted/30 p-1.5 rounded">{activity.requiredEquipment}</p>
                  </div>
                )}
                {activity.requiredInventory && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'தேவைப்படும் பொருட்கள்' : 'Required Materials'}</p>
                    <p className="text-xs text-foreground font-medium mt-0.5 bg-muted/30 p-1.5 rounded">{activity.requiredInventory}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Attachments & notes */}
        {(activity.attachments || activity.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity.notes && (
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-muted-foreground uppercase">{t('notes')}</h5>
                <p className="text-sm text-foreground/90 leading-relaxed bg-muted/10 p-3 rounded-lg border border-muted/50">
                  {activity.notes}
                </p>
              </div>
            )}
            {activity.attachments && (
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'கோப்பு இணைப்புகள்' : 'Attachments'}</h5>
                <a 
                  href={activity.attachments} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 bg-muted/10 border border-muted/50 hover:bg-muted/30 transition-colors rounded-lg text-sm text-primary font-semibold group"
                >
                  <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="truncate flex-1">{activity.attachments}</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quick status transition actions */}
        <div className="space-y-2 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 p-4 rounded-xl">
          <h5 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-primary" />
            {isTa ? 'விரைவு நிலை மாற்றம்' : 'Status Transition Actions'}
          </h5>
          <div className="flex flex-wrap gap-2">
            <Button
              size="xs"
              variant="outline"
              disabled={activity.status === 'IN_PROGRESS'}
              onClick={() => onUpdateStatus('IN_PROGRESS')}
              className="text-[10px] font-semibold h-8 bg-background border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-600 gap-1"
            >
              <Play className="w-3 h-3 text-blue-500" />
              {isTa ? 'செயல்பாட்டைத் தொடங்கு' : 'Start Progress'}
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={activity.status === 'COMPLETED'}
              onClick={() => onUpdateStatus('COMPLETED')}
              className="text-[10px] font-semibold h-8 bg-background border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-600 gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {isTa ? 'செயல்பாட்டை முடி' : 'Mark Completed'}
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={activity.status === 'CANCELLED'}
              onClick={() => onUpdateStatus('CANCELLED')}
              className="text-[10px] font-semibold h-8 bg-background border-destructive/30 hover:bg-destructive/5 hover:text-destructive gap-1"
            >
              <XOctagon className="w-3 h-3 text-destructive" />
              {isTa ? 'ரத்து செய்' : 'Cancel Task'}
            </Button>
          </div>
        </div>

        {/* Edit / Delete actions */}
        {(canEdit || canDelete) && (
          <div className="flex justify-between items-center border-t border-muted pt-4">
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  onClick={onEdit}
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 px-4 hover:border-primary/30 hover:text-primary transition-colors text-xs font-semibold"
                >
                  <Edit className="w-4 h-4" />
                  {t('edit_activity')}
                </Button>
              )}
            </div>
            {canDelete && (
              <Button
                onClick={onDelete}
                variant="destructive"
                className="flex items-center gap-1.5 h-9 px-4 text-xs font-semibold"
              >
                <Trash className="w-4 h-4" />
                {t('delete')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
