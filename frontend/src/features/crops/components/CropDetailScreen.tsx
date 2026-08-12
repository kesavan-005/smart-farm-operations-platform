import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCrop } from '@/features/crops/api/cropsApi';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { ArrowLeft, Leaf, Activity, Droplets } from 'lucide-react';

export default function CropDetailScreen() {
  const { farmId = '', fieldId = '', cropId = '' } = useParams<{ farmId: string; fieldId: string; cropId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';

  const { data: crop, isLoading, error } = useCrop(cropId);

  if (isLoading) return <LoadingState message="Loading crop details..." />;

  if (error || !crop) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center sf-card p-8">
        <h3 className="text-sm font-medium text-destructive mb-4">{t('errorStateTitle')}</h3>
        <Button onClick={() => navigate(`/farms/${farmId}/fields/${fieldId}`)} variant="outline" className="gap-1.5 h-9">
          <ArrowLeft className="w-4 h-4" /> Back to Field
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sf-stagger">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/farms/${farmId}/fields/${fieldId}`)} className="text-muted-foreground mb-3 gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Field Details
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="sf-card overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                    <Leaf className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                      {isTa && crop.nameTa ? crop.nameTa : crop.name}
                    </h1>
                    {crop.variety && (
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        {isTa ? 'பயிர் வகை' : 'Variety'}: {crop.variety}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                  crop.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                  crop.status === 'harvested' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {crop.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-muted/50 rounded-xl p-4 border border-border">
                <MetaItem label={isTa ? 'பருவம்' : 'Season'} value={crop.season} />
                <MetaItem label={isTa ? 'விதைப்பு தேதி' : 'Sowing Date'} value={crop.sowingDate} />
                <MetaItem label={isTa ? 'அறுவடை தேதி' : 'Harvest Date'} value={crop.expectedHarvestDate} />
                <MetaItem label={isTa ? 'நடவு முறை' : 'Planting Method'} value={crop.plantingMethod} />
                <MetaItem label={isTa ? 'எதிர்பார்க்கப்படும் மகசூல்' : 'Expected Yield'} value={crop.expectedYield ? `${crop.expectedYield} ${crop.yieldUnit || 'Kgs'}` : null} />
              </div>

              {crop.notes && (
                <div className="mt-6 pt-5 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{isTa ? 'குறிப்புகள்' : 'Notes'}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isTa && crop.notesTa ? crop.notesTa : crop.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Health & Growth Panel */}
        <div className="space-y-6">
          <div className="sf-card p-5 border-blue-500/20 bg-blue-500/[0.02] dark:bg-blue-500/5 relative overflow-hidden">
            <Activity className="absolute -top-4 -right-4 w-24 h-24 text-blue-500/10" />
            
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 relative z-10">
              <Activity className="w-4 h-4 text-blue-500" /> AI Crop Health Model
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Growth Stage</p>
                <div className="flex justify-between items-end">
                  <p className="text-lg font-bold text-foreground tracking-tight">Vegetative</p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">On Track</p>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Irrigation Needs</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Low Moisture</p>
                    <p className="text-[11px] text-muted-foreground">Irrigation recommended tomorrow</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">
        {value || 'N/A'}
      </p>
    </div>
  );
}
