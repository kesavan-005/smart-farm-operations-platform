import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFarms, useCreateFarm, useUpdateFarm, useDeleteFarm } from '@/features/farms/api/farmsApi';
import FarmForm, { type FarmFormData } from './FarmForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/states/EmptyState';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Tractor, Eye, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import type { Farm } from '@/types/domain';

export default function FarmListScreen() {
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({ title: isTa ? 'வெற்றிகரமாக உருவாக்கப்பட்டது' : 'Farm created successfully' });
      setView('list');
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleUpdate = async (formData: FarmFormData) => {
    if (!editingFarm) return;
    try {
      await updateFarmMutation.mutateAsync({ ...formData, id: editingFarm.id });
      toast({ title: isTa ? 'வெற்றிகரமாக புதுப்பிக்கப்பட்டது' : 'Farm updated successfully' });
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
      toast({ title: isTa ? 'வெற்றிகரமாக நீக்கப்பட்டது' : 'Farm deleted successfully' });
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
          <h2 className="text-lg font-bold text-foreground">{isTa ? 'புதிய பண்ணையைச் சேர்' : 'Add New Farm'}</h2>
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
          <h2 className="text-lg font-bold text-foreground">{isTa ? 'பண்ணையைத் திருத்து' : 'Edit Farm'}</h2>
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
            {isTa ? 'பண்ணை மேலாண்மை' : 'Farm Management'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTa ? 'உங்கள் பண்ணைகளை நிர்வகிக்கவும்' : `${farms.length} farm${farms.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <Button onClick={() => setView('create')} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 text-sm">
          <Plus className="w-4 h-4" />
          {isTa ? 'பண்ணை சேர்' : 'Add Farm'}
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
              {s === '' ? (isTa ? 'அனைத்தும்' : 'All') : s.charAt(0).toUpperCase() + s.slice(1)}
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
          title={isTa ? 'பண்ணைகள் இல்லை' : 'No farms found'}
          description={isTa ? 'உங்கள் முதல் பண்ணையை உருவாக்கவும்' : 'Get started by adding your first farm to the platform.'}
          actionLabel={isTa ? 'பண்ணை சேர்' : 'Add Farm'}
          onAction={() => setView('create')}
          secondaryActionLabel={isTa ? 'உதவி மையம்' : 'Help Center'}
          onSecondaryAction={() => navigate('/help')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sf-stagger">
          {farms.map((farm: Farm) => (
            <div key={farm.id} className="sf-card sf-card-interactive overflow-hidden group">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {isTa && farm.nameTa ? farm.nameTa : farm.name}
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">{farm.farmCode}</span>
                  </div>
                  <StatusBadge status={farm.status} />
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                  {isTa && farm.descriptionTa ? farm.descriptionTa : farm.description || (isTa ? 'விளக்கம் இல்லை' : 'No description')}
                </p>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <MetaItem label={isTa ? 'பரப்பளவு' : 'Area'} value={farm.totalArea ? `${farm.totalArea} ${farm.areaUnit || 'Acres'}` : 'N/A'} />
                  <MetaItem label={isTa ? 'இருப்பிடம்' : 'Location'} value={farm.district ? `${farm.district}, ${farm.state}` : farm.state || 'N/A'} />
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                <button
                  onClick={() => navigate(`/farms/${farm.id}`)}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> {isTa ? 'விவரம்' : 'View'}
                </button>
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
          ))}
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
