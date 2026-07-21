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
      let match = txn.farmId === farmId;
      if (type) match = match && txn.transactionType === type;
      if (category) match = match && txn.category === category;
      return match;
    },
    queryOptions: { refetchInterval: 5000 },
  });
}

export function useCreateFinancialTransaction(farmId: string) {
  return useOfflineMutation<FinancialTransaction, Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'financialTransaction',
    tableName: 'financialTransactions',
    operation: 'CREATE',
    invalidateKeys: [
      ['financialTransactions', farmId],
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
      ['financialTransactions', farmId],
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
    localFilter: (budget) => budget.farmId === farmId,
    queryOptions: { refetchInterval: 5000 },
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
    localFilter: () => true, // Fetch matches by transaction ID mapping
    queryOptions: { refetchInterval: 5000 },
  });
}

// ==========================================
// Dashboard Hook (With Offline Fallback calculations)
// ==========================================

export function useFinanceDashboard(farmId: string) {
  return useQuery<FinanceDashboard>({
    queryKey: ['financeDashboard', farmId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/farms/${farmId}/finance/dashboard`);
        return response.data.data;
      } catch (error) {
        console.warn('Finance dashboard API failed, falling back to local computation:', error);
        
        // Compute dashboard values locally from IndexedDB cache
        const txns = await db.financialTransactions.where('farmId').equals(farmId).toArray();
        const budgets = await db.financialBudgets.where('farmId').equals(farmId).toArray();
        
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        const cashFlowHistoryMap: Record<string, number> = {};
        const categoryDistributionMap: Record<string, number> = {};

        txns.forEach((t) => {
          const dateStr = t.transactionDate.split('T')[0] || '';
          const amt = t.amount;
          if (t.transactionType === 'REVENUE') {
            totalRevenue += amt;
            cashFlowHistoryMap[dateStr] = (cashFlowHistoryMap[dateStr] || 0) + amt;
          } else if (t.transactionType === 'EXPENSE') {
            totalExpenses += amt;
            cashFlowHistoryMap[dateStr] = (cashFlowHistoryMap[dateStr] || 0) - amt;
            categoryDistributionMap[t.category] = (categoryDistributionMap[t.category] || 0) + amt;
          }
        });

        const cashFlowHistory = Object.entries(cashFlowHistoryMap).map(([date, value]) => ({
          date,
          value,
        }));

        const categoryDistribution = Object.entries(categoryDistributionMap).map(([name, value]) => ({
          name,
          value,
        }));

        return {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          cashBalance: totalRevenue - totalExpenses,
          cashFlowHistory,
          categoryDistribution,
          activeBudgets: budgets,
        };
      }
    },
    refetchInterval: 5000,
  });
}
