import { useTranslation } from 'react-i18next';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Edit3, Loader2 } from 'lucide-react';

interface Step5ReviewProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  isOffline: boolean;
  error: string | null;
}

export function Step5Review({ onSubmit, isSubmitting, isOffline, error }: Step5ReviewProps) {
  const { t } = useTranslation();
  const { profile, farm, fields, crops, setStep, prevStep } = useWizardStore();

  return (
    <div className="space-y-6">
      <div className="bg-muted/20 p-6 rounded-lg border space-y-6">
        
        {/* Profile Summary */}
        <section>
          <div className="flex justify-between items-center mb-2 border-b pb-1">
            <h4 className="font-medium text-primary">{t('onboarding.profile', 'Farmer Profile')}</h4>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-6 text-muted-foreground">
              <Edit3 className="w-3 h-3 mr-1" /> {t('common.edit', 'Edit')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">{t('onboarding.name', 'Name')}:</span>
            <span className="font-medium">{profile?.name}</span>
            <span className="text-muted-foreground">{t('onboarding.mobile', 'Mobile')}:</span>
            <span className="font-medium">{profile?.mobile}</span>
          </div>
        </section>

        {/* Farm Summary */}
        <section>
          <div className="flex justify-between items-center mb-2 border-b pb-1">
            <h4 className="font-medium text-primary">{t('onboarding.farmDetails', 'Farm Details')}</h4>
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-6 text-muted-foreground">
              <Edit3 className="w-3 h-3 mr-1" /> {t('common.edit', 'Edit')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">{t('onboarding.farmName', 'Farm Name')}:</span>
            <span className="font-medium">{farm?.name}</span>
            <span className="text-muted-foreground">{t('onboarding.location', 'Location')}:</span>
            <span className="font-medium">{farm?.village}, {farm?.taluk}, {farm?.district}</span>
            <span className="text-muted-foreground">{t('onboarding.area', 'Area')}:</span>
            <span className="font-medium">{farm?.area} {t('common.acres', 'Acres')}</span>
          </div>
        </section>

        {/* Fields Summary */}
        <section>
          <div className="flex justify-between items-center mb-2 border-b pb-1">
            <h4 className="font-medium text-primary">{t('onboarding.fieldAndAddress', 'Field & Address')} ({fields.length})</h4>
            <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="h-6 text-muted-foreground">
              <Edit3 className="w-3 h-3 mr-1" /> {t('common.edit', 'Edit')}
            </Button>
          </div>
          <ul className="text-sm space-y-2">
            {fields.map(f => (
              <li key={f.id} className="p-2 bg-muted/40 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between font-semibold text-foreground text-sm">
                  <span>{f.name}</span>
                  <span>{f.area} {t(`onboarding.${f.areaUnit === 'Hectares' ? 'hectares' : f.areaUnit === 'Sq Feet' ? 'sqFeet' : 'acres'}`, f.areaUnit || 'Acres')}</span>
                </div>
                <div className="text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5">
                  <span>{t('onboarding.village', 'Village')}: {f.village}</span>
                  <span>{t('onboarding.taluk', 'Taluk')}: {f.taluk}</span>
                  <span>{t('onboarding.district', 'District')}: {f.district}</span>
                  <span>{t('onboarding.state', 'State')}: {f.state}</span>
                  <span>{t('onboarding.pincode', 'Pincode')}: {f.pincode}</span>
                  {f.latitude && f.longitude && (
                    <span>Lat/Lng: {f.latitude}, {f.longitude}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Crops Summary */}
        <section>
          <div className="flex justify-between items-center mb-2 border-b pb-1">
            <h4 className="font-medium text-primary">{t('onboarding.crops', 'Crops')} ({crops.length})</h4>
            <Button variant="ghost" size="sm" onClick={() => setStep(4)} className="h-6 text-muted-foreground">
              <Edit3 className="w-3 h-3 mr-1" /> {t('common.edit', 'Edit')}
            </Button>
          </div>
          <ul className="text-sm space-y-1">
            {crops.map(c => {
              const fieldName = fields.find(f => f.id === c.fieldId)?.name;
              return (
                <li key={c.id} className="flex justify-between">
                  <span>{c.name} {c.variety ? `(${c.variety})` : ''} - <span className="text-muted-foreground text-xs">{fieldName}</span></span>
                  <span className="font-medium text-xs">{c.sowingDate}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <h5 className="font-medium mb-1">{t('common.error', 'Error')}</h5>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isOffline && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700">
          <h5 className="font-medium mb-1">{t('onboarding.offlineWarning', 'You are currently offline')}</h5>
          <p className="text-sm">
            {t('onboarding.offlineMessage', 'Your data will be securely saved locally. You can sync it to the server once your connection is restored.')}
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
          {t('common.back', 'Back')}
        </Button>
        <Button 
          type="button" 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('common.processing', 'Processing...')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isOffline ? t('onboarding.saveOffline', 'Save Offline') : t('onboarding.complete', 'Complete & Setup Farm')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
