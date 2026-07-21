// Offline Database — Dexie.js schema definition
// Tables mirror server entities that need offline support
// This is the local-first data store that every feature reads from and writes to

import Dexie, { type EntityTable } from 'dexie';
import type { SyncQueueEntry } from '@/types/api';
import type { Farm, Field, Crop, InventoryItem, Expense, Income, Harvest, Warehouse, InventoryCategory, StockTransaction, FinancialTransaction, JournalEntry, FinancialBudget } from '@/types/domain';
import type { FarmActivity } from '@/types/activity';
import type { FarmTask } from '@/types/task';
import type { Equipment, WorkOrder, LaborRecord, FarmSchedule } from '@/types/operations';

export class SmartFarmDB extends Dexie {
  // Entity tables (local cache of server data)
  farms!: EntityTable<Farm & { _synced?: boolean }, 'id'>;
  fields!: EntityTable<Field & { _synced?: boolean }, 'id'>;
  crops!: EntityTable<Crop & { _synced?: boolean }, 'id'>;
  activities!: EntityTable<FarmActivity & { _synced?: boolean }, 'id'>;
  tasks!: EntityTable<FarmTask & { _synced?: boolean }, 'id'>;
  inventoryItems!: EntityTable<InventoryItem & { _synced?: boolean }, 'id'>;
  warehouses!: EntityTable<Warehouse & { _synced?: boolean }, 'id'>;
  inventoryCategories!: EntityTable<InventoryCategory & { _synced?: boolean }, 'id'>;
  stockTransactions!: EntityTable<StockTransaction & { _synced?: boolean }, 'id'>;
  financialTransactions!: EntityTable<FinancialTransaction & { _synced?: boolean }, 'id'>;
  journalEntries!: EntityTable<JournalEntry, 'id'>;
  financialBudgets!: EntityTable<FinancialBudget & { _synced?: boolean }, 'id'>;
  expenses!: EntityTable<Expense & { _synced?: boolean }, 'id'>;
  income!: EntityTable<Income & { _synced?: boolean }, 'id'>;
  harvests!: EntityTable<Harvest & { _synced?: boolean }, 'id'>;
  workOrders!: EntityTable<WorkOrder & { _synced?: boolean }, 'id'>;
  equipment!: EntityTable<Equipment & { _synced?: boolean }, 'id'>;
  laborRecords!: EntityTable<LaborRecord & { _synced?: boolean }, 'id'>;
  schedules!: EntityTable<FarmSchedule & { _synced?: boolean }, 'id'>;

  // Sync queue
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>;

  constructor() {
    super('SmartFarmDB');

    this.version(1).stores({
      // Entity tables — indexed by id + common query fields
      farms: 'id, ownerUserId, status, updatedAt',
      fields: 'id, farmId, status, updatedAt',
      crops: 'id, fieldId, status, updatedAt',
      activities: 'id, farmId, fieldId, cropId, activityType, status, priority, scheduledDate, updatedAt',
      tasks: 'id, farmId, fieldId, activityId, status, priority, assignedTo, dueDate, updatedAt',
      inventoryItems: 'id, farmId, categoryId, warehouseId, status, updatedAt',
      warehouses: 'id, farmId, name, updatedAt',
      inventoryCategories: 'id, farmId, parentCategoryId, updatedAt',
      stockTransactions: 'id, inventoryItemId, transactionType, createdAt',
      expenses: 'id, farmId, date, category, updatedAt',
      income: 'id, farmId, date, updatedAt',
      harvests: 'id, cropId, date, updatedAt',
      financialTransactions: 'id, farmId, transactionType, category, transactionDate, updatedAt',
      journalEntries: 'id, financialTransactionId, createdAt',
      financialBudgets: 'id, farmId, category, endDate, updatedAt',
      workOrders: 'id, farmId, status, startDate, completionDate, updatedAt',
      equipment: 'id, farmId, type, status, updatedAt',
      laborRecords: 'id, farmId, workerId, recordDate, status, updatedAt',
      schedules: 'id, farmId, type, startTime, endTime, updatedAt',

      // Sync queue — auto-increment id, indexed for ordered processing
      syncQueue: '++id, entityType, status, createdAt',
    });
  }
}

// Singleton instance
export const db = new SmartFarmDB();
