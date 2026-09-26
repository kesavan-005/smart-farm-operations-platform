import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Clock, 
  Play, 
  CheckCircle2, 
  PauseCircle, 
  Layers
} from 'lucide-react';
import type { FarmTask, TaskStatus } from '@/types/task';

interface TaskKanbanProps {
  tasks: FarmTask[];
  onSelectTask: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onCreateNew: () => void;
  canCreate: boolean;
}

const COLUMNS: { id: TaskStatus; labelKey: string; colorClass: string; icon: any }[] = [
  { id: 'TODO', labelKey: 'todo', colorClass: 'border-t-slate-400 bg-slate-500/5', icon: Layers },
  { id: 'IN_PROGRESS', labelKey: 'inProgress', colorClass: 'border-t-primary bg-primary/5', icon: Play },
  { id: 'ON_HOLD', labelKey: 'onHold', colorClass: 'border-t-amber-500 bg-amber-500/5', icon: PauseCircle },
  { id: 'COMPLETED', labelKey: 'completed', colorClass: 'border-t-emerald-500 bg-emerald-500/5', icon: CheckCircle2 }
];

export default function TaskKanban({ tasks, onSelectTask, onUpdateStatus, onCreateNew, canCreate }: TaskKanbanProps) {
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    
    // Trigger update mutation
    try {
      await onUpdateStatus(taskId, targetStatus);
    } catch (err) {
      console.error('Failed to drop task:', err);
    } finally {
      setDraggedTaskId(null);
    }
  };

  const getPriorityBorder = (p: string) => {
    switch (p) {
      case 'CRITICAL': return 'border-l-4 border-l-destructive';
      case 'HIGH': return 'border-l-4 border-l-orange-500';
      case 'MEDIUM': return 'border-l-4 border-l-amber-500';
      default: return 'border-l-4 border-l-slate-300';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start select-none">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        const Icon = col.icon;

        return (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col max-h-[70vh] rounded-xl border border-border/60 border-t-4 ${col.colorClass} shadow-sm overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${
                  col.id === 'IN_PROGRESS' ? 'text-primary animate-pulse' :
                  col.id === 'COMPLETED' ? 'text-emerald-500' :
                  col.id === 'ON_HOLD' ? 'text-amber-500' : 'text-slate-400'
                }`} />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{t(col.labelKey)}</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-muted/60 text-muted-foreground rounded-full">
                {colTasks.length}
              </span>
            </div>

            {/* Content Stack */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[150px]">
              {colTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-8 text-center text-[10px] font-medium text-muted-foreground/40">
                  {isTa ? 'இங்கு பணிகள் இல்லை' : 'Empty Column'}
                </div>
              ) : (
                colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onSelectTask(task.id)}
                    className={`bg-card p-3 rounded-lg border border-border/50 shadow-sm hover:shadow hover:border-border transition-all cursor-grab active:cursor-grabbing ${getPriorityBorder(task.priority)} group relative`}
                  >
                    <h5 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors pr-1.5">{task.title}</h5>
                    
                    {task.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="mt-3.5 flex items-center justify-between gap-2 text-[10px] font-medium text-muted-foreground">
                      {/* Due Date Indicator */}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(task.dueDate).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                      </span>

                      {/* Performer Avatar */}
                      <div className="flex items-center gap-1 text-[9px]">
                        <div className="w-4.5 h-4.5 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 uppercase">
                          {task.assignedToName?.slice(0, 1) || '?'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Create Button (column specific helper) */}
            {canCreate && col.id === 'TODO' && (
              <button 
                onClick={onCreateNew}
                className="p-3 border-t border-border/40 hover:bg-muted/30 text-center text-xs font-semibold text-primary transition-colors flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t('createTask')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
