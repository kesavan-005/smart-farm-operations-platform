import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, Warehouse as WhIcon, Tags, Plus, Trash } from 'lucide-react';
import { useFarms } from '@/features/farms/api/farmsApi';
import {
  useInventoryItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useWarehouses,
  useCreateWarehouse,
  useDeleteWarehouse,
  useInventoryCategories,
  useCreateInventoryCategory,
  useDeleteInventoryCategory,
  useCreateStockTransaction,
} from '../api/inventoryApi';
import InventoryDashboard from './InventoryDashboard';
import InventoryTable from './InventoryTable';
import InventoryDetails from './InventoryDetails';
import InventoryForm from './InventoryForm';
import type { InventoryItem } from '@/types/domain';

export default function InventoryScreen() {
  const { t, i18n } = useTranslation('inventory');
  const isTa = i18n.language === 'ta';

  // 1. Get farm ID context (default to first active farm)
  const { data: farms = [], isLoading: loadingFarms } = useFarms();
  const activeFarm = farms[0];
  const farmId = activeFarm?.id;

  // 2. Fetch inventory datasets
  const { data: items = [], isLoading: loadingItems } = useInventoryItems(farmId || '');
  const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses(farmId || '');
  const { data: categories = [], isLoading: loadingCategories } = useInventoryCategories(farmId || '');

  // Mutations
  const createItemMutation = useCreateInventoryItem(farmId || '');
  const updateItemMutation = useUpdateInventoryItem(farmId || '', '');
  const deleteItemMutation = useDeleteInventoryItem(farmId || '');
  const createWarehouseMutation = useCreateWarehouse(farmId || '');
  const deleteWarehouseMutation = useDeleteWarehouse(farmId || '');
  const createCategoryMutation = useCreateInventoryCategory(farmId || '');
  const deleteCategoryMutation = useDeleteInventoryCategory(farmId || '');
  const createTransactionMutation = useCreateStockTransaction(farmId || '', '');

  // 3. UI Navigation & Action States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'warehouses' | 'categories'>('dashboard');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Modals / forms state for Warehouses and Categories
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseCapacity, setNewWarehouseCapacity] = useState('10000');
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#10B981');

  // Stock transaction state
  const [transactionItem, setTransactionItem] = useState<InventoryItem | null>(null);
  const [txnType, setTxnType] = useState<'PURCHASE' | 'USAGE' | 'ADJUSTMENT'>('USAGE');
  const [txnQuantity, setTxnQuantity] = useState('10');
  const [txnNotes, setTxnNotes] = useState('');

  // 4. Action Handlers
  const handleCreateItemSubmit = async (values: any) => {
    try {
      await createItemMutation.mutateAsync({
        ...values,
        farmId: farmId || '',
      });
      setIsCreatingItem(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditItemSubmit = async (values: any) => {
    if (!editingItem) return;
    try {
      await updateItemMutation.mutateAsync({
        ...values,
        id: editingItem.id,
        farmId: farmId || '',
      });
      setEditingItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteItemMutation.mutateAsync({ id, farmId: farmId || '' });
        if (selectedItem?.id === id) setSelectedItem(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;
    try {
      await createWarehouseMutation.mutateAsync({
        farmId: farmId || '',
        name: newWarehouseName,
        capacity: Number(newWarehouseCapacity),
      });
      setNewWarehouseName('');
      setIsCreatingWarehouse(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (confirm('Delete this warehouse storage unit?')) {
      try {
        await deleteWarehouseMutation.mutateAsync({ id, farmId: farmId || '' });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategoryMutation.mutateAsync({
        farmId: farmId || '',
        name: newCategoryName,
        color: newCategoryColor,
      });
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this inventory category?')) {
      try {
        await deleteCategoryMutation.mutateAsync({ id, farmId: farmId || '' });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionItem) return;
    try {
      await createTransactionMutation.mutateAsync({
        inventoryItemId: transactionItem.id,
        transactionType: txnType,
        quantity: Number(txnQuantity),
        unit: transactionItem.unit,
        notes: txnNotes,
        farmId: farmId || '',
      });
      setTxnNotes('');
      setTransactionItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Loading states
  if (loadingFarms || loadingItems || loadingWarehouses || loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!farmId) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl max-w-lg mx-auto p-6 space-y-4">
        <Package className="w-12 h-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-bold text-foreground">No Farms Registered</h3>
        <p className="text-sm text-muted-foreground">
          You must create at least one farm before configuring and accessing inventory resources.
        </p>
      </div>
    );
  }

  // 6. View Routing
  if (selectedItem) {
    return (
      <InventoryDetails
        item={selectedItem}
        farmId={farmId}
        onBack={() => setSelectedItem(null)}
      />
    );
  }

  if (isCreatingItem) {
    return (
      <InventoryForm
        warehouses={warehouses}
        categories={categories}
        onSubmit={handleCreateItemSubmit}
        onCancel={() => setIsCreatingItem(false)}
      />
    );
  }

  if (editingItem) {
    return (
      <InventoryForm
        initialValues={editingItem}
        warehouses={warehouses}
        categories={categories}
        onSubmit={handleEditItemSubmit}
        onCancel={() => setEditingItem(null)}
      />
    );
  }

  return (
    <div className="space-y-6 sf-stagger">
      {/* Title & Tabs row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage warehouses, category allocations, and stock movements.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-muted p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'warehouses' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <WhIcon className="w-4 h-4" /> {t('warehouses')}
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'items' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-4 h-4" /> {t('items')}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'categories' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tags className="w-4 h-4" /> {t('categories')}
          </button>
        </div>
      </div>

      {/* Render Active View Tab */}
      {activeTab === 'dashboard' && (
        <InventoryDashboard
          items={items}
          warehouses={warehouses}
          categories={categories}
          onNavigateToTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {activeTab === 'items' && (
        <InventoryTable
          items={items}
          warehouses={warehouses}
          categories={categories}
          onSelectItem={setSelectedItem}
          onEditItem={setEditingItem}
          onDeleteItem={handleDeleteItem}
          onAddTransaction={setTransactionItem}
          onAddNew={() => setIsCreatingItem(true)}
        />
      )}

      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground">Storage Warehouses</h3>
            <button
              onClick={() => setIsCreatingWarehouse(true)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-2 px-3.5 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Warehouse
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warehouses.map((wh) => (
              <div key={wh.id} className="sf-card p-5 bg-background border border-border flex flex-col justify-between h-40">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-foreground">{isTa && wh.nameTa ? wh.nameTa : wh.name}</h4>
                    <button
                      onClick={() => handleDeleteWarehouse(wh.id)}
                      className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Location: {wh.location || 'Yard'}</p>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Capacity:</span>
                  <span className="text-foreground">{wh.capacity.toLocaleString()} Liters / kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground">Inventory Categories</h3>
            <button
              onClick={() => setIsCreatingCategory(true)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-primary-foreground py-2 px-3.5 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="sf-card p-4 bg-background border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#10B981' }} />
                  <span className="font-bold text-sm text-foreground">{isTa && cat.nameTa ? cat.nameTa : cat.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      {isCreatingWarehouse && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl sf-animate-in">
            <h3 className="text-lg font-bold text-foreground">Create Warehouse Storage</h3>
            <form onSubmit={handleAddWarehouseSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Max Capacity (Liters/kg)</label>
                <input
                  type="number"
                  required
                  value={newWarehouseCapacity}
                  onChange={(e) => setNewWarehouseCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingWarehouse(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold uppercase hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase hover:bg-primary-hover"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl sf-animate-in">
            <h3 className="text-lg font-bold text-foreground">Create Category</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Label Color</label>
                <input
                  type="color"
                  required
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-10 p-0 rounded-lg border border-border bg-background text-foreground overflow-hidden cursor-pointer"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold uppercase hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase hover:bg-primary-hover"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Transaction Modal */}
      {transactionItem && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl sf-animate-in">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
              Stock movement: <span className="text-primary">{transactionItem.name}</span>
            </h3>
            <form onSubmit={handleLogTransaction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Movement Type</label>
                <select
                  value={txnType}
                  onChange={(e: any) => setTxnType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="USAGE">Consumption / Usage (Reduce)</option>
                  <option value="PURCHASE">Purchase Order (Increase)</option>
                  <option value="ADJUSTMENT">Stock Adjustment (Overwrite)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Quantity ({transactionItem.unit})</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={txnQuantity}
                  onChange={(e) => setTxnQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Notes / Audit trail reasons</label>
                <textarea
                  rows={2}
                  value={txnNotes}
                  onChange={(e) => setTxnNotes(e.target.value)}
                  placeholder="e.g. usage on North field plowing activity"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTransactionItem(null)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold uppercase hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase hover:bg-primary-hover"
                >
                  Log Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
