import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { InventoryItem, Warehouse, InventoryCategory, StockTransaction } from '@/types/domain';

// ==========================================
// Inventory Items Hooks
// ==========================================

export function useInventoryItems(farmId: string, search?: string, categoryId?: string, warehouseId?: string, status?: string) {
  return useOfflineQuery<InventoryItem>({
    queryKey: ['inventoryItems', farmId, { search, categoryId, warehouseId, status }],
    endpoint: `/farms/${farmId}/inventory/items`,
    tableName: 'inventoryItems',
    params: { search, categoryId, warehouseId, status } as any,
    localFilter: (item) => {
      let match = item.farmId === farmId;
      if (status) match = match && item.status === status;
      if (categoryId) match = match && item.categoryId === categoryId;
      if (warehouseId) match = match && item.warehouseId === warehouseId;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          item.name.toLowerCase().includes(q) ||
          (item.sku?.toLowerCase().includes(q) ?? false) ||
          (item.barcode?.toLowerCase().includes(q) ?? false) ||
          (item.supplier?.toLowerCase().includes(q) ?? false)
        );
      }
      return match;
    },
    queryOptions: { refetchInterval: 5000 },
  });
}

export function useInventoryItem(farmId: string, id: string) {
  return useOfflineQueryById<InventoryItem>({
    queryKey: ['inventoryItems', farmId, id],
    endpoint: `/farms/${farmId}/inventory/items/${id}`,
    tableName: 'inventoryItems',
    entityId: id,
  });
}

export function useCreateInventoryItem(farmId: string) {
  return useOfflineMutation<InventoryItem, Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'inventoryItem',
    tableName: 'inventoryItems',
    operation: 'CREATE',
    invalidateKeys: [['inventoryItems', farmId]],
  });
}

export function useUpdateInventoryItem(farmId: string, id: string) {
  return useOfflineMutation<InventoryItem, Partial<InventoryItem> & { id: string; farmId: string }>({
    entityType: 'inventoryItem',
    tableName: 'inventoryItems',
    operation: 'UPDATE',
    invalidateKeys: [['inventoryItems', farmId], ['inventoryItems', farmId, id]],
  });
}

export function useDeleteInventoryItem(farmId: string) {
  return useOfflineMutation<InventoryItem, { id: string; farmId: string }>({
    entityType: 'inventoryItem',
    tableName: 'inventoryItems',
    operation: 'DELETE',
    invalidateKeys: [['inventoryItems', farmId]],
  });
}

// ==========================================
// Warehouses Hooks
// ==========================================

export function useWarehouses(farmId: string) {
  return useOfflineQuery<Warehouse>({
    queryKey: ['warehouses', farmId],
    endpoint: `/farms/${farmId}/inventory/warehouses`,
    tableName: 'warehouses',
    localFilter: (warehouse) => warehouse.farmId === farmId,
    queryOptions: { refetchInterval: 5000 },
  });
}

export function useCreateWarehouse(farmId: string) {
  return useOfflineMutation<Warehouse, Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'warehouse',
    tableName: 'warehouses',
    operation: 'CREATE',
    invalidateKeys: [['warehouses', farmId]],
  });
}

export function useUpdateWarehouse(farmId: string, _id: string) {
  return useOfflineMutation<Warehouse, Partial<Warehouse> & { id: string; farmId: string }>({
    entityType: 'warehouse',
    tableName: 'warehouses',
    operation: 'UPDATE',
    invalidateKeys: [['warehouses', farmId]],
  });
}

export function useDeleteWarehouse(farmId: string) {
  return useOfflineMutation<Warehouse, { id: string; farmId: string }>({
    entityType: 'warehouse',
    tableName: 'warehouses',
    operation: 'DELETE',
    invalidateKeys: [['warehouses', farmId]],
  });
}

// ==========================================
// Categories Hooks
// ==========================================

export function useInventoryCategories(farmId: string) {
  return useOfflineQuery<InventoryCategory>({
    queryKey: ['inventoryCategories', farmId],
    endpoint: `/farms/${farmId}/inventory/categories`,
    tableName: 'inventoryCategories',
    localFilter: (category) => category.farmId === farmId,
    queryOptions: { refetchInterval: 5000 },
  });
}

export function useCreateInventoryCategory(farmId: string) {
  return useOfflineMutation<InventoryCategory, Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'inventoryCategory',
    tableName: 'inventoryCategories',
    operation: 'CREATE',
    invalidateKeys: [['inventoryCategories', farmId]],
  });
}

export function useUpdateInventoryCategory(farmId: string, _id: string) {
  return useOfflineMutation<InventoryCategory, Partial<InventoryCategory> & { id: string; farmId: string }>({
    entityType: 'inventoryCategory',
    tableName: 'inventoryCategories',
    operation: 'UPDATE',
    invalidateKeys: [['inventoryCategories', farmId]],
  });
}

export function useDeleteInventoryCategory(farmId: string) {
  return useOfflineMutation<InventoryCategory, { id: string; farmId: string }>({
    entityType: 'inventoryCategory',
    tableName: 'inventoryCategories',
    operation: 'DELETE',
    invalidateKeys: [['inventoryCategories', farmId]],
  });
}

// ==========================================
// Stock Transactions Hooks
// ==========================================

export function useStockTransactions(farmId: string, itemId: string) {
  return useOfflineQuery<StockTransaction>({
    queryKey: ['stockTransactions', farmId, itemId],
    endpoint: `/farms/${farmId}/inventory/items/${itemId}/transactions`,
    tableName: 'stockTransactions',
    localFilter: (txn) => txn.inventoryItemId === itemId,
    queryOptions: { refetchInterval: 5000 },
  });
}

export function useCreateStockTransaction(farmId: string, itemId: string) {
  return useOfflineMutation<StockTransaction, Omit<StockTransaction, 'id' | 'createdAt'> & { farmId: string }>({
    entityType: 'stockTransaction',
    tableName: 'stockTransactions',
    operation: 'CREATE',
    invalidateKeys: [
      ['stockTransactions', farmId, itemId],
      ['inventoryItems', farmId],
      ['inventoryItems', farmId, itemId]
    ],
  });
}
