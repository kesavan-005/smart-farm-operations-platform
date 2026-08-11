import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { FieldSchema, type FieldData } from '../types/OnboardingTypes';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export function Step3FieldDetails() {
  const { t } = useTranslation();
  const { fields, addField, removeField, nextStep, prevStep } = useWizardStore();
  const [isAdding, setIsAdding] = useState(fields.length === 0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FieldData>({
    resolver: zodResolver(FieldSchema),
    defaultValues: {
      id: uuidv4(),
      name: '',
      area: 0
    }
  });

  const onAddField = (data: FieldData) => {
    addField(data);
    reset({ id: uuidv4(), name: '', area: 0 });
    setIsAdding(false);
  };

  const handleNext = () => {
    if (fields.length === 0) {
      alert(t('onboarding.atLeastOneField', 'Please add at least one field.'));
      return;
    }
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{t('onboarding.addedFields', 'Added Fields')}</h3>
          {!isAdding && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('onboarding.addField', 'Add Field')}
            </Button>
          )}
        </div>

        {fields.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">{t('onboarding.noFields', 'No fields added yet.')}</p>
        )}

        {fields.length > 0 && (
          <ul className="space-y-2">
            {fields.map((field) => (
              <li key={field.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
                <div>
                  <p className="font-medium">{field.name}</p>
                  <p className="text-sm text-muted-foreground">{field.area} {t('common.acres', 'Acres')}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeField(field.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {isAdding && (
          <form onSubmit={handleSubmit(onAddField)} className="p-4 border rounded-md bg-muted/10 space-y-4 mt-4">
            <h4 className="font-medium">{t('onboarding.newField', 'New Field')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.fieldName', 'Field Name')} <span className="text-destructive">*</span>
                </label>
                <Input {...register('name')} placeholder="e.g. North Field" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.area', 'Area (Acres)')} <span className="text-destructive">*</span>
                </label>
                <Input type="number" step="0.1" {...register('area', { valueAsNumber: true })} placeholder="0.0" />
                {errors.area && <p className="text-sm text-destructive mt-1">{errors.area.message}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {fields.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
              )}
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
          disabled={fields.length === 0 || isAdding}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
}
