import { useOfflineQuery } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { db } from '@/offline/db';
import type { FinancialTransaction, JournalEntry, FinancialBudget, FinanceDashboard } from '@/types/domain';

// ==========================================
// Financial Transactions Hooks
// ==========================================

export function useFinancialTransactions(farmId: string, type?: string, category?: string) {
  return useOfflineQuery<FinancialTransaction>({
    queryKey: ['financialTransactions', farmId, { type, category }],
    endpoint: `/farms/${farmId}/finance/transactions`,
    tableName: 'financialTransactions',
    params: { type, category } as any,
    localFilter: (txn) => {
      let match = !farmId || txn.farmId === farmId;
      if (type) match = match && txn.transactionType === type;
      if (category) match = match && txn.category === category;
      return match;
    },
    queryOptions: { refetchInterval: 3000 },
  });
}

export function useCreateFinancialTransaction(farmId: string) {
  return useOfflineMutation<FinancialTransaction, Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'financialTransaction',
    tableName: 'financialTransactions',
    operation: 'CREATE',
    invalidateKeys: [
      ['financialTransactions'],
      ['financialTransactions', farmId],
      ['financeDashboard'],
      ['financeDashboard', farmId],
      ['financialBudgets', farmId],
    ],
  });
}

export function useDeleteFinancialTransaction(farmId: string) {
  return useOfflineMutation<FinancialTransaction, { id: string; farmId: string }>({
    entityType: 'financialTransaction',
    tableName: 'financialTransactions',
    operation: 'DELETE',
    invalidateKeys: [
      ['financialTransactions'],
      ['financialTransactions', farmId],
      ['financeDashboard'],
      ['financeDashboard', farmId],
      ['financialBudgets', farmId],
    ],
  });
}

// ==========================================
// Budgets Hooks
// ==========================================

export function useFinancialBudgets(farmId: string) {
  return useOfflineQuery<FinancialBudget>({
    queryKey: ['financialBudgets', farmId],
    endpoint: `/farms/${farmId}/finance/budgets`,
    tableName: 'financialBudgets',
    localFilter: (budget) => !farmId || budget.farmId === farmId,
    queryOptions: { refetchInterval: 3000 },
  });
}

export function useCreateFinancialBudget(farmId: string) {
  return useOfflineMutation<FinancialBudget, Omit<FinancialBudget, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'financialBudget',
    tableName: 'financialBudgets',
    operation: 'CREATE',
    invalidateKeys: [
      ['financialBudgets', farmId],
      ['financeDashboard', farmId],
    ],
  });
}

export function useDeleteFinancialBudget(farmId: string) {
  return useOfflineMutation<FinancialBudget, { id: string; farmId: string }>({
    entityType: 'financialBudget',
    tableName: 'financialBudgets',
    operation: 'DELETE',
    invalidateKeys: [
      ['financialBudgets', farmId],
      ['financeDashboard', farmId],
    ],
  });
}

// ==========================================
// Journal Entries Hook
// ==========================================

export function useJournalEntries(farmId: string) {
  return useOfflineQuery<JournalEntry>({
    queryKey: ['journalEntries', farmId],
    endpoint: `/farms/${farmId}/finance/journal`,
    tableName: 'journalEntries',
    localFilter: () => true,
    queryOptions: { refetchInterval: 3000 },
  });
}

// ==========================================
// Dashboard Hook (With Offline Fallback calculations)
// ==========================================

