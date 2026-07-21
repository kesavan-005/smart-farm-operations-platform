// Domain entity types — stubs populated as features are built

import type { BaseEntity } from './api';

// ==========================================
// Farm
// ==========================================

export interface Farm extends BaseEntity {
  farmCode: string;
  name: string;
  nameTa?: string;
  description?: string;
  descriptionTa?: string;
  latitude?: number;
  longitude?: number;
  boundary?: GeoJSON.Polygon;
  totalArea?: number;
  areaUnit?: string;
  address?: string;
  village?: string;
  taluk?: string;
  district?: string;
  state: string;
  pincode?: string;
  ownerUserId: string;
  soilType?: string;
  soilPh?: number;
  soilOrganicCarbon?: number;
  irrigationType?: string;
  waterSource?: string;
  waterAvailability?: string;
  drainageType?: string;
  averageRainfall?: number;
  status: 'active' | 'inactive' | 'archived';
}

// ==========================================
// Field
// ==========================================

export interface Field extends BaseEntity {
  farmId: string;
  fieldCode: string;
  name: string;
  nameTa?: string;
  area?: number;
  areaUnit?: string;
  soilType?: string;
  soilPh?: number;
  soilOrganicCarbon?: number;
  irrigationType?: string;
  waterAvailability?: string;
  drainageType?: string;
  averageRainfall?: number;
  elevation?: number;
  notes?: string;
  notesTa?: string;
  boundary?: GeoJSON.Polygon;
  status: 'active' | 'fallow' | 'inactive';
}

// ==========================================
// Crop
// ==========================================

export interface Crop extends BaseEntity {
  fieldId: string;
  name: string;
  nameTa?: string;
  variety?: string;
  season?: string;
  sowingDate?: string;
  expectedHarvestDate?: string;
  plantingMethod?: string;
  expectedYield?: number;
  yieldUnit?: string;
  notes?: string;
  notesTa?: string;
  status: 'active' | 'harvested' | 'failed';
}

// ==========================================
// Activity
// ==========================================

export interface ActivityType {
  id: string;
  name: string;
  nameTa?: string;
  icon: string;
  displayOrder: number;
}

export interface Activity extends BaseEntity {
  cropId: string;
  activityTypeId: string;
  activityType?: ActivityType;
  date: string;
  description?: string;
  quantity?: number;
  unit?: string;
  laborCount?: number;
  costEstimate?: number;
  photoUrls: string[];
  weatherSnapshot?: WeatherSnapshot;
}

// ==========================================
// Inventory
// ==========================================

export interface Warehouse extends BaseEntity {
  farmId: string;
  name: string;
  nameTa?: string;
  capacity: number;
  location?: string;
  manager?: string;
}

export interface InventoryCategory extends BaseEntity {
  farmId: string;
  name: string;
  nameTa?: string;
  icon?: string;
  color?: string;
  description?: string;
  parentCategoryId?: string;
}

export interface InventoryItem extends BaseEntity {
  farmId: string;
  name: string;
  nameTa?: string;
  sku?: string;
  barcode?: string;
  category?: InventoryCategory;
  categoryId?: string;
  subcategory?: string;
  description?: string;
  currentQuantity: number;
  unit: string;
  minimumStock: number;
  maximumStock?: number;
  cost: number;
  sellingPrice?: number;
  supplier?: string;
  storageLocation?: string;
  warehouse?: Warehouse;
  warehouseId?: string;
  expiryDate?: string;
  batchNumber?: string;
  imageUrl?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface StockTransaction {
  id: string;
  inventoryItemId: string;
  transactionType: 'PURCHASE' | 'SALE' | 'USAGE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN' | 'WASTE' | 'HARVEST_STORAGE';
  quantity: number;
  unit: string;
  userId?: string;
  userName?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  type: 'low_stock' | 'reorder' | 'anomaly' | 'expiry' | 'supplier' | 'depletion';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  suggestedAction?: string;
  estimatedDepletionDate?: string;
}

// ==========================================
// Labour
// ==========================================

export interface Labour extends BaseEntity {
  farmId: string;
  name: string;
  phone?: string;
  role?: string;
  dailyWage?: number;
  status: 'active' | 'inactive';
}

// ==========================================
// Finance
// ==========================================

export interface Expense extends BaseEntity {
  farmId: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  receiptPhotoUrl?: string;
  relatedActivityId?: string;
}

export interface Income extends BaseEntity {
  farmId: string;
  source: string;
  amount: number;
  date: string;
  description?: string;
}

export interface Harvest extends BaseEntity {
  cropId: string;
  quantity: number;
  unit: string;
  qualityGrade?: string;
  date: string;
  soldTo?: string;
  salePrice?: number;
}

// ==========================================
// Weather
// ==========================================

export interface WeatherSnapshot {
  temperature?: number;
  humidity?: number;
  description?: string;
  windSpeed?: number;
  recordedAt?: string;
}

export interface WeatherForecast {
  date: string;
  temperatureHigh: number;
  temperatureLow: number;
  humidity: number;
  description: string;
  icon: string;
  precipitation?: number;
}

// ==========================================
// Notification
// ==========================================

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  body?: string;
  severity: NotificationSeverity;
  type: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  readAt?: string;
}

// ==========================================
// Finance ERP
// ==========================================

export interface FinancialTransaction extends BaseEntity {
  farmId: string;
  transactionType: 'REVENUE' | 'EXPENSE' | 'LIABILITY' | 'ASSET';
  category: string;
  amount: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  paymentMethod: string;
  status: string;
  transactionDate: string;
}

export interface JournalEntry {
  id: string;
  financialTransactionId: string;
  accountName: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface FinancialBudget extends BaseEntity {
  farmId: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  startDate: string;
  endDate: string;
}

export interface FinancialAuditLog {
  id: string;
  financialTransactionId?: string;
  userId?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface FinanceDashboard {
  revenueToday: number;
  revenueMonth: number;
  expensesToday: number;
  expensesMonth: number;
  netProfit: number;
  cashAvailable: number;
  inventoryValue: number;
  outstandingPayments: number;
  budgetUtilization: number;
  roi: number;

  revenueVsExpenses: Array<{ name: string; revenue: number; expenses: number }>;
  monthlyCashFlow: Array<{ date: string; value: number }>;
  profitTrend: Array<{ date: string; value: number }>;
  expenseBreakdown: Array<{ name: string; value: number }>;
  revenueSources: Array<{ name: string; value: number }>;
  budgetUsage: Array<{ category: string; limit: number; spent: number }>;
  farmWiseProfit: Array<{ farm: string; profit: number }>;
  fieldWiseCost: Array<{ field: string; cost: number }>;
  inventoryPurchaseTrend: Array<{ date: string; value: number }>;

  activities: Array<{
    id: string;
    timestamp: string;
    refNumber: string;
    farm: string;
    category: string;
    amount: number;
    status: string;
    transactionType: string;
  }>;
  alerts: Array<{ title: string; description: string; severity: string }>;
  aiInsights: Array<{ title: string; description: string; severity: string }>;
  topExpenses: Array<{ category: string; amount: number }>;
  topRevenue: Array<{ category: string; amount: number }>;
}

