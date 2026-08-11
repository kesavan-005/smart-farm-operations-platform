import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Calendar, DollarSign, History, Layers, ArrowLeft, User, Warehouse } from 'lucide-react';
import { useStockTransactions } from '../api/inventoryApi';
import type { InventoryItem } from '@/types/domain';

interface DetailsProps {
  item: InventoryItem;
  farmId: string;
  onBack: () => void;
}

export default function InventoryDetails({ item, farmId, onBack }: DetailsProps) {
  const { i18n } = useTranslation('inventory');
  const isTa = i18n.language === 'ta';

  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'integration'>('info');

  // Fetch immutable transactions history
  const { data: transactions = [], isLoading } = useStockTransactions(farmId, item.id);

  // Status checks
  const isLow = item.currentQuantity <= item.minimumStock;
  const isOut = item.currentQuantity <= 0;

  // Percentage calculations
  const maxLimit = item.maximumStock || (item.minimumStock * 5);
  const occupancyPercentage = Math.min(100, (item.currentQuantity / maxLimit) * 100);

  return (
    <div className="space-y-6 sf-stagger">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {isTa && item.nameTa ? item.nameTa : item.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku || 'N/A'} • Status: {item.status}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border">
        {(['info', 'history', 'integration'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'info' && 'Basic Info & Stock'}
            {tab === 'history' && 'Stock History'}
            {tab === 'integration' && 'ERP Integration'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Level Card */}
            <div className="sf-card p-6 border border-border bg-background space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Stock Levels
              </h3>

              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs text-muted-foreground">Current Quantity</span>
                  <h4 className="text-3xl font-extrabold text-foreground mt-1">
                    {item.currentQuantity} <span className="text-base font-normal text-muted-foreground">{item.unit}</span>
                  </h4>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Minimum Stock Threshold</span>
                  <span className="text-sm font-bold text-foreground">{item.minimumStock} {item.unit}</span>
                </div>
              </div>

              {/* Progress gauge */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 {item.unit}</span>
                  <span>Max limit: {maxLimit} {item.unit}</span>
                </div>
              </div>

              {/* Notification Badge */}
              {isOut ? (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <strong>Critical Alert:</strong> Out of stock. Farm activities utilizing this item may fail or pause.
                </div>
              ) : isLow ? (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <strong>Warning:</strong> Stock level is below minimum threshold. Please order from supplier soon.
                </div>
              ) : null}
            </div>

            {/* General Info */}
            <div className="sf-card p-6 border border-border bg-background grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">SKU</span>
                <span className="font-semibold text-foreground">{item.sku || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Barcode</span>
                <span className="font-semibold text-foreground">{item.barcode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Subcategory</span>
                <span className="font-semibold text-foreground">{item.subcategory || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Storage Location</span>
                <span className="font-semibold text-foreground">{item.storageLocation || 'N/A'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs text-muted-foreground block">Description</span>
                <p className="text-sm text-foreground mt-1">{item.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Warehouse/Location info */}
            <div className="sf-card p-6 border border-border bg-background space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" /> Storage Location
              </h3>
              <div>
                <span className="text-xs text-muted-foreground block">Warehouse</span>
                <span className="font-bold text-foreground text-sm">
                  {item.warehouse ? (isTa && item.warehouse.nameTa ? item.warehouse.nameTa : item.warehouse.name) : 'Shed/Yard'}
                </span>
              </div>
              {item.warehouse?.manager && (
                <div>
                  <span className="text-xs text-muted-foreground block">Warehouse Manager</span>
                  <span className="text-xs font-semibold text-foreground">{item.warehouse.manager}</span>
                </div>
              )}
            </div>

            {/* Supplier / Cost info */}
            <div className="sf-card p-6 border border-border bg-background space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Costing & Supplier
              </h3>
              <div>
                <span className="text-xs text-muted-foreground block">Cost per Unit</span>
                <span className="font-bold text-foreground">₹{item.cost || 0}</span>
              </div>
              {item.sellingPrice && (
                <div>
                  <span className="text-xs text-muted-foreground block">Estimated Selling Price</span>
                  <span className="font-bold text-foreground">₹{item.sellingPrice}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block">Supplier</span>
                <span className="text-xs font-semibold text-foreground">{item.supplier || 'N/A'}</span>
              </div>
              {item.batchNumber && (
                <div>
                  <span className="text-xs text-muted-foreground block">Batch Number</span>
                  <span className="text-xs font-mono">{item.batchNumber}</span>
                </div>
              )}
              {item.expiryDate && (
                <div>
                  <span className="text-xs text-muted-foreground block">Expiry Date</span>
                  <span className="text-xs flex items-center gap-1.5 text-red-600 bg-red-500/10 py-0.5 px-2 rounded-full w-max">
                    <Calendar className="w-3.5 h-3.5" /> {item.expiryDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="sf-card p-6 border border-border bg-card">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Stock Movement History (Audit Logs)
          </h3>

          {isLoading ? (
            <div className="text-center p-8 text-xs text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center p-8 text-xs text-muted-foreground">No stock transactions registered yet.</div>
          ) : (
            <div className="space-y-4">
              {transactions.map((txn) => {
                const isAdd = ['PURCHASE', 'RETURN', 'HARVEST_STORAGE'].includes(txn.transactionType);
                return (
                  <div key={txn.id} className="flex items-start gap-4 p-4 border border-border bg-background rounded-xl">
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isAdd ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {isAdd ? '+' : '-'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                          {txn.transactionType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground mt-1">
                        {isAdd ? 'Received' : 'Consumed'} {txn.quantity} {txn.unit}
                      </p>
                      {txn.reference && (
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Ref: {txn.reference}
                        </span>
                      )}
                      {txn.notes && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{txn.notes}</p>}
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                        <User className="w-3 h-3" /> Logged by {txn.userName || 'System'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Integration Tab */}
      {activeTab === 'integration' && (
        <div className="sf-card p-6 border border-border bg-card space-y-6">
          <div>
            <h3 className="text-sm font-bold text-foreground">AgriOS ERP Modules Integration Matrix</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The Inventory module communicates automatically with other subsystems. Below are simulated integrations logs:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-background space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                🚜 Field & Labour Operations
              </h4>
              <p className="text-xs text-muted-foreground">
                Whenever fertilizer is sprayed on **Field 2A** via an activity timeline card, the corresponding fertilizer inventory quantity decreases, and the labour hours are automatically calculated.
              </p>
              <div className="p-2 bg-muted/30 rounded border border-border text-[10px] font-mono text-muted-foreground">
                {"[INTEGRATION LOGGER] Field Spraying Activator -> Item NPK_Fertilizer decreased by 15.00kg."}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                💳 Finance & Expense Ledger
              </h4>
              <p className="text-xs text-muted-foreground">
                Stock purchases log dynamic expense records instantly to the general ledger, updating overall profitability curves without duplicate worker data entries.
              </p>
              <div className="p-2 bg-muted/30 rounded border border-border text-[10px] font-mono text-muted-foreground">
                {"[INTEGRATION LOGGER] Purchase Log -> Expense Voucher generated (₹14,500 - Organic Nitrogen)."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
