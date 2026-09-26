export type ActivityType =
  | 'IRRIGATION'
  | 'FERTILIZER'
  | 'PESTICIDE'
  | 'HARVEST'
  | 'PLANTING'
  | 'SOIL_TEST'
  | 'MAINTENANCE'
  | 'INSPECTION'
  | 'OTHER';

export type ActivityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FarmActivity {
  id: string;
  title: string;
  description?: string;
  activityType: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  farmId: string;
  farmCode: string;
  farmName: string;
  fieldId: string;
  fieldCode: string;
  fieldName: string;
  cropId?: string;
  cropName?: string;
  performedBy?: string;
  performedByName?: string;
  performedByPhone?: string;
  scheduledDate: string;
  completedDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
  attachments?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  season?: string;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  supervisorId?: string;
  supervisorName?: string;
  requiredEquipment?: string;
  requiredInventory?: string;
  progress?: number;
}
