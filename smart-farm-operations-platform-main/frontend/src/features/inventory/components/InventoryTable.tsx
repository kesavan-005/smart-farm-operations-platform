import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Eye, FileSpreadsheet, Plus, Search, Trash2, SlidersHorizontal, AlertCircle, Package } from 'lucide-react';
import type { InventoryItem, Warehouse, InventoryCategory } from '@/types/domain';

interface TableProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  categories: InventoryCategory[];
  onSelectItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAddTransaction: (item: InventoryItem) => void;
  onAddNew: () => void;
}

export default function InventoryTable({
  items,
  warehouses,
  categories,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onAddTransaction,
  onAddNew,
}: TableProps) {
  const { t, i18n } = useTranslation('inventory');
  const isTa = i18n.language === 'ta';

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering logic
  const filteredItems = items.filter((item) => {
    let match = true;
    const catId = item.categoryId || item.category?.id;
    const whId = item.warehouseId || item.warehouse?.id;
    if (categoryFilter) match = match && catId === categoryFilter;
    if (warehouseFilter) match = match && whId === warehouseFilter;
    if (statusFilter) match = match && item.status === statusFilter;
    if (search) {
      const q = search.toLowerCase();
      match = match && (
        item.name.toLowerCase().includes(q) ||
        (item.nameTa?.toLowerCase().includes(q) ?? false) ||
        (item.sku?.toLowerCase().includes(q) ?? false) ||
        (item.supplier?.toLowerCase().includes(q) ?? false)
      );
    }
    return match;
  });

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected items?`)) {
      selectedIds.forEach((id) => onDeleteItem(id));
      setSelectedIds([]);
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Quantity', 'Unit', 'Warehouse', 'Min Stock', 'Cost', 'Supplier', 'Status'];
    const rows = filteredItems.map((item) => {
      const matchedCat = categories.find((c) => c.id === (item.categoryId || item.category?.id));
      const matchedWh = warehouses.find((w) => w.id === (item.warehouseId || item.warehouse?.id));
      return [
        item.name,
        item.sku || '',
        matchedCat ? matchedCat.name : (item.category?.name || 'Unassigned'),
        item.currentQuantity,
        item.unit,
        matchedWh ? matchedWh.name : (item.warehouse?.name || 'Unassigned'),
        item.minimumStock,
        item.cost,
        item.supplier || '',
        item.status,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrios_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items, SKUs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {isTa && c.nameTa ? c.nameTa : c.name}
              </option>
            ))}
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {isTa && w.nameTa ? w.nameTa : w.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={exportToCSV}
            title="Export CSV"
            className="p-2 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-2 px-3.5 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" /> {t('add_item')}
          </button>
        </div>
      </div>

      {/* Bulk actions banner */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 px-4 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
          <span className="text-xs font-semibold text-primary">{selectedIds.length} items selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 py-1.5 px-3 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" /> Bulk Delete
          </button>
        </div>
      )}

      {/* Advanced Data Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                </th>
                <th className="p-4">Item Details</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Location / Wh</th>
                <th className="p-4">Cost</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.currentQuantity <= item.minimumStock;
                  const isOut = item.currentQuantity <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelectRow(item.id)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground/60" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">
                              {isTa && item.nameTa ? item.nameTa : item.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                              {item.supplier || 'No supplier'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs">{item.sku || 'N/A'}</td>
                      <td className="p-4">
                        {(() => {
                          const matchedCat = categories.find((c) => c.id === (item.categoryId || item.category?.id));
                          const color = matchedCat?.color || item.category?.color || '#CBD5E1';
                          const name = matchedCat ? (isTa && matchedCat.nameTa ? matchedCat.nameTa : matchedCat.name) : (item.category?.name);
                          return name ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs font-medium">{name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="font-bold">
                            {item.currentQuantity} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                          </span>
                          {/* Alert Badges */}
                          {isOut ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-500/10 py-0.5 px-2 rounded-full w-max">
                              <AlertCircle className="w-3 h-3" /> Out of stock
                            </span>
                          ) : isLow ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 py-0.5 px-2 rounded-full w-max">
                              <AlertCircle className="w-3 h-3" /> Low stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 py-0.5 px-2 rounded-full w-max block">
                              Normal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground block text-xs">
                          {(() => {
                            const matchedWh = warehouses.find((w) => w.id === (item.warehouseId || item.warehouse?.id));
                            return matchedWh ? (isTa && matchedWh.nameTa ? matchedWh.nameTa : matchedWh.name) : (item.warehouse ? (isTa && item.warehouse.nameTa ? item.warehouse.nameTa : item.warehouse.name) : 'Shed/Yard');
                          })()}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">{item.storageLocation || 'N/A'}</span>
                      </td>
                      <td className="p-4 font-semibold">₹{item.cost || 0}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onSelectItem(item)}
                            title="View Details"
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditItem(item)}
                            title="Edit"
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onAddTransaction(item)}
                            title="Stock Movement"
                            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg border border-red-500/20 bg-background hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
