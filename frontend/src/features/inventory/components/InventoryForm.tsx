import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import type { InventoryItem, Warehouse, InventoryCategory } from '@/types/domain';

const inventorySchema = z.object({
  name: z.string().min(1, { message: 'Item name is required' }),
  nameTa: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  currentQuantity: z.preprocess((val) => Number(val), z.number().min(0, { message: 'Quantity must be 0 or greater' })),
  unit: z.string().min(1, { message: 'Unit is required' }),
  minimumStock: z.preprocess((val) => Number(val), z.number().min(0, { message: 'Minimum stock must be 0 or greater' })),
  maximumStock: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  cost: z.preprocess((val) => Number(val), z.number().min(0, { message: 'Cost per unit must be 0 or greater' })),
  sellingPrice: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  supplier: z.string().optional(),
  storageLocation: z.string().optional(),
  warehouseId: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']),
});

interface FormValues {
  name: string;
  nameTa?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  subcategory?: string;
  description?: string;
  currentQuantity: number;
  unit: string;
  minimumStock: number;
  maximumStock?: number;
  cost: number;
  sellingPrice?: number;
  supplier?: string;
  storageLocation?: string;
  warehouseId?: string;
  expiryDate?: string;
  batchNumber?: string;
  imageUrl?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'archived';
}

interface FormProps {
  initialValues?: InventoryItem;
  warehouses: Warehouse[];
  categories: InventoryCategory[];
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export default function InventoryForm({
  initialValues,
  warehouses,
  categories,
  onSubmit,
  onCancel,
}: FormProps) {
  const { t, i18n } = useTranslation('inventory');
  const isTa = i18n.language === 'ta';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues: {
      name: initialValues?.name || '',
      nameTa: initialValues?.nameTa || '',
      sku: initialValues?.sku || '',
      barcode: initialValues?.barcode || '',
      categoryId: initialValues?.categoryId || '',
      subcategory: initialValues?.subcategory || '',
      description: initialValues?.description || '',
      currentQuantity: initialValues?.currentQuantity || 0,
      unit: initialValues?.unit || 'kg',
      minimumStock: initialValues?.minimumStock || 0,
      maximumStock: initialValues?.maximumStock || undefined,
      cost: initialValues?.cost || 0,
      sellingPrice: initialValues?.sellingPrice || undefined,
      supplier: initialValues?.supplier || '',
      storageLocation: initialValues?.storageLocation || '',
      warehouseId: initialValues?.warehouseId || '',
      expiryDate: initialValues?.expiryDate || '',
      batchNumber: initialValues?.batchNumber || '',
      imageUrl: initialValues?.imageUrl || '',
      notes: initialValues?.notes || '',
      status: (initialValues?.status as any) || 'active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sf-stagger max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {initialValues ? t('edit_item') : t('add_item')}
          </h2>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-2.5 px-4 rounded-lg transition-all"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Item'}
        </button>
      </div>

      {/* Form Fields panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: Primary Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="sf-card p-6 border border-border bg-background space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">General Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Item Name (English)*</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.name && <span className="text-[11px] text-red-500 font-medium">{errors.name.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Item Name (Tamil)</label>
                <input
                  type="text"
                  {...register('nameTa')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">SKU / Item Code</label>
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="e.g. SKU-100-AB"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Barcode ID</label>
                <input
                  type="text"
                  {...register('barcode')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isTa && c.nameTa ? c.nameTa : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subcategory</label>
                <input
                  type="text"
                  {...register('subcategory')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">Item Description</label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Panel 2: Quantities & Costs */}
          <div className="sf-card p-6 border border-border bg-background space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Quantities & Pricing</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Current Stock Quantity*</label>
                <input
                  type="number"
                  step="any"
                  {...register('currentQuantity')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.currentQuantity && <span className="text-[11px] text-red-500 font-medium">{errors.currentQuantity.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Stock Measurement Unit*</label>
                <input
                  type="text"
                  {...register('unit')}
                  placeholder="e.g. kg, L, bags, units"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.unit && <span className="text-[11px] text-red-500 font-medium">{errors.unit.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Min Stock Threshold*</label>
                <input
                  type="number"
                  step="any"
                  {...register('minimumStock')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.minimumStock && <span className="text-[11px] text-red-500 font-medium">{errors.minimumStock.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Max Stock Limit</label>
                <input
                  type="number"
                  step="any"
                  {...register('maximumStock')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Cost per Unit (₹)*</label>
                <input
                  type="number"
                  step="any"
                  {...register('cost')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.cost && <span className="text-[11px] text-red-500 font-medium">{errors.cost.message}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Selling Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  {...register('sellingPrice')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Location, Supplier & Expiry */}
        <div className="space-y-6">
          <div className="sf-card p-6 border border-border bg-background space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Storage & Expiry</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Warehouse / Storage Unit</label>
              <select
                {...register('warehouseId')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {isTa && w.nameTa ? w.nameTa : w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Storage Location Details</label>
              <input
                type="text"
                {...register('storageLocation')}
                placeholder="e.g. Shelf A-4, Bin 2"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Expiry Date</label>
              <input
                type="date"
                {...register('expiryDate')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Batch / Lot Number</label>
              <input
                type="text"
                {...register('batchNumber')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Supplier Name</label>
              <input
                type="text"
                {...register('supplier')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Image URL</label>
              <input
                type="text"
                {...register('imageUrl')}
                placeholder="e.g. http://..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Item Status</label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
