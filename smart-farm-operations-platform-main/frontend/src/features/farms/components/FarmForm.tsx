import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { MapPin, Beaker, Info, Loader2, Save } from 'lucide-react';

export const farmSchema = z.object({
  name: z.string().min(1, 'Farm name is required').max(100),
  nameTa: z.string().max(100).optional(),
  description: z.string().optional(),
  descriptionTa: z.string().optional(),
  totalArea: z.coerce.number().positive('Area must be a positive number').optional(),
  areaUnit: z.string().max(10).optional(),
  address: z.string().optional(),
  village: z.string().max(100).optional(),
  taluk: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().max(20).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  soilType: z.string().max(50).optional(),
  soilPh: z.coerce.number().min(0).max(14, 'pH must be between 0 and 14').optional(),
  soilOrganicCarbon: z.coerce.number().optional(),
  irrigationType: z.string().max(50).optional(),
  waterSource: z.string().max(50).optional(),
  waterAvailability: z.string().max(100).optional(),
  drainageType: z.string().max(100).optional(),
  averageRainfall: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type FarmFormData = z.infer<typeof farmSchema>;

interface FarmFormProps {
  initialData?: Partial<FarmFormData>;
  onSubmit: (data: FarmFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function FarmForm({ initialData, onSubmit, onCancel, isSubmitting }: FarmFormProps) {
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema) as any,
    defaultValues: { status: 'active', ...initialData },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      {/* Section: Basic Details */}
      <FormSection icon={Info} title={isTa ? 'அடிப்படை விவரங்கள்' : 'Basic Details'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'பண்ணையின் பெயர் *' : 'Farm Name *'} error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Green Valley Farm" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'பெயர் (தமிழ்)' : 'Name (Tamil)'} error={errors.nameTa?.message}>
            <Input {...register('nameTa')} placeholder="எ.கா. பசுமை பண்ணை" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'விளக்கம்' : 'Description'} className="md:col-span-2">
            <textarea {...register('description')} rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Brief description of the farm..." />
          </FormField>
          <FormField label={isTa ? 'விளக்கம் (தமிழ்)' : 'Description (Tamil)'} className="md:col-span-2">
            <textarea {...register('descriptionTa')} rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="பண்ணையின் விளக்கம்..." />
          </FormField>
        </div>
      </FormSection>

      {/* Section: Location */}
      <FormSection icon={MapPin} title={isTa ? 'இருப்பிட விவரங்கள்' : 'Location & Address'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={isTa ? 'முகவரி' : 'Address'} className="md:col-span-3">
            <Input {...register('address')} placeholder="123 Farm Road..." className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'கிராமம்' : 'Village'}>
            <Input {...register('village')} placeholder="e.g. Melur" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'தாலுகா' : 'Taluk'}>
            <Input {...register('taluk')} placeholder="e.g. Madurai South" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மாவட்டம்' : 'District'}>
            <Input {...register('district')} placeholder="e.g. Madurai" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மாநிலம் *' : 'State *'} error={errors.state?.message}>
            <Input {...register('state')} placeholder="e.g. Tamil Nadu" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'அஞ்சல் குறியீடு' : 'Pincode'}>
            <Input {...register('pincode')} placeholder="e.g. 625001" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'பரப்பளவு' : 'Total Area'}>
            <div className="flex gap-2">
              <Input type="number" step="any" {...register('totalArea')} placeholder="e.g. 10.5" className="h-9 bg-background flex-1" />
              <select {...register('areaUnit')} className="h-9 px-2 border border-input rounded-lg text-sm bg-background">
                <option value="ACRES">Acres</option>
                <option value="HECTARES">Ha</option>
                <option value="CENTS">Cents</option>
              </select>
            </div>
            {errors.totalArea && <p className="text-xs text-destructive mt-1">{errors.totalArea.message}</p>}
          </FormField>
          <FormField label="Latitude">
            <Input type="number" step="any" {...register('latitude')} placeholder="e.g. 9.9252" className="h-9 bg-background" />
          </FormField>
          <FormField label="Longitude">
            <Input type="number" step="any" {...register('longitude')} placeholder="e.g. 78.1198" className="h-9 bg-background" />
          </FormField>
        </div>
      </FormSection>

      {/* Section: Soil & Irrigation */}
      <FormSection icon={Beaker} title={isTa ? 'மண் மற்றும் பாசனம்' : 'Soil & Irrigation (AI-Ready)'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={isTa ? 'மண் வகை' : 'Soil Type'}>
            <Input {...register('soilType')} placeholder="Clay, Sandy, Loam" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மண் pH' : 'Soil pH'} error={errors.soilPh?.message}>
            <Input type="number" step="0.01" {...register('soilPh')} placeholder="e.g. 6.5" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மண் கரிம கார்பன்' : 'Soil Organic Carbon (%)'}>
            <Input type="number" step="0.01" {...register('soilOrganicCarbon')} placeholder="e.g. 1.2" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'பாசன வகை' : 'Irrigation Type'}>
            <Input {...register('irrigationType')} placeholder="Drip, Sprinkler, Flood" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'நீர் ஆதாரம்' : 'Water Source'}>
            <Input {...register('waterSource')} placeholder="Borewell, Canal, Rain" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'நீர் கிடைப்பு' : 'Water Availability'}>
            <Input {...register('waterAvailability')} placeholder="Year-round, Seasonal" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'வடிகால் வகை' : 'Drainage Type'}>
            <Input {...register('drainageType')} placeholder="Well-drained" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'சராசரி மழை (mm)' : 'Avg. Rainfall (mm)'}>
            <Input type="number" step="any" {...register('averageRainfall')} placeholder="e.g. 850" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'நிலை' : 'Status'}>
            <select {...register('status')} className="h-9 w-full px-3 border border-input rounded-lg text-sm bg-background">
              <option value="active">{isTa ? 'செயலில்' : 'Active'}</option>
              <option value="inactive">{isTa ? 'செயலிழந்தது' : 'Inactive'}</option>
              <option value="archived">{isTa ? 'காப்பகம்' : 'Archived'}</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Actions */}
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
