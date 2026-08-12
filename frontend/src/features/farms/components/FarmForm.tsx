import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, Save, Map as MapIcon, AlertCircle, Leaf, Wheat } from 'lucide-react';
import { FarmBoundaryMap } from './FarmBoundaryMap';
import { validateFarmBoundary } from '@/utils/geofenceUtils';

export const farmSchema = z.object({
  name: z.string().min(1, 'Farm name is required').max(100),
  nameTa: z.string().max(100).optional(),
  description: z.string().optional(),
  descriptionTa: z.string().optional(),
  totalArea: z.coerce.number().positive('Area must be a positive number').optional(),
  areaUnit: z.string().max(10).optional(),
  address: z.string().optional(),
  village: z.string().min(1, 'Village is required').max(100),
  taluk: z.string().min(1, 'Taluk is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().max(20).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  soilType: z.string().min(1, 'Soil type is required').max(50),
  soilPh: z.coerce.number().min(0).max(14, 'pH must be between 0 and 14').optional(),
  soilOrganicCarbon: z.coerce.number().optional(),
  irrigationType: z.string().max(50).optional(),
  waterSource: z.string().max(50).optional(),
  waterAvailability: z.string().max(100).optional(),
  drainageType: z.string().max(100).optional(),
  averageRainfall: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  boundary: z.any().optional(),
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

  const [boundary, setBoundary] = useState<GeoJSON.Polygon | null>(
    (initialData?.boundary as GeoJSON.Polygon) || null
  );
  const [boundaryError, setBoundaryError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema) as any,
    defaultValues: {
      status: 'active',
      areaUnit: 'ACRES',
      state: 'Tamil Nadu',
      village: 'Anaimalai',
      taluk: 'Pollachi',
      district: 'Coimbatore',
      soilType: 'Red Loamy Soil',
      ...initialData,
    },
  });

  const currentLat = watch('latitude');
  const currentLng = watch('longitude');

  const handleBoundaryChange = (
    newBoundary: GeoJSON.Polygon | null,
    centerLat?: number,
    centerLng?: number,
    areaSqMeters?: number
  ) => {
    setBoundary(newBoundary);
    setValue('boundary', newBoundary);
    setBoundaryError(null);

    if (centerLat !== undefined) setValue('latitude', centerLat);
    if (centerLng !== undefined) setValue('longitude', centerLng);
    if (areaSqMeters !== undefined && areaSqMeters > 0) {
      setValue('totalArea', Math.round(areaSqMeters * 100) / 100);
      setValue('areaUnit', 'SQ_METERS');
    }
  };

  const onFormSubmit = (data: FarmFormData) => {
    const valResult = validateFarmBoundary(boundary);
    if (!valResult.valid) {
      setBoundaryError(
        isTa
          ? 'சேமிப்பதற்கு முன் உங்கள் பண்ணை எல்லையை வரைபடத்தில் வரையவும்.'
          : 'Please draw your farm boundary on the map before saving.'
      );
      return;
    }

    setBoundaryError(null);
    onSubmit({
      ...data,
      boundary: boundary || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-6">
      {/* Section 1: Basic Details */}
      <FormSection icon={Wheat} title={isTa ? '🌾 அடிப்படை விவரங்கள்' : '🌾 Basic Details'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'பண்ணையின் பெயர் *' : 'Farm Name *'} error={errors.name?.message}>
            <Input {...register('name')} placeholder={isTa ? 'எ.கா. பசுமை பண்ணை' : 'e.g. Green Valley Farm'} className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'பெயர் (தமிழ்)' : 'Farm Name (Tamil)'} error={errors.nameTa?.message}>
            <Input {...register('nameTa')} placeholder="எ.கா. பசுமை பண்ணை" className="h-9 bg-background" />
          </FormField>
        </div>
      </FormSection>

      {/* Section 2: Farm Location & Boundary */}
      <FormSection icon={MapIcon} title={isTa ? '📍 பண்ணை இருப்பிடம் & எல்லை' : '📍 Farm Location & Boundary'}>
        <div className="space-y-4">
          <FarmBoundaryMap
            boundary={boundary}
            latitude={currentLat}
            longitude={currentLng}
            onBoundaryChange={handleBoundaryChange}
            isTamil={isTa}
          />

          {boundaryError && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{boundaryError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <FormField label={isTa ? 'அட்சரேகை (தானியங்கி)' : 'Latitude (Auto)'}>
              <Input
                type="number"
                step="any"
                {...register('latitude')}
                readOnly
                placeholder={isTa ? 'எல்லையிலிருந்து கணக்கிடப்படும்' : 'Calculated from boundary'}
                className="h-9 bg-muted/50 font-mono text-muted-foreground cursor-not-allowed"
              />
            </FormField>
            <FormField label={isTa ? 'தீர்க்கரேகை (தானியங்கி)' : 'Longitude (Auto)'}>
              <Input
                type="number"
                step="any"
                {...register('longitude')}
                readOnly
                placeholder={isTa ? 'எல்லையிலிருந்து கணக்கிடப்படும்' : 'Calculated from boundary'}
                className="h-9 bg-muted/50 font-mono text-muted-foreground cursor-not-allowed"
              />
            </FormField>
            <FormField label={isTa ? 'பரப்பளவு (தானியங்கி)' : 'Total Area (Auto)'}>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="any"
                  {...register('totalArea')}
                  readOnly
                  placeholder={isTa ? 'தானியங்கி' : 'Auto'}
                  className="h-9 bg-muted/50 flex-1 text-muted-foreground cursor-not-allowed"
                />
                <select {...register('areaUnit')} className="h-9 px-2 border border-input rounded-lg text-sm bg-background">
                  <option value="SQ_METERS">m²</option>
                  <option value="ACRES">Acres</option>
                  <option value="HECTARES">Ha</option>
                  <option value="CENTS">Cents</option>
                </select>
              </div>
              {errors.totalArea && <p className="text-xs text-destructive mt-1">{errors.totalArea.message}</p>}
            </FormField>
          </div>
        </div>
      </FormSection>

      {/* Section 3: Location */}
      <FormSection icon={MapPin} title={isTa ? '📍 இடம்' : '📍 Location'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={isTa ? 'கிராமம் *' : 'Village *'} error={errors.village?.message}>
            <Input {...register('village')} placeholder={isTa ? 'எ.கா. மேலூர்' : 'e.g. Melur'} className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'தாலுகா *' : 'Taluk *'} error={errors.taluk?.message}>
            <Input {...register('taluk')} placeholder={isTa ? 'எ.கா. மதுரை தெற்கு' : 'e.g. Madurai South'} className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மாவட்டம் *' : 'District *'} error={errors.district?.message}>
            <Input {...register('district')} placeholder={isTa ? 'எ.கா. மதுரை' : 'e.g. Madurai'} className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'மாநிலம் *' : 'State *'} error={errors.state?.message}>
            <Input {...register('state')} placeholder={isTa ? 'எ.கா. தமிழ்நாடு' : 'e.g. Tamil Nadu'} className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'அஞ்சல் குறியீடு' : 'Pincode'}>
            <Input {...register('pincode')} placeholder="e.g. 625001" className="h-9 bg-background" />
          </FormField>
        </div>
      </FormSection>

      {/* Section 4: Soil */}
      <FormSection icon={Leaf} title={isTa ? '🌱 மண்' : '🌱 Soil'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={isTa ? 'மண் வகை *' : 'Soil Type *'} error={errors.soilType?.message}>
            <select {...register('soilType')} className="h-9 w-full px-3 border border-input rounded-lg text-sm bg-background">
              <option value="">{isTa ? '-- மண் வகையை தேர்ந்தெடு --' : '-- Select Soil Type --'}</option>
              <option value="Clay">{isTa ? 'களிமண்' : 'Clay'}</option>
              <option value="Sandy">{isTa ? 'மணல் மண்' : 'Sandy'}</option>
              <option value="Loam">{isTa ? 'வண்டல் மண்' : 'Loam'}</option>
              <option value="Silt">{isTa ? 'வண்டல்' : 'Silt'}</option>
              <option value="Clay Loam">{isTa ? 'களிவண்டல் மண்' : 'Clay Loam'}</option>
              <option value="Sandy Loam">{isTa ? 'மணல்வண்டல் மண்' : 'Sandy Loam'}</option>
              <option value="Red Soil">{isTa ? 'செம்மண்' : 'Red Soil'}</option>
              <option value="Black Soil">{isTa ? 'கரு மண்' : 'Black Soil'}</option>
              <option value="Laterite">{isTa ? 'லேட்டரைட்' : 'Laterite'}</option>
              <option value="Alluvial">{isTa ? 'வண்டல் நிலம்' : 'Alluvial'}</option>
            </select>
          </FormField>
          <FormField label={isTa ? 'மண் pH' : 'Soil pH'} error={errors.soilPh?.message}>
            <Input type="number" step="0.01" {...register('soilPh')} placeholder="e.g. 6.5" className="h-9 bg-background" />
          </FormField>
          <FormField label={isTa ? 'கரிம கார்பன் (%)' : 'Organic Carbon (%)'}>
            <Input type="number" step="0.01" {...register('soilOrganicCarbon')} placeholder="e.g. 1.2" className="h-9 bg-background" />
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
          {isSubmitting ? (isTa ? 'உருவாக்குகிறது...' : 'Creating...') : (isTa ? 'பண்ணையை உருவாக்கு' : 'Create Farm')}
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
