import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Activity as ActIcon,
  ListTodo, 
  Plus,
  CloudSun,
  Lightbulb
} from 'lucide-react';
import { useFarms } from '@/features/farms/api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useProfile, useMyFarmRoles } from '@/features/auth/api/profileApi';
import { db } from '@/offline/db';

// Core APIs
import { useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity } from '@/features/activities/api/activityApi';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/features/tasks/api/taskApi';

// Sub components
import ActivityList from '@/features/activities/components/ActivityList';
import ActivityForm from '@/features/activities/components/ActivityForm';
import ActivityDetails from '@/features/activities/components/ActivityDetails';

import TaskKanban from '@/features/tasks/components/TaskKanban';
import TaskForm from '@/features/tasks/components/TaskForm';
import TaskDetails from '@/features/tasks/components/TaskDetails';

export default function OperationsScreen() {
  const { i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  // 1. Resolve Active Farm — auto-select first farm reactively when farms load
  const { data: farms = [] } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const farmId = selectedFarmId || (farms[0]?.id ?? '');
  const activeFarm = farms.find(f => f.id === farmId);

  // Derived workflow guards — drives button enabled/disabled state
  const hasFarms = farms.length > 0;

  // Auto-select the first farm reactively (no page refresh needed after farm creation)
  useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0]?.id ?? '');
    }
  }, [farms]);

  // 2. Fetch dependencies
  const { data: fields = [] } = useFields(farmId || '00000000-0000-0000-0000-000000000000');

  // Roles & Permissions
  const { data: profile } = useProfile();
  const { data: farmRoles = [] } = useMyFarmRoles();
  const userRoleOnFarm = farmId ? (farmRoles.find(r => r.farmId === farmId)?.role || 'VIEWER') : 'OWNER';
  const isOwner = farmId ? (profile?.id === activeFarm?.ownerUserId) : true;
  const isAdmin = profile?.role === 'ADMIN';
  const isWorker = userRoleOnFarm === 'WORKER';
  const canManage = isAdmin || isOwner || userRoleOnFarm === 'OWNER' || userRoleOnFarm === 'MANAGER';

  // 3. Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'tasks'>('overview');

  // For Worker role, auto switch activeTab to tasks and restrict access to activities
  useEffect(() => {
    if (isWorker && activeTab !== 'tasks') {
      setActiveTab('tasks');
    }
  }, [isWorker]);

  // 4. Fetch Operations Center Data (only when a farm is selected)
  const { data: activities = [] } = useActivities({ farmId });
  const { data: tasks = [] } = useTasks({ farmId });

  // Derived: task creation requires at least one activity to exist first
  const hasActivities = activities.length > 0;

  // Mutations
  const createActivity = useCreateActivity(farmId);
  const updateActivity = useUpdateActivity(farmId, '');
  const deleteActivity = useDeleteActivity(farmId);

  const createTask = useCreateTask(farmId);
  const updateTask = useUpdateTask(farmId, '');
  const deleteTask = useDeleteTask(farmId);

  // UI Modals / Focus states
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Conflict or Sync banner info
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const intv = setInterval(async () => {
      try {
        const count = await db.syncQueue.count();
        setPendingChanges(count);
      } catch {}
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intv);
    };
  }, []);

  // Overview metrics calculations
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  const todayActivities = activities.filter(a => {
    const start = new Date(a.scheduledDate);
    return start >= todayStart && start <= todayEnd;
  }).length;
  const todayTasks = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return d >= todayStart && d <= todayEnd;
  }).length;
  const overdueTasksCount = tasks.filter(t => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  // AI recommendations (rule based)
  const recommendations = [];
  if (overdueTasksCount > 0) {
    recommendations.push(isTa ? `${overdueTasksCount} பணிகள் காலவரம்பைக் கடந்துள்ளன. அவற்றை பணியாளர்களுக்கு மீண்டும் ஒதுக்குங்கள்.` : `${overdueTasksCount} tasks are overdue. Re-assign them to active workers.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(isTa ? "அனைத்து செயல்பாடுகளும் திட்டமிட்டபடி சிறப்பாக இயங்குகின்றன." : "All operations are running smoothly within schedule guidelines.");
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ActIcon className="w-7 h-7 text-primary" />
            {isTa ? 'செயல்பாட்டு மையம்' : 'Operations Center'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isTa 
              ? 'பண்ணை செயல்பாடுகள், பணிகள், பழுதுபார்ப்புகள் மற்றும் தொழிலாளர்களை ஒரே இடத்திலிருந்து நிர்வகியுங்கள்.' 
              : 'Monitor, schedule, assign, execute, and analyze every farm operation from a single console.'}
          </p>
        </div>

        {/* Farm Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase">{isTa ? 'பண்ணை' : 'Farm'}:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedActivityId(null);
              setSelectedTaskId(null);
              setIsCreatingActivity(false);
              setIsCreatingTask(false);
            }}
            className="h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Online/Sync Notification Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-muted/30 border border-muted rounded-xl gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
          <span className="font-semibold text-foreground">
            {isOnline ? (isTa ? 'ஆன்லைனில் உள்ளது' : 'System Online') : (isTa ? 'ஆஃப்லைன் பயன்முறை' : 'Offline Mode')}
          </span>
          <span className="text-muted-foreground/60">|</span>
          <span>{pendingChanges > 0 ? `${pendingChanges} changes pending sync` : 'All changes synchronized'}</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto pb-px shrink-0 gap-1">
        {(isWorker ? [
          { id: 'tasks', label: isTa ? 'பணிகள்' : 'Tasks', icon: ListTodo }
        ] : [
          { id: 'overview', label: isTa ? 'கண்ணோட்டம்' : 'Overview', icon: LayoutDashboard },
          { id: 'activities', label: isTa ? 'செயல்பாடுகள்' : 'Activities', icon: ActIcon },
          { id: 'tasks', label: isTa ? 'பணிகள்' : 'Tasks', icon: ListTodo }
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedActivityId(null);
                setSelectedTaskId(null);
                setIsCreatingActivity(false);
                setIsCreatingTask(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTAINER */}
      <div className="space-y-6">
        {/* T1: OVERVIEW */}
        {activeTab === 'overview' && !isWorker && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI Panels Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-4.5 rounded-xl shadow-sm">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{isTa ? 'இன்றைய செயல்பாடுகள்' : "Today's Activities"}</span>
                <p className="text-2xl font-black text-foreground mt-2">{todayActivities}</p>
              </div>
              <div className="bg-card border border-border p-4.5 rounded-xl shadow-sm">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{isTa ? 'இன்றைய பணிகள்' : "Today's Tasks"}</span>
                <p className="text-2xl font-black text-foreground mt-2">{todayTasks}</p>
              </div>
              <div className="bg-card border border-border p-4.5 rounded-xl shadow-sm">
                <span className="text-[10px] uppercase font-bold text-destructive">{isTa ? 'காலாவதியான பணிகள்' : 'Overdue Tasks'}</span>
                <p className="text-2xl font-black text-destructive mt-2">{overdueTasksCount}</p>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">{isTa ? 'இன்றைய வானிலை' : "Today's Weather"}</h3>
                <p className="text-3xl font-extrabold text-foreground mt-2">29°C</p>
                <p className="text-xs text-muted-foreground mt-1">{isTa ? 'வெப்பம் & லேசான காற்று' : 'Sunny with light breeze'}</p>
              </div>
              <CloudSun className="w-12 h-12 text-amber-500 shrink-0" />
            </div>

            {/* AI Operational Recommendations */}
            <div className="lg:col-span-3 bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 p-5 rounded-xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Lightbulb className="w-4.5 h-4.5 animate-pulse" />
                {isTa ? 'AI செயல்பாட்டு பரிந்துரைகள்' : 'AI Operational Recommendations'}
              </h3>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="text-xs text-foreground flex items-start gap-2 bg-card p-3 rounded-lg border border-border/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* T2: ACTIVITIES */}
        {activeTab === 'activities' && (
          <div>
            {/* Guard: No farms exist yet */}
            {!hasFarms ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isTa ? 'முதலில் ஒரு பண்ணையை உருவாக்கவும்' : 'Create a Farm First'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {isTa
                    ? 'செயல்பாடுகளை உருவாக்க குறைந்தது ஒரு பண்ணை தேவை. பண்ணை மேலாண்மை பகுதிக்கு சென்று பண்ணையை உருவாக்கவும்.'
                    : 'You need at least one farm before creating activities. Go to Farm Management to create your first farm.'}
                </p>
              </div>
            ) : isCreatingActivity ? (
              <ActivityForm
                farms={farms}
                onSubmit={async (data) => {
                  try {
                    await createActivity.mutateAsync(data);
                    setIsCreatingActivity(false);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onCancel={() => setIsCreatingActivity(false)}
              />
            ) : editingActivityId ? (
              <ActivityForm
                farms={farms}
                initialData={activities.find(a => a.id === editingActivityId)}
                onSubmit={async (data) => {
                  try {
                    await updateActivity.mutateAsync({ ...data, id: editingActivityId });
                    setEditingActivityId(null);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onCancel={() => setEditingActivityId(null)}
              />
            ) : selectedActivityId ? (
              <ActivityDetails
                activity={activities.find(a => a.id === selectedActivityId)!}
                onEdit={() => setEditingActivityId(selectedActivityId)}
                onDelete={async () => {
                  if (confirm('Delete this activity?')) {
                    await deleteActivity.mutateAsync({ id: selectedActivityId });
                    setSelectedActivityId(null);
                  }
                }}
                onClose={() => setSelectedActivityId(null)}
                onUpdateStatus={async (status) => {
                  const act = activities.find(a => a.id === selectedActivityId);
                  if (act) {
                    await updateActivity.mutateAsync({ ...act, status, id: selectedActivityId });
                  }
                }}
                canEdit={canManage}
                canDelete={canManage}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-foreground">{isTa ? 'செயல்பாடுகள் மேலாண்மை' : 'Activities Management'}</h3>
                  {canManage && hasFarms && (
                    <button
                      onClick={() => setIsCreatingActivity(true)}
                      className="h-8.5 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Plus className="w-4 h-4" /> {isTa ? 'புதிய செயல்பாடு' : 'New Activity'}
                    </button>
                  )}
                </div>
                <ActivityList
                  activities={activities}
                  farms={farms}
                  fields={fields}
                  filters={{ farmId, fieldId: '', activityType: '', status: '', priority: '', search: '' }}
                  setFilters={() => {}}
                  onSelectActivity={setSelectedActivityId}
                  onCreateNew={() => setIsCreatingActivity(true)}
                  canCreate={canManage && hasFarms}
                />
              </div>
            )}
          </div>
        )}

        {/* T3: TASKS */}
        {activeTab === 'tasks' && (
          <div>
            {/* Guard: No farms exist yet */}
            {!hasFarms ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isTa ? 'முதலில் ஒரு பண்ணையை உருவாக்கவும்' : 'Create a Farm First'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {isTa ? 'பணிகளை உருவாக்க குறைந்தது ஒரு பண்ணை தேவை.' : 'You need at least one farm to create tasks.'}
                </p>
              </div>
            ) : !hasActivities && canManage ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isTa ? 'முதலில் ஒரு செயல்பாட்டை உருவாக்கவும்' : 'Create an Activity First'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {isTa
                    ? 'ஒவ்வொரு பணியும் ஒரு செயல்பாட்டின் கீழ் வர வேண்டும். செயல்பாடுகள் தாவலுக்கு சென்று முதலில் ஒரு செயல்பாட்டை உருவாக்கவும்.'
                    : 'Every task must belong to an Activity. Go to the Activities tab and create at least one activity first.'}
                </p>
                <button
                  onClick={() => setActiveTab('activities')}
                  className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                >
                  {isTa ? 'செயல்பாடுகள் தாவலுக்கு செல்' : 'Go to Activities Tab'}
                </button>
              </div>
            ) : isCreatingTask ? (
              <TaskForm
                farms={farms}
                onSubmit={async (data) => {
                  try {
                    await createTask.mutateAsync(data);
                    setIsCreatingTask(false);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onCancel={() => setIsCreatingTask(false)}
                isWorker={isWorker}
              />
            ) : editingTaskId ? (
              <TaskForm
                initialData={tasks.find(t => t.id === editingTaskId)}
                farms={farms}
                onSubmit={async (data) => {
                  try {
                    await updateTask.mutateAsync({ ...data, id: editingTaskId });
                    setEditingTaskId(null);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onCancel={() => setEditingTaskId(null)}
                isWorker={isWorker}
              />
            ) : selectedTaskId ? (
              <TaskDetails
                task={tasks.find(t => t.id === selectedTaskId)!}
                onEdit={() => setEditingTaskId(selectedTaskId)}
                onDelete={async () => {
                  if (confirm('Delete this task?')) {
                    await deleteTask.mutateAsync({ id: selectedTaskId });
                    setSelectedTaskId(null);
                  }
                }}
                onClose={() => setSelectedTaskId(null)}
                onUpdateStatus={async (status) => {
                  const tsk = tasks.find(t => t.id === selectedTaskId);
                  if (tsk) {
                    await updateTask.mutateAsync({ ...tsk, status, id: selectedTaskId });
                  }
                }}
                canEdit={canManage}
                canDelete={canManage}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-foreground">{isTa ? 'பணிகள் பட்டியல்' : 'Tasks Checklist'}</h3>
                  {canManage && hasActivities && (
                    <button
                      onClick={() => setIsCreatingTask(true)}
                      className="h-8.5 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Plus className="w-4 h-4" /> {isTa ? 'பணியை உருவாக்கு' : 'Create Task'}
                    </button>
                  )}
                </div>
                <TaskKanban
                  tasks={tasks}
                  onSelectTask={setSelectedTaskId}
                  onUpdateStatus={async (id, status) => {
                    const tsk = tasks.find(t => t.id === id);
                    if (tsk) {
                      await updateTask.mutateAsync({ ...tsk, status, id });
                    }
                  }}
                  onCreateNew={() => setIsCreatingTask(true)}
                  canCreate={canManage && hasActivities}
                />
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
