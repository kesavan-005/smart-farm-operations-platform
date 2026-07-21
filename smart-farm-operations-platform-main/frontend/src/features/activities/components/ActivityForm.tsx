import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Calendar, FileText, Loader2, ArrowLeft } from 'lucide-react';
import type { Farm, Field, Crop } from '@/types/domain';
import { apiClient } from '@/lib/apiClient';
import { db } from '@/offline/db';

// Schema validation definition
export const activitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  activityType: z.enum(['IRRIGATION', 'FERTILIZER', 'PESTICIDE', 'HARVEST', 'PLANTING', 'SOIL_TEST', 'MAINTENANCE', 'INSPECTION', 'OTHER']),
  status: z.enum(['PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  farmId: z.string().min(1, 'Farm is required'),
  fieldId: z.string().min(1, 'Field is required'),
  cropId: z.string().optional().or(z.literal('')),
  performedBy: z.string().optional().or(z.literal('')),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  completedDate: z.string().optional().or(z.literal('')),
  estimatedDuration: z.coerce.number().min(0, 'Must be positive').optional(),
  actualDuration: z.coerce.number().min(0, 'Must be positive').optional(),
  notes: z.string().optional(),
  attachments: z.string().optional(),
  season: z.string().optional(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  estimatedCost: z.coerce.number().min(0).optional(),
  supervisorId: z.string().optional().or(z.literal('')),
  requiredEquipment: z.string().optional(),
  requiredInventory: z.string().optional(),
});

export type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  initialData?: Partial<ActivityFormData & { id: string }>;
  farms: Farm[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ActivityForm({
  initialData,
  farms,
  onSubmit,
  onCancel,
  isSubmitting = false
}: ActivityFormProps) {
  const { t, i18n } = useTranslation(['activities', 'common']);
  const isTa = i18n.language === 'ta';

  // Load all users to populate the Assigned Worker dropdown
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load all fields and crops locally from IndexedDB
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [allCrops, setAllCrops] = useState<Crop[]>([]);

  useEffect(() => {
    async function loadDbData() {
      try {
        const fieldsList = await db.fields.toArray();
        const cropsList = await db.crops.toArray();
        setAllFields(fieldsList);
        setAllCrops(cropsList);
      } catch (err) {
        console.error('Failed to load fields/crops from IndexedDB:', err);
      }
    }
    loadDbData();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        const res = await apiClient.get('/users');
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load users list:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Format OffsetDateTime timestamps to HTML datetime-local input formats
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzoffset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzoffset))
        .toISOString()
        .slice(0, 16);
      return localISOTime;
    } catch {
      return '';
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      activityType: 'IRRIGATION',
      status: 'PLANNED',
      priority: 'MEDIUM',
      title: '',
      description: '',
      notes: '',
      attachments: '',
      season: '',
      estimatedCost: 0,
      requiredEquipment: '',
      requiredInventory: '',
      ...initialData,
      scheduledDate: initialData?.scheduledDate ? formatDateTimeLocal(initialData.scheduledDate) : '',
      completedDate: initialData?.completedDate ? formatDateTimeLocal(initialData.completedDate) : '',
      startDate: initialData?.startDate ? formatDateTimeLocal(initialData.startDate) : '',
      endDate: initialData?.endDate ? formatDateTimeLocal(initialData.endDate) : '',
      supervisorId: initialData?.supervisorId || '',
    } as any,
  });

  const watchedFarmId = watch('farmId');
  const watchedFieldId = watch('fieldId');
  const watchedStatus = watch('status');

  // Filter fields and crops lists dynamically based on selections
  const filteredFields = watchedFarmId 
    ? allFields.filter(f => f.farmId === watchedFarmId)
    : [];

  const filteredCrops = watchedFieldId 
    ? allCrops.filter(c => c.fieldId === watchedFieldId)
    : [];



  // Reset dependent fields if parent selection changes
  useEffect(() => {
    if (watchedFarmId && initialData?.farmId !== watchedFarmId) {
      setValue('fieldId', '');
      setValue('cropId', '');
    }
  }, [watchedFarmId, setValue]);

  useEffect(() => {
    if (watchedFieldId && initialData?.fieldId !== watchedFieldId) {
      setValue('cropId', '');
    }
  }, [watchedFieldId, setValue]);

  const onSubmitHandler = (data: ActivityFormData) => {
    // Format dates to ISO string with offset
    const formattedData = {
      ...data,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      completedDate: data.completedDate ? new Date(data.completedDate).toISOString() : null,
      cropId: data.cropId || null,
      performedBy: data.performedBy || null,
    };
    onSubmit(formattedData);
  };

  return (
    <div className="sf-card p-6 max-w-3xl mx-auto sf-slide-up">
      <div className="flex items-center gap-3 mb-6 border-b border-muted pb-4">
        <button
          onClick={onCancel}
          className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-foreground">
          {initialData?.id ? t('edit_activity') : t('create_activity')}
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('title')} *</label>
            <Input
              type="text"
              placeholder={isTa ? 'எ.கா: நிலம் நீர் பாசனம்' : 'e.g., Irrigate Field A'}
              {...register('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('description')}</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder={isTa ? 'செயல்பாட்டின் விரிவான விளக்கம்...' : 'Detailed description of the task...'}
              className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Farm */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('farm')} *</label>
            <select
              {...register('farmId')}
              className={`w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none ${
                errors.farmId ? 'border-destructive' : ''
              }`}
            >
              <option value="">{isTa ? '-- பண்ணையைத் தேர்ந்தெடுக்கவும் --' : '-- Select Farm --'}</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {errors.farmId && (
              <p className="text-xs text-destructive mt-0.5">{errors.farmId.message}</p>
            )}
          </div>

          {/* Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('field')} *</label>
            <select
              {...register('fieldId')}
              disabled={!watchedFarmId}
              className={`w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none ${
                errors.fieldId ? 'border-destructive' : ''
              }`}
            >
              <option value="">{isTa ? '-- நிலத்தைத் தேர்ந்தெடுக்கவும் --' : '-- Select Field --'}</option>
              {filteredFields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {errors.fieldId && (
              <p className="text-xs text-destructive mt-0.5">{errors.fieldId.message}</p>
            )}
          </div>

          {/* Crop */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('crop')}</label>
            <select
              {...register('cropId')}
              disabled={!watchedFieldId}
              className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
            >
              <option value="">{isTa ? '-- பயிரைத் தேர்ந்தெடுக்கவும் (விருப்பம்) --' : '-- Select Crop (Optional) --'}</option>
              {filteredCrops.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Activity Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('activity_type')}</label>
            <select
              {...register('activityType')}
              className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
            >
              <option value="IRRIGATION">{t('irrigation')}</option>
              <option value="FERTILIZER">{t('fertilizer')}</option>
              <option value="PESTICIDE">{t('pesticide')}</option>
              <option value="HARVEST">{t('harvest')}</option>
              <option value="PLANTING">{t('planting')}</option>
              <option value="SOIL_TEST">{t('soil_test')}</option>
              <option value="MAINTENANCE">{t('maintenance')}</option>
              <option value="INSPECTION">{t('inspection')}</option>
              <option value="OTHER">{t('other')}</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('status')}</label>
            <select
              {...register('status')}
              className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
            >
              <option value="PLANNED">{t('planned')}</option>
              <option value="SCHEDULED">{isTa ? 'திட்டமிடப்பட்டது' : 'Scheduled'}</option>
              <option value="IN_PROGRESS">{t('in_progress')}</option>
              <option value="COMPLETED">{t('completed')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="DELAYED">{isTa ? 'தாமதமானது' : 'Delayed'}</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('priority')}</label>
            <select
              {...register('priority')}
              className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
            >
              <option value="LOW">{t('low')}</option>
              <option value="MEDIUM">{t('medium')}</option>
              <option value="HIGH">{t('high')}</option>
              <option value="CRITICAL">{t('critical')}</option>
            </select>
          </div>

          {/* Assigned Performer */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('assigned_to')}</label>
            <select
              {...register('performedBy')}
              className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
              disabled={loadingUsers}
            >
              <option value="">{isTa ? '-- தொழிலாளியைத் தேர்ந்தெடுக்கவும் --' : '-- Select Worker --'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>
              ))}
            </select>
          </div>

          {/* Supervisor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'கண்காணிப்பாளர்' : 'Supervisor'}</label>
            <select
              {...register('supervisorId')}
              className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
              disabled={loadingUsers}
            >
              <option value="">{isTa ? '-- கண்காணிப்பாளரைத் தேர்ந்தெடுக்கவும் --' : '-- Select Supervisor --'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('scheduled_date')} *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <Input
                type="datetime-local"
                {...register('scheduledDate')}
                className={`pl-9 ${errors.scheduledDate ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.scheduledDate && (
              <p className="text-xs text-destructive mt-0.5">{errors.scheduledDate.message}</p>
            )}
          </div>

          {/* Completed Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('completed_date')}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <Input
                type="datetime-local"
                disabled={watchedStatus !== 'COMPLETED' && watchedStatus !== 'CANCELLED'}
                {...register('completedDate')}
                className="pl-9"
              />
            </div>
          </div>

          {/* Est. Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('estimated_duration')}</label>
            <Input
              type="number"
              placeholder="e.g., 60"
              {...register('estimatedDuration')}
            />
          </div>

          {/* Actual Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('actual_duration')}</label>
            <Input
              type="number"
              placeholder="e.g., 75"
              {...register('actualDuration')}
            />
          </div>

          {/* Season */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'பருவம்' : 'Season'}</label>
            <Input
              type="text"
              placeholder="e.g., Rabi, Kharif, Kuruvai"
              {...register('season')}
            />
          </div>

          {/* Est. Cost */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'மதிப்பிடப்பட்ட செலவு' : 'Estimated Cost ($)'}</label>
            <Input
              type="number"
              placeholder="e.g., 500"
              {...register('estimatedCost')}
            />
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'ஆரம்ப தேதி' : 'Start Date'}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <Input
                type="datetime-local"
                {...register('startDate')}
                className="pl-9"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'முடிவு தேதி' : 'End Date'}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <Input
                type="datetime-local"
                {...register('endDate')}
                className="pl-9"
              />
            </div>
          </div>

          {/* Required Equipment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'தேவைப்படும் உபகரணங்கள்' : 'Required Equipment'}</label>
            <Input
              type="text"
              placeholder="e.g., Tractor, Sprayer"
              {...register('requiredEquipment')}
            />
          </div>

          {/* Required Inventory / Materials */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'தேவைப்படும் சரக்குகள்' : 'Required Materials'}</label>
            <Input
              type="text"
              placeholder="e.g., NPK Fertilizer 50kg, Seeds"
              {...register('requiredInventory')}
            />
          </div>

          {/* Attachments */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('attachments')}</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
              <Input
                type="url"
                placeholder="https://example.com/photo.jpg"
                {...register('attachments')}
                className="pl-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">{t('notes')}</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder={isTa ? 'செயல்பாட்டைப் பற்றிய ஏதேனும் இதர குறிப்புகள்...' : 'Any final notes about this activity...'}
              className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex gap-3 justify-end border-t border-muted pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 px-6 font-semibold"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
