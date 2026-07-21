import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ListTodo, 
  CloudOff, 
  RefreshCw, 
  CalendarDays
} from 'lucide-react';
import { useFarms } from '@/features/farms/api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useProfile, useMyFarmRoles } from '@/features/auth/api/profileApi';
import { db } from '@/offline/db';

import {
  useActivities,
  useActivity,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity
} from '../api/activityApi';

import ActivityDashboard from './ActivityDashboard';
import ActivityList from './ActivityList';
import ActivityForm from './ActivityForm';
import ActivityDetails from './ActivityDetails';

export default function ActivityScreen() {
  const { t, i18n } = useTranslation(['activities', 'common']);
  const isTa = i18n.language === 'ta';

  // 1. Get farm ID context (default to first active farm)
  const { data: farms = [], isLoading: loadingFarms } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const farmId = selectedFarmId; // Can be "" for "All Farms"
  const activeFarm = farms.find(f => f.id === farmId);

  // 2. Fetch fields for the selected farm (use nil UUID if All Farms is selected to avoid backend parsing errors)
  const { data: fields = [], isLoading: loadingFields } = useFields(farmId || '00000000-0000-0000-0000-000000000000');

  // 4. Manage user roles & profile for permission checking
  const { data: profile } = useProfile();
  const { data: farmRoles = [] } = useMyFarmRoles();

  const userRoleOnFarm = farmId ? (farmRoles.find(r => r.farmId === farmId)?.role || 'VIEWER') : 'OWNER';
  const isOwner = farmId ? (profile?.id === activeFarm?.ownerUserId) : true;
  const isAdmin = profile?.role === 'ADMIN';
  
  // Permissions logic
  const canCreate = isAdmin || isOwner || userRoleOnFarm === 'OWNER' || userRoleOnFarm === 'MANAGER' || farms.length > 0;
  const canEdit = canCreate;
  const canDelete = isAdmin || isOwner || userRoleOnFarm === 'OWNER' || userRoleOnFarm === 'MANAGER' || farms.length > 0;

  // 5. Activities Filters
  const [filters, setFilters] = useState({
    farmId: '',
    fieldId: '',
    activityType: '',
    status: '',
    priority: '',
    search: '',
  });

  // Fetch activities (inject active farmId as default context if not "All Farms")
  const { data: activities = [], isLoading: loadingActivities } = useActivities({
    ...filters,
    farmId: filters.farmId || farmId || undefined,
  });

  // Mutations
  const createMutation = useCreateActivity(farmId || 'all');
  const updateMutation = useUpdateActivity(farmId || 'all', '');
  const deleteMutation = useDeleteActivity(farmId || 'all');

  // 6. Navigation Tabs & Panel States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // Online & sync count tracker
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(async () => {
      try {
        const count = await db.syncQueue.count();
        setPendingChanges(count);
        setLastRefreshed(new Date().toLocaleTimeString());
      } catch (err) {
        console.error(err);
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Fetch detail for selected activity if set
  const { data: activeActivityDetail } = useActivity(selectedActivityId || '');

  // 7. Handlers
  const handleCreateSubmit = async (values: any) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        farmId: values.farmId || farmId,
      });
      setIsCreating(false);
      setActiveTab('list');
    } catch (e) {
      console.error('Failed to create activity:', e);
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingActivityId) return;
    try {
      await updateMutation.mutateAsync({
        ...values,
        id: editingActivityId,
        farmId: values.farmId || farmId,
      });
      setEditingActivityId(null);
      setSelectedActivityId(editingActivityId); // Go back to details view
    } catch (e) {
      console.error('Failed to update activity:', e);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm(isTa ? 'இந்த செயல்பாட்டை நிச்சயமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this activity?')) {
      try {
        await deleteMutation.mutateAsync({ id });
        setSelectedActivityId(null);
        setActiveTab('list');
      } catch (e) {
        console.error('Failed to delete activity:', e);
      }
    }
  };

  const handleUpdateStatus = async (status: any) => {
    if (!selectedActivityId || !activeActivityDetail) return;
    try {
      await updateMutation.mutateAsync({
        ...activeActivityDetail,
        status,
        id: selectedActivityId,
        farmId: activeActivityDetail.farmId,
      } as any);
    } catch (e) {
      console.error('Failed to update activity status:', e);
    }
  };

  // Main UI skeleton state
  if (loadingFarms || loadingFields || loadingActivities) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-muted rounded-full" />
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {isTa ? 'செயல்பாடுகளை ஏற்றுகிறது...' : 'Loading Farm Operations...'}
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
            <CalendarDays className="w-7 h-7 text-primary" />
            {isTa ? 'விவசாய செயல்பாடுகள் மேலாண்மை' : 'Farm Operations Management'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isTa 
              ? 'நீர் பாசனம், உரமிடுதல், பயிரிடுதல் மற்றும் அறுவடை போன்ற பண்ணை செயல்பாடுகளை பதிவு செய்து மேலாண்மை செய்யுங்கள்.' 
              : 'Schedule, assign, and track operational activities across your fields and crop cycles.'}
          </p>
        </div>

        {/* Farm Selector Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase">{t('farm')}:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedActivityId(null);
              setIsCreating(false);
              setEditingActivityId(null);
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
        <ActivityForm
          farms={farms}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createMutation.isPending}
        />
      ) : editingActivityId && activeActivityDetail ? (
        <ActivityForm
          initialData={activeActivityDetail}
          farms={farms}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingActivityId(null)}
          isSubmitting={updateMutation.isPending}
        />
      ) : selectedActivityId && activeActivityDetail ? (
        <ActivityDetails
          activity={activeActivityDetail}
          onEdit={() => setEditingActivityId(selectedActivityId)}
          onDelete={() => handleDeleteActivity(selectedActivityId)}
          onClose={() => setSelectedActivityId(null)}
          onUpdateStatus={handleUpdateStatus}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ) : (
        <div className="space-y-6">
          {/* Main Module Tabs Switch */}
          <div className="flex border-b border-muted">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              {t('dashboard')}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="w-4.5 h-4.5" />
              {t('activities_list')}
            </button>
          </div>

          {/* Active View Container */}
          {activeTab === 'dashboard' ? (
            <ActivityDashboard
              activities={activities}
              onSelectActivity={setSelectedActivityId}
              onCreateNew={() => setIsCreating(true)}
            />
          ) : (
            <ActivityList
              activities={activities}
              farms={farms}
              fields={fields}
              filters={filters}
              setFilters={setFilters}
              onSelectActivity={setSelectedActivityId}
              onCreateNew={() => setIsCreating(true)}
              canCreate={canCreate}
            />
          )}
        </div>
      )}
    </div>
  );
}
