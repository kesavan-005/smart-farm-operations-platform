import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useField } from '@/features/fields/api/fieldsApi';
import { useCrops, useCreateCrop, useUpdateCrop, useDeleteCrop } from '@/features/crops/api/cropsApi';
import CropForm from '@/features/crops/components/CropForm';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states/EmptyState';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { Sparkles, Leaf, ArrowLeft, Plus, MapPin, Eye, Edit2, Trash2, Beaker, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Crop } from '@/types/domain';

export default function FieldDetailScreen() {
  const { farmId = '', fieldId = '' } = useParams<{ farmId: string; fieldId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';
  const { toast } = useToast();

  const [cropView, setCropView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  // Queries
  const { data: field, isLoading: isFieldLoading, error: fieldError } = useField(fieldId);
  const { data: crops = [], isLoading: isCropsLoading } = useCrops(fieldId);

  // Mutations
  const createCropMutation = useCreateCrop(fieldId);
  const updateCropMutation = useUpdateCrop(fieldId, editingCrop?.id || '');
  const deleteCropMutation = useDeleteCrop(fieldId);

  const handleCreateCrop = async (formData: any) => {
    try {
      await createCropMutation.mutateAsync({ ...formData, fieldId });
      toast({ title: isTa ? 'பயிர் வெற்றிகரமாக உருவாக்கப்பட்டது' : 'Crop created successfully' });
      setCropView('list');
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleUpdateCrop = async (formData: any) => {
    if (!editingCrop) return;
    try {
      await updateCropMutation.mutateAsync({ ...formData, id: editingCrop.id });
      toast({ title: isTa ? 'பயிர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது' : 'Crop updated successfully' });
      setCropView('list');
      setEditingCrop(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  const handleDeleteCrop = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteCropMutation.mutateAsync({ id });
      toast({ title: isTa ? 'பயிர் வெற்றிகரமாக நீக்கப்பட்டது' : 'Crop deleted successfully' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    }
  };

  if (isFieldLoading) return <LoadingState message="Loading field details..." />;

  if (fieldError || !field) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center sf-card p-8">
        <h3 className="text-sm font-medium text-destructive mb-4">{t('errorStateTitle')}</h3>
        <Button onClick={() => navigate(`/farms/${farmId}`)} variant="outline" className="gap-1.5 h-9">
          <ArrowLeft className="w-4 h-4" /> Back to Farm
        </Button>
      </div>
    );
  }

  // Views for Forms
  if (cropView === 'create') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 sf-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setCropView('list')}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-lg font-bold text-foreground">{isTa ? 'புதிய பயிரைச் சேர்' : 'Add New Crop'}</h2>
        </div>
        <CropForm onSubmit={handleCreateCrop} onCancel={() => setCropView('list')} isSubmitting={createCropMutation.isPending} />
      </div>
    );
  }

  if (cropView === 'edit' && editingCrop) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 sf-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => { setCropView('list'); setEditingCrop(null); }}><ArrowLeft className="w-4 h-4" /></Button>
          <h2 className="text-lg font-bold text-foreground">{isTa ? 'பயிரைத் திருத்து' : 'Edit Crop'}</h2>
        </div>
        <CropForm initialData={editingCrop as any} onSubmit={handleUpdateCrop} onCancel={() => { setCropView('list'); setEditingCrop(null); }} isSubmitting={updateCropMutation.isPending} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sf-stagger">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/farms/${farmId}`)} className="text-muted-foreground mb-3 gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Farm Details
        </Button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sf-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {isTa && field.nameTa ? field.nameTa : field.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{field.fieldCode}</span>
                {field.area && <span>• {field.area} {field.areaUnit}</span>}
                <span className={`px-2 py-0.5 rounded-md font-medium uppercase tracking-wider text-[10px] border ${
                  field.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {field.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Beaker className="w-4 h-4 text-primary" /> Soil & Geography
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetaBlock label="Soil Type" value={field.soilType} />
              <MetaBlock label="Soil pH" value={field.soilPh} />
              <MetaBlock label="Elevation" value={field.elevation ? `${field.elevation} m` : null} />
              <MetaBlock label="Water Source" value={field.waterAvailability} />
              <MetaBlock label="Drainage" value={field.drainageType} />
              <MetaBlock label="Rainfall (Avg)" value={field.averageRainfall ? `${field.averageRainfall} mm` : null} />
            </div>
            {field.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-foreground">{isTa && field.notesTa ? field.notesTa : field.notes}</p>
              </div>
            )}
          </div>

          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Map className="w-4 h-4 text-primary" /> Boundary Coordinates
            </h3>
            {field.boundary?.coordinates?.[0] ? (
              <div className="font-mono text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border max-h-32 overflow-y-auto leading-relaxed">
                {field.boundary.coordinates[0].map((coord: number[], idx: number) => {
                  const lng = coord[0];
                  const lat = coord[1];
                  if (lng === undefined || lat === undefined) return null;
                  return <div key={idx}>[{lng.toFixed(5)}, {lat.toFixed(5)}]</div>;
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No boundary defined.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="sf-card p-5 border-primary/20 bg-primary/[0.02] dark:bg-primary/5 relative overflow-hidden">
            <Sparkles className="absolute -top-2 -right-2 w-16 h-16 text-primary/10" />
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> AI Recommendations
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on soil pH and elevation, this field is optimal for Rice or Sugarcane. Ensure adequate drainage before monsoon season.
            </p>
          </div>
        </div>
      </div>

      {/* Crops List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">
            {isTa ? 'பயிர்கள்' : 'Crops'}
          </h2>
          <Button onClick={() => setCropView('create')} className="gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
            <Plus className="w-4 h-4" /> {isTa ? 'பயிர் சேர்' : 'Add Crop'}
          </Button>
        </div>

        {isCropsLoading ? (
          <LoadingState message="Loading crops..." />
        ) : crops.length === 0 ? (
          <EmptyState 
            icon={Leaf} 
            title={isTa ? 'பயிர்கள் இல்லை' : 'No crops found'} 
            description={isTa ? 'உங்கள் முதல் பயிரைச் சேர்க்கவும்' : 'Add your first crop to this field.'} 
            actionLabel={isTa ? 'பயிர் சேர்' : 'Add Crop'} 
            onAction={() => setCropView('create')} 
            secondaryActionLabel={isTa ? 'பண்ணைக்குத் திரும்பு' : 'Back to Farm'}
            onSecondaryAction={() => navigate(`/farms/${farmId}`)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sf-stagger">
            {crops.map((crop: Crop) => (
              <div key={crop.id} className="sf-card sf-card-interactive overflow-hidden group">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {isTa && crop.nameTa ? crop.nameTa : crop.name}
                      </h3>
                      {crop.variety && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{crop.variety}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                      crop.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                      crop.status === 'harvested' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {crop.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-lg">
                    <div><p className="text-[10px] text-muted-foreground font-medium">Season</p><p className="text-xs font-semibold text-foreground">{crop.season || 'N/A'}</p></div>
                    <div><p className="text-[10px] text-muted-foreground font-medium">Yield</p><p className="text-xs font-semibold text-foreground">{crop.expectedYield ? `${crop.expectedYield} ${crop.yieldUnit}` : 'N/A'}</p></div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                  <button onClick={() => navigate(`/farms/${farmId}/fields/${fieldId}/crops/${crop.id}`)} className="text-xs font-medium text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCrop(crop); setCropView('edit'); }} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCrop(crop.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
