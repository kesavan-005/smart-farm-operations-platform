import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';

interface FormValues {
  transactionType: 'REVENUE' | 'EXPENSE' | 'LIABILITY' | 'ASSET';
  category: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  status: string;
  transactionDate: string;
}

interface FormProps {
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

const CATEGORIES_BY_TYPE = {
  REVENUE: ['HARVEST_SALE', 'GOVERNMENT_SUBSIDY', 'OTHER_INCOME'],
  EXPENSE: ['SEED_PURCHASE', 'FERTILIZER_PURCHASE', 'PESTICIDE_PURCHASE', 'PAYROLL', 'FUEL', 'EQUIPMENT_REPAIR', 'WATER_BILL', 'OTHER_EXPENSE'],
  LIABILITY: ['LOAN_REPAYMENT', 'INTEREST_CHARGE', 'OTHER_LIABILITY'],
  ASSET: ['EQUIPMENT_PURCHASE', 'LAND_ACQUISITION', 'OTHER_ASSET'],
};

export default function FinanceForm({ onSubmit, onCancel }: FormProps) {
  const { t } = useTranslation('finance');

  const financeSchema = z.object({
    transactionType: z.enum(['REVENUE', 'EXPENSE', 'LIABILITY', 'ASSET']),
    category: z.string().min(1, { message: t('validation.categoryRequired') || 'Category is required' }),
    amount: z.preprocess((val) => Number(val), z.number().positive({ message: t('validation.amountPositive') || 'Amount must be greater than 0' })),
    description: z.string().optional(),
    paymentMethod: z.string().min(1, { message: t('validation.paymentMethodRequired') || 'Payment method is required' }),
    status: z.string().min(1, { message: t('validation.statusRequired') || 'Status is required' }),
    transactionDate: z.string().min(1, { message: t('validation.dateRequired') || 'Transaction date is required' }),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(financeSchema) as any,
    defaultValues: {
      transactionType: 'EXPENSE',
      category: 'SEED_PURCHASE',
      amount: 0,
      description: '',
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      transactionDate: new Date().toISOString().substring(0, 16),
    },
  });

  const transactionType = watch('transactionType') || 'EXPENSE';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('form.recordTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('form.recordSubtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.transactionType')}</label>
            <select
              {...register('transactionType')}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="EXPENSE">{t('form.typeExpense')}</option>
              <option value="REVENUE">{t('form.typeRevenue')}</option>
              <option value="LIABILITY">{t('form.typeLiability')}</option>
              <option value="ASSET">{t('form.typeAsset')}</option>
            </select>
            {errors.transactionType && (
              <span className="text-xs text-red-500 mt-1 block">{errors.transactionType.message}</span>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.category')}</label>
            <select
              {...register('category')}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES_BY_TYPE[transactionType].map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="text-xs text-red-500 mt-1 block">{errors.category.message}</span>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.amount')} (₹)</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.amount && (
              <span className="text-xs text-red-500 mt-1 block">{errors.amount.message}</span>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.date')}</label>
            <input
              type="datetime-local"
              {...register('transactionDate')}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.transactionDate && (
              <span className="text-xs text-red-500 mt-1 block">{errors.transactionDate.message}</span>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.paymentMethod')}</label>
            <select
              {...register('paymentMethod')}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT">Line of Credit</option>
            </select>
            {errors.paymentMethod && (
              <span className="text-xs text-red-500 mt-1 block">{errors.paymentMethod.message}</span>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.status')}</label>
            <select
              {...register('status')}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
            {errors.status && (
              <span className="text-xs text-red-500 mt-1 block">{errors.status.message}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">{t('form.description')}</label>
          <textarea
            rows={3}
            {...register('description')}
            placeholder="Add specific description or transaction reference..."
            className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold uppercase border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-all"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? t('buttons.saving') : t('buttons.saveTransaction')}
          </button>
        </div>
      </form>
    </div>
  );
}
