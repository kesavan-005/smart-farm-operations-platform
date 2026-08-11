import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { CropSchema, type CropData } from '../types/OnboardingTypes';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export function Step4CropDetails() {
  const { t } = useTranslation();
  const { crops, fields, addCrop, removeCrop, nextStep, prevStep } = useWizardStore();
  const [isAdding, setIsAdding] = useState(crops.length === 0);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CropData>({
    resolver: zodResolver(CropSchema),
    defaultValues: {
      id: uuidv4(),
      fieldId: fields[0]?.id || '',
      name: '',
      variety: '',
      sowingDate: '',
      expectedHarvestDate: ''
    }
  });

  const onAddCrop = (data: CropData) => {
    addCrop(data);
    reset({ id: uuidv4(), fieldId: fields[0]?.id || '', name: '', variety: '', sowingDate: '', expectedHarvestDate: '' });
    setIsAdding(false);
  };

  const handleNext = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t('onboarding.addedCrops', 'Added Crops')}</h3>
          {!isAdding && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('onboarding.addCrop', 'Add Crop')}
            </Button>
          )}
        </div>

        {crops.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">{t('onboarding.noCrops', 'No crops added yet. You can skip this step if you prefer.')}</p>
        )}

        {crops.length > 0 && (
          <ul className="space-y-2">
            {crops.map((crop) => {
              const fieldName = fields.find(f => f.id === crop.fieldId)?.name || 'Unknown Field';
              return (
                <li key={crop.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
                  <div>
                    <p className="font-medium">{crop.name} {crop.variety && `(${crop.variety})`}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.field', 'Field')}: {fieldName} | {t('onboarding.sown', 'Sown')}: {crop.sowingDate}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeCrop(crop.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {isAdding && (
          <form onSubmit={handleSubmit(onAddCrop)} className="p-4 border rounded-md bg-muted/10 space-y-4 mt-4">
            <h4 className="font-medium">{t('onboarding.newCrop', 'New Crop')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.selectField', 'Select Field')} <span className="text-destructive">*</span>
                </label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={watch('fieldId')}
                  onChange={(e) => setValue('fieldId', e.target.value)}
                >
                  <option value="" disabled>{t('onboarding.selectFieldPlaceholder', 'Select a field')}</option>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.area} Acres)</option>
                  ))}
                </select>
                {errors.fieldId && <p className="text-sm text-destructive mt-1">{errors.fieldId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.cropName', 'Crop Name')} <span className="text-destructive">*</span>
                </label>
                <Input {...register('name')} placeholder="e.g. Paddy, Tomato" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.variety', 'Variety (Optional)')}
                </label>
                <Input {...register('variety')} placeholder="e.g. ADT 43" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.sowingDate', 'Sowing Date')} <span className="text-destructive">*</span>
                </label>
                <Input type="date" {...register('sowingDate')} />
                {errors.sowingDate && <p className="text-sm text-destructive mt-1">{errors.sowingDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.expectedHarvest', 'Expected Harvest')} <span className="text-destructive">*</span>
                </label>
                <Input type="date" {...register('expectedHarvestDate')} />
                {errors.expectedHarvestDate && <p className="text-sm text-destructive mt-1">{errors.expectedHarvestDate.message}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit">
                {t('common.add', 'Add')}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep}>
          {t('common.back', 'Back')}
        </Button>
        <Button 
          type="button" 
          onClick={handleNext}
          disabled={isAdding && fields.length > 0} // Allow skip if no fields or cancelled adding
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
}
