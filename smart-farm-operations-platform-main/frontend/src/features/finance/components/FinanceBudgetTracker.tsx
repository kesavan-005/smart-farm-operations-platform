import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Plus, Target, AlertTriangle, Calendar, Save, Trash2 } from 'lucide-react';
import { useCreateFinancialBudget, useDeleteFinancialBudget } from '../api/financeApi';
import type { FinancialBudget } from '@/types/domain';

interface TrackerProps {
  budgets: FinancialBudget[];
  isLoading: boolean;
  farmId: string;
}

interface FormValues {
  category: string;
  limitAmount: number;
  startDate: string;
  endDate: string;
}

const EXPENSE_CATEGORIES = [
  'SEED_PURCHASE',
  'FERTILIZER_PURCHASE',
  'PESTICIDE_PURCHASE',
  'PAYROLL',
  'FUEL',
  'EQUIPMENT_REPAIR',
  'WATER_BILL',
  'OTHER_EXPENSE'
];

export default function FinanceBudgetTracker({ budgets, isLoading, farmId }: TrackerProps) {
  const { t } = useTranslation('finance');
  const [isAllocating, setIsAllocating] = useState(false);
  const createBudgetMutation = useCreateFinancialBudget(farmId);
  const deleteBudgetMutation = useDeleteFinancialBudget(farmId);

  const budgetSchema = z.object({
    category: z.string().min(1, { message: t('validation.categoryRequired') || 'Category is required' }),
    limitAmount: z.preprocess((val) => Number(val), z.number().positive({ message: t('validation.limitPositive') || 'Limit must be positive' })),
    startDate: z.string().min(1, { message: t('validation.startDateRequired') || 'Start date is required' }),
    endDate: z.string().min(1, { message: t('validation.endDateRequired') || 'End date is required' }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      category: 'SEED_PURCHASE',
      limitAmount: 10000,
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createBudgetMutation.mutateAsync({
        ...values,
        farmId,
        spentAmount: 0,
      } as any);
      setIsAllocating(false);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">{t('form.budgetTitle')}</h4>
          <p className="text-[10px] text-muted-foreground">{t('form.budgetSubtitle')}</p>
        </div>
        {!isAllocating && (
          <button
            onClick={() => setIsAllocating(true)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-2 px-3.5 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> {t('buttons.createBudget')}
          </button>
        )}
      </div>

      {/* Allocation form */}
      {isAllocating && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-in shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">{t('form.category')}</label>
              <select
                {...register('category')}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">{t('form.limit')} (₹)</label>
              <input
                type="number"
                {...register('limitAmount')}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              {errors.limitAmount && <span className="text-[10px] text-red-500">{errors.limitAmount.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">{t('form.startDate')}</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              {errors.startDate && <span className="text-[10px] text-red-500">{errors.startDate.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">{t('form.endDate')}</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              {errors.endDate && <span className="text-[10px] text-red-500">{errors.endDate.message}</span>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAllocating(false)}
              className="px-3.5 py-1.5 text-xs font-bold uppercase border border-border hover:bg-muted text-muted-foreground rounded-lg"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-1.5 px-3.5 rounded-lg"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? t('buttons.saving') : t('buttons.saveLimit')}
            </button>
          </div>
        </form>
      )}

      {/* Budgets Progress List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-36 bg-card border border-border rounded-xl animate-pulse" />
          ))
        ) : budgets.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-xs text-muted-foreground col-span-2">
            {t('empty.noBudgets')}
          </div>
        ) : (
          budgets.map((budget) => {
            const percent = Math.min((budget.spentAmount / budget.limitAmount) * 100, 100);
            const isOverrun = budget.spentAmount > budget.limitAmount;

            return (
              <div key={budget.id} className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm hover:border-primary/10 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Target className="w-4 h-4 text-primary shrink-0" />
                      {budget.category.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {budget.startDate} to {budget.endDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverrun && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                        <AlertTriangle className="w-3 h-3" /> {t('badges.overrun')}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(t('buttons.confirmDelete') || 'Are you sure you want to delete this?')) {
                          deleteBudgetMutation.mutate({ id: budget.id, farmId });
                        }
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-all shrink-0"
                      title={t('buttons.confirmDelete') || 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground">{t('badges.used')}</span>
                    <span className={isOverrun ? 'text-amber-600 animate-pulse' : 'text-primary'}>
                      {Math.round(percent)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverrun ? 'bg-amber-600' : 'bg-primary'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Margins */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">{t('ledger.limit')}</span>
                    <span className="font-bold text-foreground">₹{budget.limitAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">{t('ledger.spent')}</span>
                    <span className={`font-bold ${isOverrun ? 'text-amber-600' : 'text-foreground'}`}>
                      ₹{budget.spentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">{t('ledger.remaining')}</span>
                    <span className={`font-bold ${isOverrun ? 'text-amber-600' : 'text-primary'}`}>
                      ₹{(budget.limitAmount - budget.spentAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
