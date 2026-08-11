import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWizardStore } from './store/useWizardStore';
import { db } from '@/offline/db';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/lib/apiClient';
import { updateProfileApi } from '@/features/auth/api/authApi';
import type { ApiResponse } from '@/types/api';
import type { Farm, Field, Crop } from '@/types/domain';

import { Step1Profile } from './steps/Step1Profile';
import { Step2FarmDetails } from './steps/Step2FarmDetails';
import { Step3FieldDetails } from './steps/Step3FieldDetails';
import { Step4CropDetails } from './steps/Step4CropDetails';
import { Step5Review } from './steps/Step5Review';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FarmerOnboardingWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useWizardStore();
  const { currentStep, profile, farm, fields, crops, loadDraft, reset } = store;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [finalFarmId, setFinalFarmId] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for existing drafts on mount
  useEffect(() => {
    const checkDraft = async () => {
      const drafts = await db.onboardingDrafts.toArray();
      if (drafts.length > 0) {
        setHasDraft(true);
      }
    };
    checkDraft();
  }, []);

  const handleResumeDraft = async () => {
    const drafts = await db.onboardingDrafts.toArray();
      if (drafts.length > 0 && drafts[0]) {
        loadDraft(drafts[0]);
        setHasDraft(false);
      }
  };

  const handleClearDraft = async () => {
    await db.onboardingDrafts.clear();
    setHasDraft(false);
    reset();
  };

  const submitOnline = async () => {
    if (!profile || !farm) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Profile
      await updateProfileApi({
        firstName: profile.name.split(' ')[0] || profile.name,
        lastName: profile.name.split(' ').slice(1).join(' ') || '.',
        preferredLanguage: profile.language,
      });

      // Retrieve draft to check partial success
      const drafts = await db.onboardingDrafts.toArray();
      const draft = drafts[0];
      
      // 2. Farm
      let serverFarmId = draft?.syncedFarmId;
      if (!serverFarmId) {
        const farmRes = await apiClient.post<ApiResponse<Farm>>('/farms', {
          name: farm.name,
          district: farm.district,
          taluk: farm.taluk,
          village: farm.village,
          area: farm.area,
          areaUnit: 'Acres',
          soilType: farm.soilType,
          irrigationSource: farm.irrigationSource,
        });
        serverFarmId = farmRes.data.data.id;
        
        // Update draft with partial success
        if (draft) {
          await db.onboardingDrafts.update(draft.id, { syncedFarmId: serverFarmId });
        }
      }

      const syncedFieldIds = draft?.syncedFieldIds || {};

      // 3. Fields
      for (const field of fields) {
        if (!syncedFieldIds[field.id]) {
          const fieldRes = await apiClient.post<ApiResponse<Field>>('/fields', {
            farmId: serverFarmId,
            name: field.name,
            area: field.area,
            areaUnit: 'Acres'
          });
          syncedFieldIds[field.id] = fieldRes.data.data.id;
          
          if (draft) {
            await db.onboardingDrafts.update(draft.id, { syncedFieldIds });
          }
        }
      }

      const syncedCropIds = draft?.syncedCropIds || {};

      // 4. Crops
      for (const crop of crops) {
        if (!syncedCropIds[crop.id]) {
          const serverFieldId = syncedFieldIds[crop.fieldId];
          if (serverFieldId) {
            const cropRes = await apiClient.post<ApiResponse<Crop>>('/crops', {
              fieldId: serverFieldId,
              name: crop.name,
              variety: crop.variety,
              sowingDate: crop.sowingDate,
              expectedHarvestDate: crop.expectedHarvestDate
            });
            syncedCropIds[crop.id] = cropRes.data.data.id;
            
            if (draft) {
              await db.onboardingDrafts.update(draft.id, { syncedCropIds });
            }
          }
        }
      }

      // Success!
      await db.onboardingDrafts.clear();
      setFinalFarmId(serverFarmId);
      setIsSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'An error occurred during submission.');
      
      // Save current state as draft on failure
      const drafts = await db.onboardingDrafts.toArray();
      if (drafts.length === 0) {
        await db.onboardingDrafts.add({
          id: 'draft-1',
          userId: 'current-user', // In a real app, grab from auth context
          step: 5,
          profile,
          farm,
          fields,
          crops,
          updatedAt: new Date().toISOString()
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOffline = async () => {
    if (!profile || !farm) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const drafts = await db.onboardingDrafts.toArray();
      const draftData = {
        userId: 'current-user',
        step: 5,
        profile,
        farm,
        fields,
        crops,
        updatedAt: new Date().toISOString()
      };

      if (drafts.length > 0 && drafts[0]) {
        await db.onboardingDrafts.update(drafts[0].id, draftData);
      } else {
        await db.onboardingDrafts.add({
          id: uuidv4(),
          ...draftData
        });
      }

      // We stay on Step 5 and show the offline success state.
      // Do not navigate.
      alert(t('onboarding.savedOfflineAlert', 'Saved offline. Pending sync.'));
    } catch (err: any) {
      setError(err.message || 'Failed to save offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isOffline) {
      submitOffline();
    } else {
      submitOnline();
    }
  };

  if (hasDraft && currentStep === 1 && !profile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-card border rounded-xl shadow-sm text-center space-y-6">
        <h2 className="text-2xl font-bold">{t('onboarding.draftFound', 'Saved Progress Found')}</h2>
        <p className="text-muted-foreground">
          {t('onboarding.draftFoundDesc', 'You have an incomplete onboarding session. Would you like to resume?')}
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleClearDraft}>
            {t('common.startOver', 'Start Over')}
          </Button>
          <Button onClick={handleResumeDraft} className="bg-gradient-to-r from-emerald-600 to-green-600">
            {t('common.resume', 'Resume')}
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess && finalFarmId) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-card border rounded-xl shadow-sm text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-emerald-800">{t('onboarding.successTitle', 'Farm Created Successfully!')}</h2>
        <p className="text-muted-foreground">
          {t('onboarding.successDesc', 'Your digital farm twin has been set up. You can now view your farm health and insights.')}
        </p>
        <Button 
          size="lg" 
          onClick={() => {
            reset();
            navigate(`/farms/${finalFarmId}/health`);
          }}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          {t('onboarding.goToDashboard', 'Go to Farm Health Dashboard')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">{t('onboarding.title', 'Farmer Onboarding')}</h1>
        <p className="text-muted-foreground">{t('onboarding.subtitle', 'Setup your digital farm twin')}</p>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mt-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-10 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          ></div>
          
          {[1, 2, 3, 4, 5].map((step) => (
            <div 
              key={step} 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                currentStep >= step 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-muted text-muted-foreground border-2 border-background'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-6 md:p-8">
        {currentStep === 1 && <Step1Profile />}
        {currentStep === 2 && <Step2FarmDetails />}
        {currentStep === 3 && <Step3FieldDetails />}
        {currentStep === 4 && <Step4CropDetails />}
        {currentStep === 5 && (
          <Step5Review 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            isOffline={isOffline} 
            error={error} 
          />
        )}
      </div>
    </div>
  );
}
