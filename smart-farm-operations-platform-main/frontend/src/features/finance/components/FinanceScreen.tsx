import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Wallet, BookOpen, Target, Plus, RefreshCw, Settings } from 'lucide-react';
import { useFarms } from '@/features/farms/api/farmsApi';
import {
  useFinancialTransactions,
  useCreateFinancialTransaction,
  useDeleteFinancialTransaction,
  useJournalEntries,
  useFinancialBudgets,
  useFinanceDashboard,
} from '../api/financeApi';
import FinanceDashboard from './FinanceDashboard';
import FinanceLedgerTable from './FinanceLedgerTable';
import FinanceJournalLedger from './FinanceJournalLedger';
import FinanceBudgetTracker from './FinanceBudgetTracker';
import FinanceForm from './FinanceForm';
import { db } from '@/offline/db';

export default function FinanceScreen() {
  const { t } = useTranslation('finance');

  // 1. Resolve active farm context
  const { data: farms = [], isLoading: loadingFarms } = useFarms();
  const activeFarm = farms[0];
  const farmId = activeFarm?.id || '';

  // 2. Tab Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounting'>('dashboard');
  const [activeAccountingSubTab, setActiveAccountingSubTab] = useState<'journal' | 'budgets'>('journal');
  const [isRecording, setIsRecording] = useState(false);

  // 3. Online & Dexie Caching Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll Dexie syncQueue count to update sync UI in real time
    const interval = setInterval(async () => {
      try {
        const count = await db.syncQueue.count();
        setPendingChanges(count);
        setLastRefreshed(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Dexie count error:', err);
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // 4. API Queries
  const { data: dashboardData, isLoading: loadingDashboard } = useFinanceDashboard(farmId);
  const { data: transactions = [], isLoading: loadingTransactions } = useFinancialTransactions(farmId);
  const { data: journalEntries = [], isLoading: loadingJournal } = useJournalEntries(farmId);
  const { data: budgets = [], isLoading: loadingBudgets } = useFinancialBudgets(farmId);

  // 5. API Mutations
  const createTransactionMutation = useCreateFinancialTransaction(farmId);
  const deleteTransactionMutation = useDeleteFinancialTransaction(farmId);

  const handleRecordTransactionSubmit = async (values: any) => {
    try {
      await createTransactionMutation.mutateAsync({
        ...values,
        farmId,
      });
      setIsRecording(false);
    } catch (err) {
      console.error(err);
    }
  };

  const isSyncing = createTransactionMutation.isPending || deleteTransactionMutation.isPending;

  if (loadingFarms) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!farmId) {
    return (
      <div className="bg-card p-8 rounded-xl border border-border text-center text-xs text-muted-foreground">
        {t('empty.noBudgets')}
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="space-y-6 max-w-[1200px] mx-auto p-4 md:p-6">
        <FinanceForm
          onSubmit={handleRecordTransactionSubmit}
          onCancel={() => setIsRecording(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sf-stagger max-w-[1200px] mx-auto p-4 md:p-6 animate-fade-in">
      {/* Title & Tabs row (exactly like Inventory Management page) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.subtitle')}</p>
        </div>

        {/* Navigation Tabs (rounded pill style like Inventory page) */}
        <div className="flex bg-muted p-1 rounded-xl text-xs font-semibold gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'transactions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wallet className="w-4 h-4" /> {t('nav.transactions')}
          </button>
          <button
            onClick={() => setActiveTab('accounting')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'accounting' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4" /> {t('nav.accounting')}
          </button>
        </div>
      </div>

      {/* Online Status & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-muted/30 border border-border rounded-xl gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
          <span className="font-semibold text-foreground">
            {isOnline ? t('status.online') : t('status.offline')}
          </span>
          <span className="text-muted-foreground/60">|</span>
          <span className="text-muted-foreground">
            {pendingChanges} {t('status.syncing')}
          </span>
          <span className="text-muted-foreground/60">|</span>
          <span className="text-muted-foreground">{t('status.lastSync')}: {lastRefreshed}</span>
        </div>

        {isSyncing && (
          <span className="flex items-center gap-1.5 text-primary font-semibold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" /> {t('status.syncing')}
          </span>
        )}

        <button
          onClick={() => setIsRecording(true)}
          className="h-8.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-all shrink-0 uppercase"
        >
          <Plus className="w-4 h-4" /> {t('buttons.recordMovement')}
        </button>
      </div>

      {/* Render Active View Tab */}
      {activeTab === 'dashboard' && dashboardData && (
        <FinanceDashboard
          dashboardData={dashboardData}
          isLoading={loadingDashboard}
          onNavigateToTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {activeTab === 'transactions' && (
        <FinanceLedgerTable
          transactions={transactions}
          isLoading={loadingTransactions}
          onDeleteTransaction={(id) => deleteTransactionMutation.mutate({ id, farmId })}
        />
      )}

      {activeTab === 'accounting' && (
        <div className="space-y-6">
          {/* Secondary Navigation */}
          <div className="flex border-b border-border gap-2">
            <button
              onClick={() => setActiveAccountingSubTab('journal')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase border-b-2 transition-all ${
                activeAccountingSubTab === 'journal'
                  ? 'border-primary text-primary font-black bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> {t('nav.journal')}
            </button>
            <button
              onClick={() => setActiveAccountingSubTab('budgets')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase border-b-2 transition-all ${
                activeAccountingSubTab === 'budgets'
                  ? 'border-primary text-primary font-black bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="w-3.5 h-3.5" /> {t('nav.budgets')}
            </button>
          </div>

          {activeAccountingSubTab === 'journal' ? (
            <FinanceJournalLedger
              journalEntries={journalEntries}
              isLoading={loadingJournal}
            />
          ) : (
            <FinanceBudgetTracker
              budgets={budgets}
              isLoading={loadingBudgets}
              farmId={farmId}
            />
          )}
        </div>
      )}
    </div>
  );
}
