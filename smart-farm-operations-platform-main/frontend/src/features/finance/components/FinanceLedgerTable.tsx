import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FileSpreadsheet, Trash2 } from 'lucide-react';
import type { FinancialTransaction } from '@/types/domain';

interface TableProps {
  transactions: FinancialTransaction[];
  isLoading: boolean;
  onDeleteTransaction: (id: string) => void;
}

export default function FinanceLedgerTable({ transactions, isLoading, onDeleteTransaction }: TableProps) {
  const { t } = useTranslation('finance');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Filtering
  const filtered = transactions.filter((t) => {
    let match = true;
    if (typeFilter) match = match && t.transactionType === typeFilter;
    if (categoryFilter) match = match && t.category === categoryFilter;
    if (search) {
      const q = search.toLowerCase();
      match = match && (
        t.description?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.paymentMethod.toLowerCase().includes(q)
      );
    }
    return match;
  });

  // Unique categories
  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  // CSV Export utility
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)', 'Payment Method', 'Status'];
    const rows = filtered.map((t) => [
      t.transactionDate.substring(0, 10),
      t.transactionType,
      t.category,
      t.description || '',
      t.amount,
      t.paymentMethod,
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrios_finance_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'REVENUE':
        return 'text-emerald-600 bg-emerald-500/10';
      case 'EXPENSE':
        return 'text-red-600 bg-red-500/10';
      case 'LIABILITY':
        return 'text-amber-600 bg-amber-500/10';
      case 'ASSET':
        return 'text-blue-600 bg-blue-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-emerald-600 bg-emerald-500/10';
      case 'PENDING':
        return 'text-amber-600 bg-amber-500/10';
      case 'FAILED':
        return 'text-red-600 bg-red-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('buttons.searchPlaceholder') || 'Search transactions...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t('buttons.allTypes')}</option>
            <option value="EXPENSE">{t('form.typeExpense')}</option>
            <option value="REVENUE">{t('form.typeRevenue')}</option>
            <option value="LIABILITY">{t('form.typeLiability')}</option>
            <option value="ASSET">{t('form.typeAsset')}</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t('buttons.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ')}
              </option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            title={t('buttons.exportCsv') || 'Export CSV'}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> {t('buttons.exportCsv')}
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-12 text-center animate-pulse space-y-3">
            <div className="h-6 bg-muted w-1/3 mx-auto rounded" />
            <div className="h-10 bg-muted w-full rounded" />
            <div className="h-10 bg-muted w-full rounded" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase">
                  <th className="p-4 w-28">{t('ledger.date')}</th>
                  <th className="p-4 w-24">{t('ledger.type')}</th>
                  <th className="p-4">{t('ledger.category')}</th>
                  <th className="p-4">{t('ledger.description')}</th>
                  <th className="p-4 w-32">{t('ledger.amount')}</th>
                  <th className="p-4 w-32">{t('ledger.method')}</th>
                  <th className="p-4 w-24">{t('ledger.status')}</th>
                  <th className="p-4 w-16 text-center">{t('ledger.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-foreground">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                      {t('empty.noTransactions')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((txn) => (
                    <tr key={txn.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        {txn.transactionDate ? txn.transactionDate.substring(0, 10) : 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full uppercase ${getTypeBadge(txn.transactionType)}`}>
                          {txn.transactionType}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-xs tracking-tight">
                        {txn.category.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground truncate max-w-[200px]" title={txn.description}>
                        {txn.description || 'N/A'}
                      </td>
                      <td className="p-4 font-bold text-foreground">
                        ₹{txn.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground font-semibold">
                        {txn.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full uppercase ${getStatusBadge(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(t('buttons.confirmDelete') || 'Are you sure you want to delete this?')) {
                              onDeleteTransaction(txn.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-all"
                          title={t('buttons.confirmDelete') || 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
