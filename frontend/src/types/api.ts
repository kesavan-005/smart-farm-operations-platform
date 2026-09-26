// Global shared types — API envelope, pagination, sync status, domain stubs

// ==========================================
// API Response Envelope
// ==========================================

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
  error?: ApiError;
}

export interface ApiMeta {
  timestamp: string;
  correlationId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta & { pagination: PaginationMeta };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// ==========================================
// Query Parameters
// ==========================================

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface FilterParams extends PaginationParams {
  search?: string;
  status?: string;
  [key: string]: string | number | undefined;
}

// ==========================================
// Sync Status
// ==========================================

export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export interface SyncQueueEntry {
  id?: number;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: unknown;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  conflictStatus?: 'none' | 'conflict' | 'resolved';
  createdAt: Date;
  syncedAt?: Date;
}

// ==========================================
// User & Auth
// ==========================================

export enum UserRole {
  FARM_OWNER = 'FARM_OWNER',
  ADMIN = 'ADMIN',
  FARM_MANAGER = 'FARM_MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  WORKER = 'WORKER',
  VIEWER = 'VIEWER',
}

export interface UserFarmRole {
  farmId: string;
  farmName: string;
  role: UserRole;
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  farmId?: string;
  farmName?: string;
  avatar?: string;
  language?: string;
  preferredLanguage?: 'en' | 'ta';
  active?: boolean;
  verified?: boolean;
  permissions?: string[];
  createdAt?: string;
}

// ==========================================
// Base Entity
// ==========================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
