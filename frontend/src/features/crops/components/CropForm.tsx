import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Leaf, Calendar, TrendingUp, Save, Loader2 } from 'lucide-react';

export const cropSchema = z.object({
  name: z.string().min(1, 'Crop name is required').max(100),
  nameTa: z.string().max(100).optional(),
  variety: z.string().max(100).optional(),
  season: z.string().max(50).optional(),
  sowingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  plantingMethod: z.string().max(50).optional(),
  expectedYield: z.coerce.number().positive('Yield must be positive').optional(),
  yieldUnit: z.string().max(10).optional(),
  notes: z.string().optional(),
  notesTa: z.string().optional(),
  status: z.enum(['active', 'harvested', 'failed']).default('active'),
});

export type CropFormData = z.infer<typeof cropSchema>;

interface CropFormProps {
  initialData?: Partial<CropFormData>;
  onSubmit: (data: CropFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function CropForm({ initialData, onSubmit, onCancel, isSubmitting }: CropFormProps) {
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CropFormData>({
    resolver: zodResolver(cropSchema) as any,
    defaultValues: {
      status: 'active',
      yieldUnit: 'KGS',
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      {/* Basic Details */}
      <FormSection icon={Leaf} title={isTa ? 'பயிர் விவரங்கள்' : 'Crop Details'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'பயிரின் பெயர் (ஆங்கிலம்) *' : 'Crop Name (English) *'} error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Paddy, Maize" className="h-9 bg-background" />
          </FormField>
          
          <FormField label={isTa ? 'பயிரின் பெயர் (தமிழ்)' : 'Crop Name (Tamil)'} error={errors.nameTa?.message}>
            <Input {...register('nameTa')} placeholder="எ.கா. நெல், மக்காச்சோளம்" className="h-9 bg-background" />
          </FormField>

          <FormField label={isTa ? 'வகை (Variety)' : 'Variety'} error={errors.variety?.message}>
            <Input {...register('variety')} placeholder="e.g. Ponni, IR20" className="h-9 bg-background" />
          </FormField>

          <FormField label={isTa ? 'நிலை' : 'Status'}>
            <select {...register('status')} className="h-9 w-full px-3 border border-input rounded-lg text-sm bg-background">
              <option value="active">{isTa ? 'செயலில் உள்ளது' : 'Active'}</option>
              <option value="harvested">{isTa ? 'அறுவடை செய்யப்பட்டது' : 'Harvested'}</option>
              <option value="failed">{isTa ? 'அழிந்தது / தோல்வி' : 'Failed'}</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Timeline & Method */}
      <FormSection icon={Calendar} title={isTa ? 'பருவம் & காலம்' : 'Season & Timeline'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'பருவம் (Season)' : 'Season'}>
            <Input {...register('season')} placeholder="e.g. Kuruvai, Samba" className="h-9 bg-background" />
          </FormField>

          <FormField label={isTa ? 'நடவு முறை' : 'Planting Method'}>
            <Input {...register('plantingMethod')} placeholder="e.g. Transplanting, Direct Seeding" className="h-9 bg-background" />
          </FormField>

          <FormField label={isTa ? 'விதைப்பு தேதி' : 'Sowing Date'}>
            <Input type="date" {...register('sowingDate')} className="h-9 bg-background" />
          </FormField>

          <FormField label={isTa ? 'எதிர்பார்க்கப்படும் அறுவடை தேதி' : 'Expected Harvest Date'}>
            <Input type="date" {...register('expectedHarvestDate')} className="h-9 bg-background" />
          </FormField>
        </div>
      </FormSection>

      {/* Yield & Notes */}
      <FormSection icon={TrendingUp} title={isTa ? 'மகசூல் & குறிப்புகள்' : 'Yield & Notes'}>
        <div className="grid grid-cols-1 gap-4">
          <FormField label={isTa ? 'எதிர்பார்க்கப்படும் மகசூல்' : 'Expected Yield'}>
            <div className="flex gap-2">
              <Input type="number" step="any" {...register('expectedYield')} placeholder="e.g. 1500" className="h-9 bg-background flex-1" />
              <select {...register('yieldUnit')} className="h-9 px-2 border border-input rounded-lg text-sm bg-background">
                <option value="KGS">Kgs</option>
                <option value="TONS">Tons</option>
                <option value="BAGS">Bags</option>
              </select>
            </div>
            {errors.expectedYield && <p className="text-xs text-destructive mt-1">{errors.expectedYield.message}</p>}
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isTa ? 'குறிப்புகள் (ஆங்கிலம்)' : 'Notes (English)'}>
              <textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="Additional crop notes..." />
            </FormField>

            <FormField label={isTa ? 'குறிப்புகள் (தமிழ்)' : 'Notes (Tamil)'}>
              <textarea {...register('notesTa')} rows={3} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="கூடுதல் பயிர் குறிப்புகள்..." />
            </FormField>
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-9 px-4">
          {t('cancel')}
        </Button>
        <Button type="submit" className="h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? (isTa ? 'சேமிக்கிறது...' : 'Saving...') : t('save')}
        </Button>
      </div>
    </form>
  );
}

// --- Form sub-components ---

function FormSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="sf-card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
