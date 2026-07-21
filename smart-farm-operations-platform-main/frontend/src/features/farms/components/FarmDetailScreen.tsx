import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFarm } from '@/features/farms/api/farmsApi';
import { useFields, useCreateField, useUpdateField, useDeleteField } from '@/features/fields/api/fieldsApi';
import FieldForm from '@/features/fields/components/FieldForm';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { EmptyState } from '@/components/ui/states/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, MapPin, Activity, Clock, FileText, Leaf, Edit2, Trash2, Eye, Beaker } from 'lucide-react';
import type { Field } from '@/types/domain';

export default function FarmDetailScreen() {
  const { farmId = '' } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'stats' | 'timeline' | 'docs'>('overview');
  const [fieldView, setFieldView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingField, setEditingField] = useState<Field | null>(null);

  const { data: farm, isLoading: isFarmLoading, error: farmError } = useFarm(farmId);
  const { data: fields = [], isLoading: isFieldsLoading } = useFields(farmId);

  const createFieldMutation = useCreateField(farmId);
  const updateFieldMutation = useUpdateField(farmId, editingField?.id || '');
  const deleteFieldMutation = useDeleteField(farmId);

  const handleCreateField = async (formData: any) => {
    try {
      await createFieldMutation.mutateAsync({ ...formData, farmId });
      toast({ title: isTa ? 'நிலம் உருவாக்கப்பட்டது' : 'Field created successfully' });
      setFieldView('list');
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleUpdateField = async (formData: any) => {
    if (!editingField) return;
    try {
      await updateFieldMutation.mutateAsync({ ...formData, id: editingField.id });
      toast({ title: isTa ? 'நிலம் புதுப்பிக்கப்பட்டது' : 'Field updated successfully' });
      setFieldView('list');
      setEditingField(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteFieldMutation.mutateAsync({ id });
      toast({ title: isTa ? 'நிலம் நீக்கப்பட்டது' : 'Field deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  if (isFarmLoading) return <LoadingState message="Loading farm details..." />;
  if (farmError || !farm) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center sf-card p-8">
        <h3 className="text-sm font-medium text-destructive mb-4">{t('errorStateTitle')}</h3>
        <Button onClick={() => navigate('/farms')} variant="outline" className="gap-1.5 h-9">
          <ArrowLeft className="w-4 h-4" /> Back to Farms
        </Button>
      </div>
    );
  }

  const farmName = isTa && farm.nameTa ? farm.nameTa : farm.name;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/farms')} className="text-muted-foreground mb-3 gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Farms
        </Button>

        <div className="sf-card overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-emerald-700 to-teal-800" />
          <div className="px-5 pb-5 -mt-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <div className="w-14 h-14 rounded-xl bg-card border-2 border-card shadow-md flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{farmName}</h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{farm.farmCode}</span>
                  {farm.totalArea && <span>• {farm.totalArea} {farm.areaUnit}</span>}
                </div>
              </div>
            </div>
            <Button className="gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs" onClick={() => { setActiveTab('fields'); setFieldView('create'); }}>
              <Plus className="w-3.5 h-3.5" /> Add Field
            </Button>
          </div>

          {/* Tabs */}
          <div className="px-5 border-t border-border flex overflow-x-auto hide-scrollbar">
            {[
              { key: 'overview', icon: MapPin, label: 'Overview' },
              { key: 'fields', icon: Leaf, label: `Fields (${fields.length})` },
              { key: 'stats', icon: Activity, label: 'Statistics' },
              { key: 'timeline', icon: Clock, label: 'Timeline' },
              { key: 'docs', icon: FileText, label: 'Documents' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sf-stagger">
          <div className="lg:col-span-2 space-y-6">
            <div className="sf-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isTa && farm.descriptionTa ? farm.descriptionTa : farm.description || 'No description provided.'}
              </p>
            </div>

            <div className="sf-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-primary" /> Soil & Water Profile
                </h3>
                <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">AI-Ready</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetaBlock label="Soil pH" value={farm.soilPh} />
                <MetaBlock label="Organic Carbon" value={farm.soilOrganicCarbon ? `${farm.soilOrganicCarbon}%` : null} />
                <MetaBlock label="Rainfall (Avg)" value={farm.averageRainfall ? `${farm.averageRainfall} mm` : null} />
                <MetaBlock label="Water Source" value={farm.waterSource} />
                <MetaBlock label="Water Availability" value={farm.waterAvailability} />
                <MetaBlock label="Drainage" value={farm.drainageType} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sf-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Location
              </h3>
              <div className="space-y-3 text-sm">
                <div><p className="text-xs text-muted-foreground mb-0.5">Village</p><p className="font-medium text-foreground">{farm.village || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">District & State</p><p className="font-medium text-foreground">{farm.district}, {farm.state} {farm.pincode}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="sf-slide-up">
          {fieldView === 'create' && (
            <div className="sf-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Add New Field</h2>
              <FieldForm onSubmit={handleCreateField} onCancel={() => setFieldView('list')} isSubmitting={createFieldMutation.isPending} />
            </div>
          )}
          {fieldView === 'edit' && editingField && (
            <div className="sf-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Edit Field</h2>
              <FieldForm initialData={editingField as any} onSubmit={handleUpdateField} onCancel={() => { setFieldView('list'); setEditingField(null); }} isSubmitting={updateFieldMutation.isPending} />
            </div>
          )}
          {fieldView === 'list' && (
            <>
              {isFieldsLoading ? (
                <LoadingState message="Loading fields..." />
              ) : fields.length === 0 ? (
                <EmptyState
                  icon={Leaf}
                  title="No fields yet"
                  description="Add your first field to start tracking crops."
                  actionLabel="Add Field"
                  onAction={() => setFieldView('create')}
                  secondaryActionLabel="Go back to Dashboard"
                  onSecondaryAction={() => navigate('/dashboard')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sf-stagger">
                  {fields.map((field: Field) => (
                    <div key={field.id} className="sf-card sf-card-interactive overflow-hidden group">
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {isTa && field.nameTa ? field.nameTa : field.name}
                            </h3>
                            <span className="text-[10px] font-mono text-muted-foreground">{field.fieldCode}</span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            {field.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-lg">
                          <div><p className="text-[10px] text-muted-foreground font-medium">Area</p><p className="text-xs font-semibold text-foreground">{field.area ? `${field.area} ${field.areaUnit}` : 'N/A'}</p></div>
                          <div><p className="text-[10px] text-muted-foreground font-medium">Soil</p><p className="text-xs font-semibold text-foreground truncate">{field.soilType || 'N/A'}</p></div>
                        </div>
                      </div>

                      <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                        <button onClick={() => navigate(`/farms/${farmId}/fields/${field.id}`)} className="text-xs font-medium text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View Crops
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingField(field); setFieldView('edit'); }} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteField(field.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <EmptyState
          icon={Activity}
          title="Statistics"
          description="Detailed charts and yield analysis will appear here in Phase 4."
          actionLabel="View Main Dashboard"
          onAction={() => navigate('/dashboard')}
          secondaryActionLabel="Open Help Center"
          onSecondaryAction={() => navigate('/help')}
        />
      )}
      {activeTab === 'timeline' && (
        <EmptyState
          icon={Clock}
          title="Activity Timeline"
          description="A complete history of all operations across this farm."
          actionLabel="Go to Dashboard"
          onAction={() => navigate('/dashboard')}
          secondaryActionLabel="Need Help?"
          onSecondaryAction={() => navigate('/help')}
        />
      )}
      {activeTab === 'docs' && (
        <EmptyState
          icon={FileText}
          title="Documents"
          description="Store your land records, soil test reports, and bills here."
          actionLabel="Check Profile Settings"
          onAction={() => navigate('/profile')}
          secondaryActionLabel="Browse FAQ"
          onSecondaryAction={() => navigate('/help')}
        />
      )}
    </div>
  );
}

function MetaBlock({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground bg-muted/50 px-3 py-2 rounded-lg">{value ?? 'Not specified'}</p>
    </div>
  );
}
