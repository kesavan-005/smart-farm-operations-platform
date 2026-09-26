import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { FieldSchema, type FieldData } from '../types/OnboardingTypes';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, MapPin, Map as MapIcon } from 'lucide-react';
import { FarmBoundaryMap } from '../../FarmBoundaryMap';

export function Step3FieldDetails() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const { farm, setFarm, fields, addField, removeField, nextStep, prevStep } = useWizardStore();
  const [isAdding, setIsAdding] = useState(fields.length === 0);

  const getDefaultFieldValues = (): FieldData => ({
    id: uuidv4(),
    name: '',
    area: farm?.area || 0,
    areaUnit: 'Acres',
    address: farm?.address || '',
    village: farm?.village || '',
    taluk: farm?.taluk || '',
    district: farm?.district || '',
    state: farm?.state || 'Tamil Nadu',
    pincode: farm?.pincode || '',
    latitude: farm?.latitude ?? null,
    longitude: farm?.longitude ?? null,
    boundary: farm?.boundary || null,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FieldData>({
    resolver: zodResolver(FieldSchema),
    defaultValues: getDefaultFieldValues(),
  });

  const currentBoundary = watch('boundary');
  const currentLat = watch('latitude');
  const currentLng = watch('longitude');

  const handleBoundaryChange = (
    newBoundary: GeoJSON.Polygon | null,
    centerLat?: number,
    centerLng?: number,
    areaSqMeters?: number
  ) => {
    setValue('boundary', newBoundary);
    if (centerLat !== undefined && centerLat !== null) setValue('latitude', centerLat);
    if (centerLng !== undefined && centerLng !== null) setValue('longitude', centerLng);
    if (areaSqMeters !== undefined && areaSqMeters > 0) {
      const acres = Math.round((areaSqMeters / 4046.8564224) * 100) / 100;
      setValue('area', acres);
      setValue('areaUnit', 'Acres');
    }
  };

  const onAddField = (data: FieldData) => {
    addField(data);
    
    // Also save location & boundary to parent farm state if available
    if (farm) {
      setFarm({
        ...farm,
        village: data.village || farm.village,
        taluk: data.taluk || farm.taluk,
        district: data.district || farm.district,
        state: data.state || farm.state,
        address: data.address || farm.address,
        pincode: data.pincode || farm.pincode,
        latitude: data.latitude ?? farm.latitude,
        longitude: data.longitude ?? farm.longitude,
        boundary: data.boundary || farm.boundary,
      });
    }

    reset(getDefaultFieldValues());
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
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t('onboarding.fieldAndAddress', 'Field & Address')}
          </h3>
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
              <li key={field.id} className="flex justify-between items-center p-3.5 border rounded-xl bg-card shadow-sm">
                <div>
                  <p className="font-semibold text-foreground">{field.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {field.area} {t(`onboarding.${field.areaUnit === 'Hectares' ? 'hectares' : field.areaUnit === 'Sq Feet' ? 'sqFeet' : 'acres'}`, field.areaUnit || 'Acres')} | {field.village}, {field.taluk}, {field.district} ({field.pincode})
                  </p>
                  {field.latitude && field.longitude && (
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      📍 {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeField(field.id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {isAdding && (
          <form onSubmit={handleSubmit(onAddField)} className="p-5 border rounded-2xl bg-muted/20 space-y-6 mt-4">
            <h4 className="font-bold text-foreground border-b pb-2">{t('onboarding.newField', 'New Field Details')}</h4>
            
            {/* Interactive Leaflet Location & Boundary Map */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapIcon className="w-4 h-4 text-primary" />
                {isTa ? '📍 பண்ணை இருப்பிடம் & எல்லை (வரைபடம்)' : '📍 Farm Location & Boundary (Map)'}
              </label>
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <FarmBoundaryMap
                  boundary={currentBoundary}
                  latitude={currentLat ?? undefined}
                  longitude={currentLng ?? undefined}
                  onBoundaryChange={handleBoundaryChange}
                  isTamil={isTa}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isTa
                  ? 'வரைபடத்தில் பண்ணை எல்லையை வரையவும் அல்லது உங்கள் தற்போதைய GPS இருப்பிடத்தைப் பயன்படுத்தவும். பரப்பளவு & ஒருங்கிணைப்புகள் தானாக நிரப்பப்படும்.'
                  : 'Draw your boundary on the map or use GPS location. Area and coordinates will auto-calculate.'}
              </p>
            </div>

            {/* Desktop Form Grid */}
            <div className="space-y-4">
              {/* Field Name - Full Width */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.fieldName', 'Field Name')} <span className="text-destructive">*</span>
                </label>
                <Input {...register('name')} placeholder={t('onboarding.fieldNamePlaceholder', 'e.g. East Field / வடமேற்கு பகுதி')} />
                {errors.name && <p className="text-sm text-destructive mt-1">{t(errors.name.message as string)}</p>}
              </div>

              {/* Field Area + Area Unit - 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.fieldArea', 'Field Area')} <span className="text-destructive">*</span>
                  </label>
                  <Input type="number" step="0.01" {...register('area', { valueAsNumber: true })} placeholder="0.0" />
                  {errors.area && <p className="text-sm text-destructive mt-1">{t(errors.area.message as string)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.areaUnit', 'Area Unit')}
                  </label>
                  <select
                    {...register('areaUnit')}
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Acres">{t('onboarding.acres', 'Acres')}</option>
                    <option value="Hectares">{t('onboarding.hectares', 'Hectares')}</option>
                    <option value="Sq Feet">{t('onboarding.sqFeet', 'Sq Feet')}</option>
                  </select>
                </div>
              </div>

              {/* Address - Full Width */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('onboarding.address', 'Address')}
                </label>
                <Input {...register('address')} placeholder="Street, Door No, Landmark" />
              </div>

              {/* Village + Taluk - 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.village', 'Village')} <span className="text-destructive">*</span>
                  </label>
                  <Input {...register('village')} placeholder="Village" />
                  {errors.village && <p className="text-sm text-destructive mt-1">{t(errors.village.message as string)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.taluk', 'Taluk')} <span className="text-destructive">*</span>
                  </label>
                  <Input {...register('taluk')} placeholder="Taluk" />
                  {errors.taluk && <p className="text-sm text-destructive mt-1">{errors.taluk.message}</p>}
                </div>
              </div>

              {/* District + State - 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.district', 'District')} <span className="text-destructive">*</span>
                  </label>
                  <Input {...register('district')} placeholder="District" />
                  {errors.district && <p className="text-sm text-destructive mt-1">{t(errors.district.message as string)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.state', 'State')} <span className="text-destructive">*</span>
                  </label>
                  <Input {...register('state')} placeholder="State" />
                  {errors.state && <p className="text-sm text-destructive mt-1">{t(errors.state.message as string)}</p>}
                </div>
              </div>

              {/* Pincode + Latitude - 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.pincode', 'Pincode')} <span className="text-destructive">*</span>
                  </label>
                  <Input {...register('pincode')} placeholder="e.g. 641601" maxLength={6} />
                  {errors.pincode && <p className="text-sm text-destructive mt-1">{t(errors.pincode.message as string)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.latitude', 'Latitude')}
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register('latitude', { valueAsNumber: true, setValueAs: v => v === '' || v === null || isNaN(v) ? null : Number(v) })}
                    placeholder="e.g. 10.9876"
                  />
                </div>
              </div>

              {/* Longitude - 1 Column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('onboarding.longitude', 'Longitude')}
                  </label>
                  <Input
                    type="number"
                    step="any"
                    {...register('longitude', { valueAsNumber: true, setValueAs: v => v === '' || v === null || isNaN(v) ? null : Number(v) })}
                    placeholder="e.g. 76.9876"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              {fields.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
              )}
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
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
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 font-semibold"
        >
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
}
