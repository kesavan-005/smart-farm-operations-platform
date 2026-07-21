import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import type { Farm, Field } from '@/types/domain';
import { apiClient } from '@/lib/apiClient';
import { db } from '@/offline/db';

export const taskSchema = z.object({
  activityId: z.string().min(1, 'Activity is required'),
  farmId: z.string().min(1, 'Farm is required'),
  fieldId: z.string().min(1, 'Field is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  assignedTo: z.string().transform(val => val === '' ? undefined : val).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  dueDate: z.string().min(1, 'Due date is required'),
  estimatedHours: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().min(0).max(999).optional()),
  actualHours: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().min(0).max(999).optional()),
  remarks: z.string().optional(),
  assignedEquipmentId: z.string().transform(val => val === '' ? undefined : val).optional(),
  inventoryItemId: z.string().transform(val => val === '' ? undefined : val).optional(),
  inventoryQuantityUsed: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().min(0).optional()),
  actualCost: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().min(0).optional()),
});

export type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialData?: Partial<TaskFormData & { id: string }>;
  farms: Farm[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isWorker?: boolean;
}

export default function TaskForm({
  initialData,
  farms,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isWorker = false
}: TaskFormProps) {
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const isTa = i18n.language === 'ta';

  // State caches
  const [users, setUsers] = useState<any[]>([]);
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadCaches() {
      try {
        const fieldsList = await db.fields.toArray();
        const activitiesList = await db.activities.toArray();
        const eqList = await db.equipment.toArray();
        const invList = await db.inventoryItems.toArray();
        setAllFields(fieldsList);
        setAllActivities(activitiesList);
        setEquipmentList(eqList);
        setInventoryItems(invList);

        // Load users from REST endpoint
        const res = await apiClient.get('/users');
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load local task form dependencies:', err);
      }
    }
    loadCaches();
  }, []);

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
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      priority: 'MEDIUM',
      status: 'TODO',
      title: '',
      description: '',
      remarks: '',
      ...initialData,
      dueDate: initialData?.dueDate ? formatDateTimeLocal(initialData.dueDate) : '',
    } as any,
  });

  const watchedFarmId = watch('farmId');

  // Filter lists based on farm selection
  const filteredFields = watchedFarmId 
    ? allFields.filter(f => f.farmId === watchedFarmId)
    : [];

  const filteredActivities = watchedFarmId
    ? allActivities.filter(a => a.farmId === watchedFarmId)
    : [];

  const filteredEquipment = watchedFarmId
    ? equipmentList.filter(eq => eq.farmId === watchedFarmId)
    : [];

  const filteredInventory = watchedFarmId
    ? inventoryItems.filter(item => item.farmId === watchedFarmId)
    : [];

  // Reset fields on parent select updates
  useEffect(() => {
    if (watchedFarmId && initialData?.farmId !== watchedFarmId) {
      setValue('fieldId', '');
      setValue('activityId', '');
    }
  }, [watchedFarmId, setValue, initialData]);

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-card border border-border p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {initialData ? (isTa ? 'பணியைத் தொகுக்கவும்' : 'Edit Task') : (isTa ? 'புதிய பணி' : 'Create Task')}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isTa ? 'பணி விவரங்கள், காலக்கெடு மற்றும் பொறுப்பாளர்களை ஒதுக்குங்கள்.' : 'Provide details, scheduling window, allocated resources, and assignments.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {isTa ? 'திரும்பவும்' : 'Back'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Farm Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('farm')} *</label>
          <select
            {...register('farmId')}
            disabled={isWorker}
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

        {/* Field Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('field')} *</label>
          <select
            {...register('fieldId')}
            disabled={isWorker || !watchedFarmId}
            className={`w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none ${
              errors.fieldId ? 'border-destructive' : ''
            }`}
          >
            <option value="">{isTa ? '-- புலத்தைத் தேர்ந்தெடுக்கவும் --' : '-- Select Field --'}</option>
            {filteredFields.map(fd => (
              <option key={fd.id} value={fd.id}>{fd.name}</option>
            ))}
          </select>
          {errors.fieldId && (
            <p className="text-xs text-destructive mt-0.5">{errors.fieldId.message}</p>
          )}
        </div>

        {/* Activity Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('activity')} *</label>
          <select
            {...register('activityId')}
            disabled={isWorker || !watchedFarmId}
            className={`w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none ${
              errors.activityId ? 'border-destructive' : ''
            }`}
          >
            <option value="">{isTa ? '-- செயல்பாட்டைத் தேர்ந்தெடுக்கவும் --' : '-- Select Activity --'}</option>
            {filteredActivities.map(act => (
              <option key={act.id} value={act.id}>{act.title}</option>
            ))}
          </select>
          {errors.activityId && (
            <p className="text-xs text-destructive mt-0.5">{errors.activityId.message}</p>
          )}
        </div>

        {/* Task Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('title')} *</label>
          <Input
            placeholder={t('titlePlaceholder')}
            disabled={isWorker}
            {...register('title')}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('description')}</label>
          <textarea
            {...register('description')}
            rows={2}
            disabled={isWorker}
            placeholder={t('descriptionPlaceholder')}
            className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus:border-primary disabled:opacity-50"
          />
        </div>

        {/* Assigned Worker */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('assignedTo')}</label>
          <select
            {...register('assignedTo')}
            disabled={isWorker}
            className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            <option value="">{isTa ? '-- ஒதுக்கப்படவில்லை --' : '-- Unassigned --'}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('priority')} *</label>
          <select
            {...register('priority')}
            disabled={isWorker}
            className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            <option value="LOW">{isTa ? 'குறைவு' : 'Low'}</option>
            <option value="MEDIUM">{isTa ? 'நடுத்தரம்' : 'Medium'}</option>
            <option value="HIGH">{isTa ? 'உயர் முன்னுரிமை' : 'High'}</option>
            <option value="CRITICAL">{isTa ? 'அபாயகரமானது' : 'Critical'}</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('status')} *</label>
          <select
            {...register('status')}
            className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            <option value="TODO">{isTa ? 'செய்ய வேண்டியவை' : 'To Do'}</option>
            <option value="IN_PROGRESS">{isTa ? 'செயல்பாட்டில் உள்ளது' : 'In Progress'}</option>
            <option value="ON_HOLD">{isTa ? 'நிறுத்தி வைக்கப்பட்டுள்ளது' : 'On Hold'}</option>
            <option value="COMPLETED">{isTa ? 'முடிந்தது' : 'Completed'}</option>
            <option value="CANCELLED">{isTa ? 'ரத்து செய்யப்பட்டது' : 'Cancelled'}</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('dueDate')} *</label>
          <Input
            type="datetime-local"
            {...register('dueDate')}
            disabled={isWorker}
            className={errors.dueDate ? 'border-destructive' : ''}
          />
          {errors.dueDate && (
            <p className="text-xs text-destructive mt-0.5">{errors.dueDate.message}</p>
          )}
        </div>

        {/* Estimated Hours */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('estimatedHours')}</label>
          <Input
            type="number"
            step="0.1"
            placeholder={t('estimatedPlaceholder')}
            disabled={isWorker}
            {...register('estimatedHours')}
          />
        </div>

        {/* Actual Hours */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('actualHours')}</label>
          <Input
            type="number"
            step="0.1"
            placeholder={t('estimatedPlaceholder')}
            {...register('actualHours')}
          />
        </div>

        {/* Integration: Assigned Machinery Equipment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'ஒதுக்கப்பட்ட இயந்திரம்' : 'Assigned Machinery'}</label>
          <select
            {...register('assignedEquipmentId')}
            disabled={isWorker}
            className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            <option value="">{isTa ? '-- இயந்திரம் ஒதுக்கப்படவில்லை --' : '-- No Machinery Assigned --'}</option>
            {filteredEquipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name} ({eq.status})</option>
            ))}
          </select>
        </div>

        {/* Integration: Inventory item usage trigger */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'பயன்படுத்தப்பட்ட பொருள்' : 'Material Consumed'}</label>
          <select
            {...register('inventoryItemId')}
            className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none"
          >
            <option value="">{isTa ? '-- பொருள் பயன்படுத்தப்படவில்லை --' : '-- No Material Consumed --'}</option>
            {filteredInventory.map(item => (
              <option key={item.id} value={item.id}>{item.name} ({item.currentQuantity} {item.unit} available)</option>
            ))}
          </select>
        </div>

        {/* Integration: Quantity Consumed */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'பயன்படுத்திய அளவு' : 'Quantity Consumed'}</label>
          <Input
            type="number"
            step="0.1"
            placeholder="e.g. 10"
            {...register('inventoryQuantityUsed')}
          />
        </div>

        {/* Integration: Actual Cost triggered to Ledger */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">{isTa ? 'செலவு தொகை ($)' : 'Actual Cost ($)'}</label>
          <Input
            type="number"
            step="0.01"
            placeholder="e.g. 150.00"
            {...register('actualCost')}
          />
        </div>

        {/* Remarks / Task Updates */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">{t('remarks')}</label>
          <textarea
            {...register('remarks')}
            rows={3}
            placeholder={t('remarksPlaceholder')}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus:border-primary disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 shadow"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
