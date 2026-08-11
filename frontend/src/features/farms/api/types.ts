export interface AttentionItem {
  type: string;
  title: string;
  description: string;
  severity: string;
  relatedEntityId: string;
}

export interface FarmProfile {
  name: string;
  location: string;
  totalArea: number;
  areaUnit: string;
  soilType: string;
  irrigationSource: string;
}

export interface FieldContext {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  status: string;
  activeCropName: string | null;
  activeCropId: string | null;
}

export interface CropStateContext {
  id: string;
  name: string;
  variety: string;
  sowingDate: string | null;
  expectedHarvestDate: string | null;
  currentLifecycleStage: string;
  isCalculatedStage: boolean;
  status: string;
  fieldId: string;
}

export interface ActivityContext {
  id: string;
  title: string;
  activityType: string;
  status: string;
  priority: string;
  date: string;
}

export interface FinanceSummary {
  currentMonthExpenses: number;
  currency: string;
}

export interface InventorySummary {
  totalUniqueItems: number;
  lowStockCount: number;
}

export interface FarmContextSummary {
  totalFarmArea: number;
  areaUnit: string;
  fieldCount: number;
  activeCropCount: number;
  recentActivityCount: number;
}

export interface FarmContextResponse {
  farmProfile: FarmProfile;
  summary: FarmContextSummary;
  fields: FieldContext[];
  cropStates: CropStateContext[];
  recentActivities: ActivityContext[];
  financeSummary: FinanceSummary;
  inventorySummary: InventorySummary;
  attentionItems: AttentionItem[];
}
