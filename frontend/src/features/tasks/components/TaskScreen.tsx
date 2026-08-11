import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ListTodo, 
  CloudOff, 
  RefreshCw, 
  Columns
} from 'lucide-react';
import { useFarms } from '@/features/farms/api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useProfile, useMyFarmRoles } from '@/features/auth/api/profileApi';
import { db } from '@/offline/db';
import { apiClient } from '@/lib/apiClient';

import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask
} from '../api/taskApi';

import TaskDashboard from './TaskDashboard';
import TaskList from './TaskList';
import TaskKanban from './TaskKanban';
import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';

export default function TaskScreen() {
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  // 1. Get farm ID context (defaults to empty string for "All Farms")
  const { data: farms = [], isLoading: loadingFarms } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const farmId = selectedFarmId; 
  const activeFarm = farms.find(f => f.id === farmId);

  // 2. Fetch fields for the selected farm
  const { data: fields = [], isLoading: loadingFields } = useFields(farmId || '00000000-0000-0000-0000-000000000000');

  // 3. Fetch workers to populate dropdowns
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await apiClient.get('/users');
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }
    loadUsers();
  }, []);

  // 4. Manage user roles & profile for permission checking
  const { data: profile } = useProfile();
  const { data: farmRoles = [] } = useMyFarmRoles();

  const userRoleOnFarm = farmId ? (farmRoles.find(r => r.farmId === farmId)?.role || 'VIEWER') : 'OWNER';
  const isOwner = farmId ? (profile?.id === activeFarm?.ownerUserId) : true;
  const isAdmin = profile?.role === 'ADMIN';
  const isWorker = farmId ? (userRoleOnFarm === 'WORKER') : false;
  
  // Permissions logic
  const canCreate = isAdmin || isOwner || userRoleOnFarm === 'OWNER' || userRoleOnFarm === 'MANAGER' || farms.length > 0;
  const canEdit = canCreate;
  const canDelete = isAdmin || isOwner || userRoleOnFarm === 'OWNER' || userRoleOnFarm === 'MANAGER';

  // 5. Tasks Filters State
  const [filters, setFilters] = useState({
    farmId: '',
    fieldId: '',
    activityId: '',
    assignedUserId: '',
    status: '',
    priority: '',
    search: '',
  });

  // Fetch tasks (inject active farmId as default context if not "All Farms")
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({
    ...filters,
    farmId: filters.farmId || farmId || undefined,
  });

  // Mutations
  const createMutation = useCreateTask(farmId || 'all');
  const updateMutation = useUpdateTask(farmId || 'all', '');
  const deleteMutation = useDeleteTask(farmId || 'all');

  // 6. Navigation Tabs & Panel States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'kanban'>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Retrieve active details for inspect/edit views
  const { data: activeTaskDetail } = useTask(selectedTaskId || editingTaskId || '');

  // 7. Online status & pending sync tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll Dexie sync queue size
    const interval = setInterval(async () => {
      try {
        const count = await db.syncQueue.count();
        setPendingChanges(count);
      } catch {
        // ignore
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Update timestamps when queries change
  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [tasks]);

  // Form Submit Handlers
  const handleCreateSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
      } as any);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingTaskId) return;
    try {
      await updateMutation.mutateAsync({
        ...data,
        id: editingTaskId,
      } as any);
      setEditingTaskId(null);
    } catch (err) {
      console.error('Failed to edit task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const confirmed = window.confirm(t('deleteConfirm'));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync({ id });
      setSelectedTaskId(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: any) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      await updateMutation.mutateAsync({
        ...task,
        status,
        id: taskId,
        farmId: task.farmId,
      } as any);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  // Main UI skeleton state
  if (loadingFarms || loadingFields || loadingTasks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-muted rounded-full" />
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {isTa ? 'பணிகளை ஏற்றுகிறது...' : 'Loading Farm Operations Tasks...'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Sub-Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListTodo className="w-7 h-7 text-primary" />
            {isTa ? 'விவசாயப் பணிகள் மேலாண்மை' : 'Farm Tasks Management'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isTa 
              ? 'பண்ணை நடவடிக்கைகளுக்கான பணிகளைத் திட்டமிட்டு, ஒதுக்கீடு செய்து, கண்காணிக்கவும்.' 
              : 'Schedule, assign, and track operational tasks across crop cycles and operations.'}
          </p>
        </div>

        {/* Farm Selector Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase">{t('farm')}:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedTaskId(null);
              setIsCreating(false);
              setEditingTaskId(null);
            }}
            className="h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            <option value="">{isTa ? 'அனைத்து பண்ணைகளும்' : 'All Farms'}</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Online/Sync Banner Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-muted/30 border border-muted rounded-xl gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
          <span className="font-semibold text-foreground">
            {isOnline 
              ? (isTa ? 'இணைப்பு ஆன்லைனில் உள்ளது' : 'System Online') 
              : (isTa ? 'ஆஃப்லைன் பயன்முறை' : 'Offline Mode (Local Cache Active)')}
          </span>
          <span className="text-muted-foreground/60">|</span>
          <span className="text-muted-foreground">{isTa ? `கடைசியாக புதுப்பிக்கப்பட்டது: ${lastRefreshed}` : `Last refreshed: ${lastRefreshed}`}</span>
        </div>
        {!isOnline && (
          <div className="flex items-center gap-1.5 text-destructive font-semibold">
            <CloudOff className="w-4 h-4" />
            {isTa ? 'மாற்றங்கள் ஆன்லைனுக்கு வந்ததும் ஒத்திசைக்கப்படும்' : 'Changes will sync once connection is restored'}
          </div>
        )}
        {pendingChanges > 0 && (
          <div className="flex items-center gap-1.5 text-primary font-semibold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {isTa ? `${pendingChanges} மாற்றங்கள் ஒத்திசைக்கப்படுகின்றன...` : `${pendingChanges} pending changes syncing...`}
          </div>
        )}
      </div>

      {/* Primary Panels / Forms Toggle Navigation */}
      {isCreating ? (
        <TaskForm
          farms={farms}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createMutation.isPending}
          isWorker={isWorker}
        />
      ) : editingTaskId && activeTaskDetail ? (
        <TaskForm
          initialData={activeTaskDetail}
          farms={farms}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingTaskId(null)}
          isSubmitting={updateMutation.isPending}
          isWorker={isWorker}
        />
      ) : selectedTaskId && activeTaskDetail ? (
        <TaskDetails
          task={activeTaskDetail}
          onEdit={() => setEditingTaskId(selectedTaskId)}
          onDelete={() => handleDeleteTask(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
          onUpdateStatus={(status) => handleUpdateStatus(selectedTaskId, status)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ) : (
        <div className="space-y-6">
          {/* Main Module Tabs Switch */}
          <div className="flex border-b border-muted">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              {t('taskDashboard')}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="w-4.5 h-4.5" />
              {t('taskList')}
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'kanban'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Columns className="w-4.5 h-4.5" />
              {t('taskKanban')}
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'dashboard' && (
            <TaskDashboard
              tasks={tasks}
              onSelectTask={setSelectedTaskId}
              onCreateNew={() => setIsCreating(true)}
              currentUserId={profile?.id || ''}
            />
          )}

          {activeTab === 'list' && (
            <TaskList
              tasks={tasks}
              fields={fields}
              filters={filters}
              onFilterChange={setFilters}
              onSelectTask={setSelectedTaskId}
              onCreateNew={() => setIsCreating(true)}
              canCreate={canCreate}
              users={users}
            />
          )}

          {activeTab === 'kanban' && (
            <TaskKanban
              tasks={tasks}
              onSelectTask={setSelectedTaskId}
              onUpdateStatus={handleUpdateStatus}
              onCreateNew={() => setIsCreating(true)}
              canCreate={canCreate}
            />
          )}
        </div>
      )}
    </div>
  );
}
