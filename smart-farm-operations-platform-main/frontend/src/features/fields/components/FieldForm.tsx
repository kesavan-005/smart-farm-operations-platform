import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, Map, Beaker, Save, Loader2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
  nameTa: z.string().max(100).optional(),
  area: z.coerce.number().positive('Area must be a positive number').optional(),
  areaUnit: z.string().max(10).optional(),
  soilType: z.string().max(50).optional(),
  soilPh: z.coerce.number().min(0).max(14, 'pH must be between 0 and 14').optional(),
  soilOrganicCarbon: z.coerce.number().optional(),
  irrigationType: z.string().max(50).optional(),
  waterAvailability: z.string().max(100).optional(),
  drainageType: z.string().max(100).optional(),
  averageRainfall: z.coerce.number().optional(),
  elevation: z.coerce.number().optional(),
  notes: z.string().optional(),
  notesTa: z.string().optional(),
  status: z.enum(['active', 'fallow', 'inactive']).default('active'),
  boundaryCoordsText: z.string().optional(),
});

export type FieldFormData = z.infer<typeof fieldSchema>;

interface FieldFormProps {
  initialData?: Partial<FieldFormData & { boundary?: GeoJSON.Polygon }>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function FieldForm({ initialData, onSubmit, onCancel, isSubmitting }: FieldFormProps) {
  const { t, i18n } = useTranslation(['common']);
  const isTa = i18n.language === 'ta';

  // Format initial boundary coordinate lists back to text
  let defaultCoordsText = '';
  if (initialData?.boundary?.coordinates?.[0]) {
    defaultCoordsText = initialData.boundary.coordinates[0]
      .map((coord) => `${coord[0]}, ${coord[1]}`)
      .join('\n');
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema) as any,
    defaultValues: {
      status: 'active',
      areaUnit: 'ACRES',
      ...initialData,
      boundaryCoordsText: defaultCoordsText,
    } as any,
  });

  const onSubmitHandler = (data: FieldFormData) => {
    let boundary = null;
    if (data.boundaryCoordsText) {
      try {
        const coordinates = data.boundaryCoordsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const parts = line.split(',').map((p) => parseFloat(p.trim()));
            if (parts.length !== 2 || parts.some(isNaN)) {
              throw new Error('Invalid coordinates');
            }
            return [parts[0], parts[1]]; // [lng, lat]
          });

        if (coordinates.length >= 3) {
          const first = coordinates[0];
          const last = coordinates[coordinates.length - 1];
          if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
            coordinates.push(first);
          }
          boundary = {
            type: 'Polygon',
            coordinates: [coordinates],
          };
        }
      } catch (e) {
        alert(isTa ? 'செல்லாத ஆயத்தொலைவுகள் வடிவம். வடிவம்: Lng, Lat (ஒரு வரிசையில் ஒரு ஜோடி)' : 'Invalid coordinate format. Use format: Lng, Lat (one pair per line)');
        return;
      }
    }

    const { boundaryCoordsText, ...submitPayload } = data;
    onSubmit({ ...submitPayload, boundary });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler as any)} className="space-y-6">
      {/* Basic Details */}
      <FormSection icon={Info} title={isTa ? 'நில விவரங்கள்' : 'Field Details'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'நிலத்தின் பெயர் (ஆங்கிலம்) *' : 'Field Name (English) *'} error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. North Field" className="h-9 bg-background" />
          </FormField>
          
          <FormField label={isTa ? 'நிலத்தின் பெயர் (தமிழ்)' : 'Field Name (Tamil)'} error={errors.nameTa?.message}>
            <Input {...register('nameTa')} placeholder="எ.கா. வடக்கு வயல்" className="h-9 bg-background" />
          </FormField>

          <FormField label={isTa ? 'பரப்பளவு' : 'Area'}>
            <div className="flex gap-2">
              <Input type="number" step="any" {...register('area')} placeholder="e.g. 2.5" className="h-9 bg-background flex-1" />
              <select {...register('areaUnit')} className="h-9 px-2 border border-input rounded-lg text-sm bg-background">
                <option value="ACRES">Acres</option>
                <option value="HECTARES">Hectares</option>
                <option value="CENTS">Cents</option>
              </select>
            </div>
            {errors.area && <p className="text-xs text-destructive mt-1">{errors.area.message}</p>}
          </FormField>

          <FormField label={isTa ? 'உயரம் (Elevation in meters)' : 'Elevation (meters)'}>
            <Input type="number" step="any" {...register('elevation')} placeholder="e.g. 350.5" className="h-9 bg-background" />
          </FormField>
        </div>
      </FormSection>

      {/* Boundary */}
      <FormSection icon={Map} title={isTa ? 'எல்லை ஆயத்தொலைவுகள்' : 'Boundary Coordinates (GeoJSON)'}>
        <FormField label={isTa ? 'எல்லை புள்ளிகள் (தீர்க்கரேகை, அட்சரேகை - ஒரு வரியில் ஒன்று)' : 'Polygon Coordinates (Longitude, Latitude - one pair per line)'}>
          <textarea
            {...register('boundaryCoordsText')}
            rows={5}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
            placeholder="e.g.&#10;78.1100, 9.9200&#10;78.1200, 9.9200&#10;78.1200, 9.9300&#10;78.1100, 9.9200"
          />
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {isTa ? 'குறிப்பு: குறைந்தது 3 புள்ளிகளை உள்ளிடவும்.' : 'Note: Enter at least 3 points. They will be closed automatically.'}
          </p>
        </FormField>
      </FormSection>

      {/* Soil & Water */}
      <FormSection icon={Beaker} title={isTa ? 'மண் & பாசன விவரங்கள் (AI-Ready)' : 'Soil & Water Metadata (AI-Ready)'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={isTa ? 'மண் வகை' : 'Soil Type'}>
            <Input {...register('soilType')} placeholder="e.g. Clay, Red Soil" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மண் pH' : 'Soil pH'} error={errors.soilPh?.message}>
            <Input type="number" step="0.01" {...register('soilPh')} placeholder="e.g. 6.8" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மண் கரிம கார்பன் (%)' : 'Organic Carbon (%)'}>
            <Input type="number" step="0.01" {...register('soilOrganicCarbon')} placeholder="e.g. 0.85" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'பாசன வகை' : 'Irrigation Type'}>
            <Input {...register('irrigationType')} placeholder="e.g. Drip" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'நீர் கிடைக்கும் அளவு' : 'Water Availability'}>
            <Input {...register('waterAvailability')} placeholder="e.g. Normal, High" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'வடிகால் வகை' : 'Drainage Type'}>
            <Input {...register('drainageType')} placeholder="e.g. Moderate" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'சராசரி மழை (mm)' : 'Avg Rainfall (mm)'}>
            <Input type="number" step="any" {...register('averageRainfall')} placeholder="e.g. 900" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'நிலை' : 'Status'}>
            <select {...register('status')} className="h-9 w-full px-3 border border-input rounded-lg text-sm bg-background">
              <option value="active">{isTa ? 'செயலில் உள்ளது' : 'Active'}</option>
              <option value="fallow">{isTa ? 'தரிசு நிலம்' : 'Fallow'}</option>
              <option value="inactive">{isTa ? 'செயலிழந்தது' : 'Inactive'}</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Notes */}
      <FormSection icon={FileText} title={isTa ? 'குறிப்புகள்' : 'Notes'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'குறிப்புகள் (ஆங்கிலம்)' : 'Notes (English)'}>
            <textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="Additional notes about the field..." />
          </FormField>
          <FormField label={isTa ? 'குறிப்புகள் (தமிழ்)' : 'Notes (Tamil)'}>
            <textarea {...register('notesTa')} rows={3} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" placeholder="வயலைப் பற்றிய கூடுதல் குறிப்புகள்..." />
          </FormField>
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
