import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Play, 
  Edit, 
  Trash, 
  X,
  FileCheck,
  Flame,
  FileText,
  MessageSquare,
  Paperclip,
  History,
  Plus,
  CheckSquare,
  Camera
} from 'lucide-react';
import type { FarmTask, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { useProfile, useMyFarmRoles } from '@/features/auth/api/profileApi';
import { 
  useTaskComments, 
  useAddTaskComment, 
  useTaskChecklist, 
  useAddTaskChecklistItem,
  useToggleTaskChecklistItem, 
  useDeleteTaskChecklistItem, 
  useTaskAttachments, 
  useAddTaskAttachment, 
  useTaskHistory 
} from '@/features/tasks/api/taskApi';

interface TaskDetailsProps {
  task: FarmTask;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onUpdateStatus: (status: TaskStatus) => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
}

export default function TaskDetails({
  task,
  onEdit,
  onDelete,
  onClose,
  onUpdateStatus,
  canEdit,
  canDelete
}: TaskDetailsProps) {
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  // Role resolution
  const { data: profile } = useProfile();
  const { isOwner, isAdmin, isManager, isSupervisor, isWorker } = useMyFarmRoles(task.farmId);
  const canModifyChecklist = isAdmin || isOwner || isManager; 

  // Sub-tab State
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'comments' | 'attachments' | 'history'>('checklist');

  // Sub-resource Queries & Mutations
  const { data: checklist = [] } = useTaskChecklist(task.id);
  const addTaskChecklistItem = useAddTaskChecklistItem(task.id);
  const toggleTaskChecklistItem = useToggleTaskChecklistItem(task.id);
  const deleteTaskChecklistItem = useDeleteTaskChecklistItem(task.id);

  const { data: comments = [] } = useTaskComments(task.id);
  const addTaskComment = useAddTaskComment(task.id);

  const { data: attachments = [] } = useTaskAttachments(task.id);
  const addTaskAttachment = useAddTaskAttachment(task.id);

  const { data: history = [] } = useTaskHistory(task.id);

  // Input states
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-destructive/15 text-destructive border border-destructive/25"><Flame className="w-3.5 h-3.5 animate-pulse" /> {isTa ? 'அபாயகரமானது' : 'Critical'}</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-orange-500/15 text-orange-600 border border-orange-500/25">{isTa ? 'உயர் முன்னுரிமை' : 'High'}</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/25">{isTa ? 'நடுத்தரம்' : 'Medium'}</span>;
      case 'LOW':
        return <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-slate-500/15 text-slate-600 border border-slate-500/25">{isTa ? 'குறைவு' : 'Low'}</span>;
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'TODO':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-muted text-muted-foreground border border-muted-foreground/20">{isTa ? 'செய்ய வேண்டியவை' : 'To Do'}</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary/15 text-primary border border-primary/25">{isTa ? 'செயல்பாட்டில் உள்ளது' : 'In Progress'}</span>;
      case 'ON_HOLD':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/25">{isTa ? 'நிறுத்தி வைக்கப்பட்டுள்ளது' : 'On Hold'}</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">{isTa ? 'முடிந்தது' : 'Completed'}</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-500/15 text-slate-500 border border-slate-500/25">{isTa ? 'ரத்து செய்யப்பட்டது' : 'Cancelled'}</span>;
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    onUpdateStatus(status);
  };

  return (
    <div className="bg-card border border-border/60 shadow-sm rounded-xl p-6 relative overflow-hidden">
      {/* Header Panel */}
      <div className="flex items-start justify-between border-b border-border pb-4 mb-5">
        <div className="min-w-0 pr-4">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{task.activityTitle}</span>
          <h3 className="text-lg font-bold text-foreground truncate mt-0.5">{task.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isTa ? `பண்ணை: ${task.farmName} | வயல்: ${task.fieldName}` : `Farm: ${task.farmName} | Field: ${task.fieldName}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description and Remarks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" /> {t('description')}</h4>
              <p className="text-sm text-foreground bg-muted/30 border border-border/40 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Remarks */}
          {task.remarks && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('remarks')}</h4>
              <p className="text-sm text-foreground bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {task.remarks}
              </p>
            </div>
          )}

          {/* Quick status progress actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isTa ? 'விரைவு நிலை புதுப்பிப்பு' : 'Quick Status Change'}</h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {task.status !== 'IN_PROGRESS' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 text-xs flex items-center gap-1 font-semibold"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                >
                  <Play className="w-3.5 h-3.5" />
                  {isTa ? 'தொடங்கவும்' : 'Start Task'}
                </Button>
              )}
              {task.status !== 'COMPLETED' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-1 font-semibold"
                  onClick={() => handleStatusChange('COMPLETED')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isTa ? 'முடிக்கவும்' : 'Complete'}
                </Button>
              )}
              {task.status !== 'ON_HOLD' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs flex items-center gap-1 font-semibold"
                  onClick={() => handleStatusChange('ON_HOLD')}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {isTa ? 'நிறுத்துக' : 'Hold'}
                </Button>
              )}
            </div>
          </div>

          {/* Sub-resource Tabs Pane */}
          <div className="border-t border-border/80 pt-6 mt-6 space-y-4">
            {/* Tabs List */}
            <div className="flex border-b border-border overflow-x-auto pb-px gap-1">
              {[
                { id: 'checklist', label: isTa ? 'சரிபார்ப்பு பட்டியல்' : 'Checklist', icon: CheckSquare },
                { id: 'comments', label: isTa ? 'கருத்துகள்' : 'Comments', icon: MessageSquare },
                { id: 'attachments', label: isTa ? 'புகைப்படங்கள்' : 'Photos', icon: Camera },
                { id: 'history', label: isTa ? 'வரலாறு' : 'History', icon: History }
              ].map(subTab => {
                const Icon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all shrink-0 ${
                      activeSubTab === subTab.id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {subTab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="pt-2">
              {/* Tab 1: Checklist */}
              {activeSubTab === 'checklist' && (
                <div className="space-y-4">
                  {/* Add item (only managers/admins/owners) */}
                  {canModifyChecklist && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newChecklistItem.trim()) return;
                      await addTaskChecklistItem.mutateAsync(newChecklistItem.trim());
                      setNewChecklistItem('');
                    }} className="flex gap-2">
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={e => setNewChecklistItem(e.target.value)}
                        placeholder={isTa ? 'புதிய உருப்படியைச் சேர்க்கவும்...' : 'Add new checklist item...'}
                        className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> {isTa ? 'சேர்' : 'Add'}
                      </button>
                    </form>
                  )}

                  {/* Checklist Items list */}
                  <div className="space-y-2">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-xl hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleTaskChecklistItem.mutate(item.id)}
                            className="w-4.5 h-4.5 rounded border-input text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                          />
                          <span className={`text-sm font-semibold ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.itemName}
                          </span>
                        </div>
                        {canModifyChecklist && (
                          <button
                            onClick={() => deleteTaskChecklistItem.mutate(item.id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {checklist.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        {isTa ? 'சரிபார்ப்பு உருப்படிகள் எதுவும் இல்லை.' : 'No checklist items found.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Comments */}
              {activeSubTab === 'comments' && (
                <div className="space-y-4">
                  {/* Comments list */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-foreground">{comment.createdByName}</span>
                          <span className="text-muted-foreground/60">{new Date(comment.createdAt).toLocaleString(i18n.language)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{comment.commentText}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        {isTa ? 'கருத்துகள் எதுவும் இல்லை.' : 'No comments yet.'}
                      </div>
                    )}
                  </div>

                  {/* Add comment form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newComment.trim()) return;
                    await addTaskComment.mutateAsync(newComment.trim());
                    setNewComment('');
                  }} className="space-y-2">
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder={isTa ? 'கருத்து எழுதவும்...' : 'Write a comment...'}
                      className="w-full rounded-lg border border-input bg-background p-3 text-xs focus-visible:outline-none focus:border-primary"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addTaskComment.isPending}
                        className="h-8.5 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/95 flex items-center justify-center gap-1 shadow-sm"
                      >
                        {isTa ? 'கருத்தை பதிவிடு' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Attachments / Photos */}
              {activeSubTab === 'attachments' && (
                <div className="space-y-4">
                  {/* Uploader widget */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-border p-6 rounded-xl bg-muted/10">
                    <input
                      type="file"
                      accept="image/*"
                      id="photo-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const dataUrl = reader.result as string;
                            await addTaskAttachment.mutateAsync({
                              url: dataUrl,
                              fileName: file.name
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-muted-foreground/60" />
                      <span>{isTa ? 'புகைப்படம் பதிவேற்றவும்' : 'Upload Task Photo'}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-normal">Supports JPEG, PNG</span>
                    </label>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {attachments.map(att => (
                      <div key={att.id} className="relative group rounded-xl overflow-hidden border border-border bg-card">
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2 transition-all">
                          <span className="text-[9px] text-white font-bold truncate">{att.fileName}</span>
                          <span className="text-[8px] text-white/70">{new Date(att.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {attachments.length === 0 && (
                      <div className="col-span-3 text-center py-6 text-xs text-muted-foreground">
                        {isTa ? 'புகைப்படங்கள் எதுவும் இல்லை.' : 'No photos uploaded.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: History / Audit Log */}
              {activeSubTab === 'history' && (
                <div className="space-y-3">
                  <div className="relative border-l border-border pl-4 space-y-4">
                    {history.map(item => (
                      <div key={item.id} className="relative space-y-1">
                        {/* Circle marker */}
                        <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-foreground">{item.createdByName}</span>
                          <span className="text-muted-foreground/60">{new Date(item.createdAt).toLocaleString(i18n.language)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.actionType === 'STATUS_CHANGE' ? (
                            isTa ? `நிலை மாற்றம்: ${item.oldValue || 'None'} ➜ ${item.newValue}` : `Status changed from ${item.oldValue || 'None'} to ${item.newValue}`
                          ) : (
                            item.notes || 'Activity recorded'
                          )}
                        </p>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground -ml-4">
                        {isTa ? 'வரலாறு எதுவும் இல்லை.' : 'No history log found.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Panels */}
        <div className="space-y-5 bg-muted/20 border border-border/40 p-4.5 rounded-xl text-xs">
          <div className="space-y-3.5">
            {/* Priority */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">{t('priority')}:</span>
              {getPriorityBadge(task.priority)}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">{t('status')}:</span>
              {getStatusBadge(task.status)}
            </div>

            {/* Performed By */}
            <div className="flex items-start justify-between">
              <span className="font-semibold text-muted-foreground mt-0.5">{t('assignedTo')}:</span>
              <div className="flex items-center gap-1.5 text-right font-bold text-foreground">
                <div className="w-5.5 h-5.5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary shrink-0 uppercase font-bold">
                  {task.assignedToName?.slice(0, 2) || '?'}
                </div>
                <div>
                  <div className="truncate max-w-[120px]">{task.assignedToName || (isTa ? 'ஒதுக்கப்படவில்லை' : 'Unassigned')}</div>
                  {task.assignedToPhone && <div className="text-[10px] text-muted-foreground font-normal">{task.assignedToPhone}</div>}
                </div>
              </div>
            </div>

            {/* Hours Estimated vs Actual */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="font-semibold text-muted-foreground">{t('estimatedHours')}:</span>
              <span className="font-bold text-foreground">{task.estimatedHours != null ? `${task.estimatedHours} h` : '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">{t('actualHours')}:</span>
              <span className="font-bold text-foreground">{task.actualHours != null ? `${task.actualHours} h` : '--'}</span>
            </div>

            {/* Timelines */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="font-semibold text-muted-foreground">{t('dueDate')}:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {new Date(task.dueDate).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {task.completedDate && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">{isTa ? 'முடிந்த தேதி' : 'Completed Date'}:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                  {new Date(task.completedDate).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Creator / Date */}
            <div className="border-t border-border/50 pt-3 space-y-1.5 text-[10px] text-muted-foreground">
              <div>
                <span>{t('createdBy')}: </span>
                <span className="font-bold text-foreground">{task.createdByName || '--'}</span>
              </div>
              <div>
                <span>{t('createdAt')}: </span>
                <span>{new Date(task.createdAt).toLocaleString(i18n.language)}</span>
              </div>
              <div>
                <span>{t('updatedAt')}: </span>
                <span>{new Date(task.updatedAt).toLocaleString(i18n.language)}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 border-t border-border/50 pt-4">
            {canEdit && (
              <Button
                variant="outline"
                className="flex-1 text-xs font-semibold h-8 flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="w-3.5 h-3.5" />
                {t('editTask')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                className="flex-1 text-xs font-semibold h-8 flex items-center gap-1 shadow-sm"
                onClick={onDelete}
              >
                <Trash className="w-3.5 h-3.5" />
                {t('delete')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
