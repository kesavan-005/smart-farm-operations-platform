
export type EquipmentType = 'TRACTOR' | 'HARVESTER' | 'SPRAYER' | 'PUMP' | 'SENSOR' | 'VEHICLE' | 'OTHER';
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN';
export type WorkOrderStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type LaborStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';
export type ScheduleType = 'IRRIGATION' | 'HARVEST' | 'MAINTENANCE' | 'SPRAYING' | 'OTHER';

export interface Equipment {
  id: string;
  farmId: string;
  farmName?: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  farmId: string;
  farmName?: string;
  title: String;
  description?: string;
  assignedTeam?: string;
  status: WorkOrderStatus;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LaborRecord {
  id: string;
  farmId: string;
  farmName?: string;
  workerId: string;
  workerName?: string;
  workerPhone?: string;
  recordDate: string; // YYYY-MM-DD
  status: LaborStatus;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  productivityScore?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmSchedule {
  id: string;
  farmId: string;
  farmName?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  recurrence?: string; // NONE, DAILY, WEEKLY, MONTHLY
  type: ScheduleType;
  createdAt: string;
}
