export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FarmTask {
  id: string;
  activityId: string;
  activityTitle: string;
  farmId: string;
  farmName: string;
  fieldId: string;
  fieldName: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedToPhone?: string;
  assignedBy?: string;
  assignedByName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  remarks?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;

  assignedEquipmentId?: string;
  assignedEquipmentName?: string;
  inventoryItemId?: string;
  inventoryQuantityUsed?: number;
  actualCost?: number;
  updatedBy?: string;
  updatedByName?: string;
  gpsLocation?: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedAt: string;
}

export interface TaskChecklist {
  id: string;
  taskId: string;
  itemName: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  commenterId?: string;
  commenterName: string;
  commentText: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  url: string;
  fileName?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  changedBy?: string;
  changedByName?: string;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  createdAt: string;
}
