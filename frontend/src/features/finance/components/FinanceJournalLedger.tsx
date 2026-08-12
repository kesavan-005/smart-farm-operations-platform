import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import type { JournalEntry } from '@/types/domain';

interface LedgerProps {
  journalEntries: JournalEntry[];
  isLoading: boolean;
}

export default function FinanceJournalLedger({ journalEntries, isLoading }: LedgerProps) {
  const { t } = useTranslation('finance');

  if (isLoading) {
    return (
      <div className="p-12 text-center animate-pulse space-y-4 bg-card rounded-xl border border-border">
        <div className="h-6 bg-muted w-1/4 rounded mx-auto" />
        <div className="h-16 bg-muted w-full rounded" />
        <div className="h-16 bg-muted w-full rounded" />
      </div>
    );
  }

  // Group journal entries by financialTransactionId
  const groups: Record<string, JournalEntry[]> = {};
  journalEntries.forEach((entry) => {
    if (!groups[entry.financialTransactionId]) {
      groups[entry.financialTransactionId] = [];
    }
    groups[entry.financialTransactionId]?.push(entry);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">{t('accounting.title')}</h4>
          <p className="text-[10px] text-muted-foreground">{t('accounting.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 py-1 px-3 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t('badges.stable')}
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(groups).length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
            {t('accounting.noEntries')}
          </div>
        ) : (
          Object.entries(groups).map(([txnId, items]) => {
            const dateStr = items[0]?.createdAt 
              ? new Date(items[0].createdAt).toLocaleString() 
              : 'N/A';

            return (
              <div key={txnId} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-all sf-stagger-item">
                {/* Block Header */}
                <div className="bg-muted/40 p-3 px-4 border-b border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-muted-foreground">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{t('form.transactionType')} ID: <span className="font-mono text-[10px] text-foreground">{txnId}</span></span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{dateStr}</span>
                </div>

                {/* Ledger Items */}
                <div className="divide-y divide-border">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 p-3 px-4 text-[10px] font-bold text-muted-foreground uppercase bg-muted/10">
                    <div className="col-span-5">{t('accounting.account')}</div>
                    <div className="col-span-3 text-right">{t('accounting.debit')} (INR)</div>
                    <div className="col-span-3 text-right">{t('accounting.credit')} (INR)</div>
                    <div className="col-span-1" />
                  </div>

                  {/* Journal entries */}
                  {items.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-12 p-3.5 px-4 text-xs font-semibold items-center">
                      {/* Account details */}
                      <div className="col-span-5 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${entry.entryType === 'DEBIT' ? 'bg-primary' : 'bg-secondary'}`} />
                        <span className="font-bold tracking-tight text-foreground">{entry.accountName}</span>
                        <span className="text-[10px] font-normal text-muted-foreground truncate hidden md:inline-block max-w-[150px]">
                          ({entry.notes})
                        </span>
                      </div>

                      {/* Debit amount */}
                      <div className="col-span-3 text-right text-foreground font-bold">
                        {entry.entryType === 'DEBIT' ? `₹${entry.amount.toLocaleString()}` : '—'}
                      </div>

                      {/* Credit amount */}
                      <div className="col-span-3 text-right text-foreground font-bold">
                        {entry.entryType === 'CREDIT' ? `₹${entry.amount.toLocaleString()}` : '—'}
                      </div>

                      {/* Type code */}
                      <div className="col-span-1 text-right">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${entry.entryType === 'DEBIT' ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10'}`}>
                          {entry.entryType === 'DEBIT' ? 'DR' : 'CR'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
