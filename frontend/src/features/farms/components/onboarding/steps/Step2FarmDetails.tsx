import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { FarmSchema, type FarmData } from '../types/OnboardingTypes';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Step2FarmDetails() {
  const { t } = useTranslation();
  const { farm, setFarm, nextStep, prevStep } = useWizardStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FarmData>({
    resolver: zodResolver(FarmSchema),
    defaultValues: farm || {
      name: '',
      district: '',
      taluk: '',
      village: '',
      area: 0,
      soilType: '',
      irrigationSource: ''
    }
  });

  const onSubmit = (data: FarmData) => {
    setFarm(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.farmName', 'Farm Name')} <span className="text-destructive">*</span>
          </label>
          <Input {...register('name')} placeholder={t('onboarding.farmNamePlaceholder', 'e.g. Green Valley Farm')} />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.district', 'District')} <span className="text-destructive">*</span>
          </label>
          <Input {...register('district')} placeholder="District" />
          {errors.district && <p className="text-sm text-destructive mt-1">{errors.district.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.taluk', 'Taluk')} <span className="text-destructive">*</span>
          </label>
          <Input {...register('taluk')} placeholder="Taluk" />
          {errors.taluk && <p className="text-sm text-destructive mt-1">{errors.taluk.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.village', 'Village')} <span className="text-destructive">*</span>
          </label>
          <Input {...register('village')} placeholder="Village" />
          {errors.village && <p className="text-sm text-destructive mt-1">{errors.village.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.area', 'Total Area (Acres)')} <span className="text-destructive">*</span>
          </label>
          <Input type="number" step="0.1" {...register('area', { valueAsNumber: true })} placeholder="0.0" />
          {errors.area && <p className="text-sm text-destructive mt-1">{errors.area.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.soilType', 'Soil Type')}
          </label>
          <Input {...register('soilType')} placeholder="e.g. Red Soil, Black Soil" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.irrigation', 'Irrigation Source')}
          </label>
          <Input {...register('irrigationSource')} placeholder="e.g. Borewell, Canal" />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep}>
          {t('common.back', 'Back')}
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
          {t('common.next', 'Next')}
        </Button>
      </div>
    </form>
  );
}