export function useFinanceDashboard(farmId: string) {
  return useQuery<FinanceDashboard>({
    queryKey: ['financeDashboard', farmId],
    queryFn: async () => {
      // 1. Fetch IndexedDB local data for robust computations
      let txns: FinancialTransaction[] = [];
      let budgets: FinancialBudget[] = [];
      let inventory: any[] = [];

      try {
        txns = farmId
          ? await db.financialTransactions.where('farmId').equals(farmId).toArray()
          : await db.financialTransactions.toArray();
        budgets = farmId
          ? await db.financialBudgets.where('farmId').equals(farmId).toArray()
          : await db.financialBudgets.toArray();
        inventory = farmId
          ? await db.inventoryItems.where('farmId').equals(farmId).toArray()
          : await db.inventoryItems.toArray();
      } catch (err) {
        console.error('IndexedDB read error for dashboard:', err);
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let revenueToday = 0;
      let expensesToday = 0;
      let revenueMonth = 0;
      let expensesMonth = 0;
      let totalRevenue = 0;
      let totalExpenses = 0;
      let cashAvailable = 0;
      let outstandingPayments = 0;

      const categoryRevenueMap: Record<string, number> = {};
      const categoryExpenseMap: Record<string, number> = {};

      txns.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const dateStr = t.transactionDate || (t as any).createdAt;
        const d = dateStr ? new Date(dateStr) : new Date();
        const isValidDate = !isNaN(d.getTime());
        const isTxnToday = isValidDate && d >= todayStart && d <= todayEnd;
        const isTxnThisMonth = isValidDate && d.getMonth() === currentMonth && d.getFullYear() === currentYear;

        if (t.transactionType === 'REVENUE') {
          totalRevenue += amt;
          if (isTxnToday) revenueToday += amt;
          if (isTxnThisMonth) revenueMonth += amt;
          categoryRevenueMap[t.category] = (categoryRevenueMap[t.category] || 0) + amt;

          if (t.status === 'COMPLETED' || t.status === 'PAID') {
            cashAvailable += amt;
          } else if (t.status === 'PENDING') {
            outstandingPayments += amt;
          }
        } else if (t.transactionType === 'EXPENSE') {
          totalExpenses += amt;
          if (isTxnToday) expensesToday += amt;
          if (isTxnThisMonth) expensesMonth += amt;
          categoryExpenseMap[t.category] = (categoryExpenseMap[t.category] || 0) + amt;

          if (t.status === 'COMPLETED' || t.status === 'PAID') {
            cashAvailable -= amt;
          } else if (t.status === 'PENDING') {
            outstandingPayments += amt;
          }
        }
      });

      const inventoryValue = inventory.reduce(
        (acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitCost || 0)),
        0
      );

      const totalBudgetLimit = budgets.reduce(
        (acc, b) => acc + Number((b as any).allocatedAmount || (b as any).amount || (b as any).limit || 0),
        0
      );
      const budgetUtilization = totalBudgetLimit > 0
        ? Math.min(Math.round((totalExpenses / totalBudgetLimit) * 100), 100)
        : (totalExpenses > 0 ? 100 : 0);

      const netProfit = totalRevenue - totalExpenses;
      const roi = totalExpenses > 0
        ? Math.round((netProfit / totalExpenses) * 100)
        : (totalRevenue > 0 ? 100 : 0);

      const topExpenses = Object.entries(categoryExpenseMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const topRevenue = Object.entries(categoryRevenueMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const localComputedDashboard: FinanceDashboard = {
        revenueToday,
        revenueMonth,
        expensesToday,
        expensesMonth,
        netProfit,
        cashAvailable,
        inventoryValue,
        outstandingPayments,
        budgetUtilization,
        roi,
        topExpenses,
        topRevenue,
        revenueVsExpenses: [],
        monthlyCashFlow: [],
        profitTrend: [],
        expenseBreakdown: [],
        revenueSources: [],
        budgetUsage: [],
        farmWiseProfit: [],
        fieldWiseCost: [],
        inventoryPurchaseTrend: [],
        alerts: [],
        aiInsights: [],
        activities: txns.slice(0, 10).map((t) => ({
          id: t.id,
          transactionType: t.transactionType,
          category: t.category,
          amount: t.amount,
          status: t.status || 'COMPLETED',
          refNumber: (t as any).referenceNumber || t.id.substring(0, 8),
          farm: (t as any).farmName || 'Farm',
          timestamp: t.transactionDate || (t as any).createdAt || new Date().toISOString(),
        })),
      };

      try {
        if (!farmId) return localComputedDashboard;
        const response = await apiClient.get(`/farms/${farmId}/finance/dashboard`);
        const serverData = response.data.data ?? {};

        return {
          ...localComputedDashboard,
          ...serverData,
          revenueToday: serverData.revenueToday ?? revenueToday,
          expensesToday: serverData.expensesToday ?? expensesToday,
          revenueMonth: serverData.revenueMonth ?? revenueMonth,
          expensesMonth: serverData.expensesMonth ?? expensesMonth,
          netProfit: serverData.netProfit ?? netProfit,
          cashAvailable: serverData.cashAvailable ?? cashAvailable,
          inventoryValue: serverData.inventoryValue ?? inventoryValue,
          outstandingPayments: serverData.outstandingPayments ?? outstandingPayments,
          budgetUtilization: serverData.budgetUtilization ?? budgetUtilization,
          roi: serverData.roi ?? roi,
          topExpenses: (serverData.topExpenses && serverData.topExpenses.length > 0) ? serverData.topExpenses : topExpenses,
          topRevenue: (serverData.topRevenue && serverData.topRevenue.length > 0) ? serverData.topRevenue : topRevenue,
          activities: (serverData.activities && serverData.activities.length > 0) ? serverData.activities : localComputedDashboard.activities,
        };
      } catch (error) {
        return localComputedDashboard;
      }
    },
    refetchInterval: 3000,
  });
}
