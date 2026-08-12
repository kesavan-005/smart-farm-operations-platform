import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFarms, useCreateFarm, useUpdateFarm, useDeleteFarm } from '@/features/farms/api/farmsApi';
import { useFarmStore } from '@/store/farmStore';
import FarmForm, { type FarmFormData } from './FarmForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states/EmptyState';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Tractor, Eye, Edit2, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Farm } from '@/types/domain';

export default function FarmListScreen() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeFarmId, setActiveFarmId } = useFarmStore();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  const { data: farms = [], isLoading, error } = useFarms(search, status);
  const createFarmMutation = useCreateFarm();
  const updateFarmMutation = useUpdateFarm(editingFarm?.id || '');
  const deleteFarmMutation = useDeleteFarm();

  const handleCreate = async (formData: FarmFormData) => {
    try {
      await createFarmMutation.mutateAsync(formData);
      toast({ title: t('farm.createSuccess', 'Farm created successfully') });
      setView('list');
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleUpdate = async (formData: FarmFormData) => {
    if (!editingFarm) return;
    try {
      await updateFarmMutation.mutateAsync({ ...formData, id: editingFarm.id });
      toast({ title: t('farm.updateSuccess', 'Farm updated successfully') });
      setView('list');
      setEditingFarm(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteFarmMutation.mutateAsync({ id });
      toast({ title: t('farm.deleteSuccess', 'Farm deleted successfully') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  // Form views
  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 sf-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setView('list')}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-lg font-bold text-foreground">{t('farm.addFarm', 'Add New Farm')}</h2>
        </div>
        <FarmForm onSubmit={handleCreate} onCancel={() => setView('list')} isSubmitting={createFarmMutation.isPending} />
      </div>
    );
  }

  if (view === 'edit' && editingFarm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 sf-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => { setView('list'); setEditingFarm(null); }}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-lg font-bold text-foreground">{t('farm.editFarm', 'Edit Farm')}</h2>
        </div>
        <FarmForm initialData={editingFarm as any} onSubmit={handleUpdate} onCancel={() => { setView('list'); setEditingFarm(null); }} isSubmitting={updateFarmMutation.isPending} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sf-stagger">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {t('farm.farms', 'Farm Management')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('farm.manageSub', `${farms.length} farm${farms.length !== 1 ? 's' : ''} registered`)}
          </p>
        </div>
        <Button onClick={() => setView('create')} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 text-sm">
          <Plus className="w-4 h-4" />
          {t('farm.addFarm', 'Add Farm')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'inactive', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 h-9 rounded-lg text-xs font-medium border transition-colors ${
                status === s
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {s === '' ? t('filter', 'All') : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading farms..." />
      ) : error ? (
        <div className="sf-card p-6 text-center text-destructive text-sm">{t('errorStateTitle')}</div>
      ) : farms.length === 0 ? (
        <EmptyState
          icon={Tractor}
          title={t('farm.noFarms', 'No farms found')}
          description={t('emptyStateDescription', 'Get started by adding your first farm to the platform.')}
          actionLabel={t('farm.addFarm', 'Add Farm')}
          onAction={() => setView('create')}
          secondaryActionLabel={t('nav.help', 'Help Center')}
          onSecondaryAction={() => navigate('/help')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sf-stagger">
          {farms.map((farm: Farm) => {
            const isActive = farm.id === activeFarmId;
            const farmName = isTa && farm.nameTa ? farm.nameTa : farm.name;

            return (
              <div key={farm.id} className={`sf-card sf-card-interactive overflow-hidden group ${isActive ? 'ring-2 ring-primary border-primary/40 bg-primary/[0.02]' : ''}`}>
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {farmName}
                        </h3>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> {t('farm.activeFarm', 'Active')}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{farm.farmCode}</span>
                    </div>
                    <StatusBadge status={farm.status} />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                    {(isTa && farm.descriptionTa ? farm.descriptionTa : farm.description) || t('farm.noDescription', 'No description')}
                  </p>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetaItem label={t('farm.totalArea', 'Area')} value={farm.totalArea ? `${farm.totalArea} ${farm.areaUnit || 'Acres'}` : 'N/A'} />
                    <MetaItem label={t('farm.address', 'Location')} value={farm.district ? `${farm.district}, ${farm.state}` : farm.state || 'N/A'} />
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/farms/${farm.id}`)}
                      className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> {t('edit', 'View')}
                    </button>
                    {!isActive && (
                      <button
                        onClick={() => {
                          setActiveFarmId(farm.id);
                          toast({ title: isTa ? 'செயலில் உள்ள பண்ணை மாற்றப்பட்டது' : 'Active farm updated' });
                        }}
                        className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {t('farm.selectAsActive', 'Set Active')}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingFarm(farm); setView('edit'); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(farm.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    inactive: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    archived: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${styles[status] || styles.archived}`}>
      {status}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
