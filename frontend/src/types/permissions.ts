// Permission matrix — implements SAD Section 7 RBAC table
// Used by both ProtectedRoute and UI elements to hide/disable affordances

import { UserRole } from './api';

export type Permission =
  | 'farm:read' | 'farm:create' | 'farm:update' | 'farm:delete'
  | 'field:read' | 'field:create' | 'field:update' | 'field:delete'
  | 'crop:read' | 'crop:create' | 'crop:update' | 'crop:delete'
  | 'activity:read' | 'activity:create' | 'activity:update' | 'activity:delete'
  | 'inventory:read' | 'inventory:create' | 'inventory:update' | 'inventory:delete'
  | 'labour:read' | 'labour:create' | 'labour:update' | 'labour:delete'
  | 'expense:read' | 'expense:create' | 'expense:update' | 'expense:delete'
  | 'income:read' | 'income:create' | 'income:update' | 'income:delete'
  | 'harvest:read' | 'harvest:create' | 'harvest:update' | 'harvest:delete'
  | 'report:read'
  | 'user:manage'
  | 'admin:access';

const ALL_PERMISSIONS = new Set<Permission>([
  'farm:read', 'farm:create', 'farm:update', 'farm:delete',
  'field:read', 'field:create', 'field:update', 'field:delete',
  'crop:read', 'crop:create', 'crop:update', 'crop:delete',
  'activity:read', 'activity:create', 'activity:update', 'activity:delete',
  'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
  'labour:read', 'labour:create', 'labour:update', 'labour:delete',
  'expense:read', 'expense:create', 'expense:update', 'expense:delete',
  'income:read', 'income:create', 'income:update', 'income:delete',
  'harvest:read', 'harvest:create', 'harvest:update', 'harvest:delete',
  'report:read',
  'user:manage',
  'admin:access',
]);

const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  [UserRole.FARM_OWNER]: ALL_PERMISSIONS,
  [UserRole.ADMIN]: ALL_PERMISSIONS,
  [UserRole.FARM_MANAGER]: new Set([
    'farm:read', 'farm:update',
    'field:read', 'field:create', 'field:update', 'field:delete',
    'crop:read', 'crop:create', 'crop:update', 'crop:delete',
    'activity:read', 'activity:create', 'activity:update', 'activity:delete',
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
    'labour:read', 'labour:create', 'labour:update', 'labour:delete',
    'expense:read', 'expense:create',
    'income:read', 'income:create',
    'harvest:read', 'harvest:create', 'harvest:update', 'harvest:delete',
    'report:read',
  ]),
  [UserRole.SUPERVISOR]: new Set([
    'farm:read',
    'field:read', 'field:create', 'field:update',
    'crop:read', 'crop:create', 'crop:update',
    'activity:read', 'activity:create', 'activity:update',
    'inventory:read',
    'harvest:read', 'harvest:create',
  ]),
  [UserRole.WORKER]: new Set([
    'farm:read',
    'field:read',
    'crop:read',
    'activity:read',
    'harvest:read',
  ]),
  [UserRole.VIEWER]: new Set([
    'farm:read',
    'field:read',
    'crop:read',
    'activity:read',
    'harvest:read',
  ]),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function hasPermissionOnFarm(
  farmRoles: Array<{ farmId: string; role: UserRole }>,
  farmId: string,
  permission: Permission,
): boolean {
  const farmRole = farmRoles.find((fr) => fr.farmId === farmId);
  if (!farmRole) return false;
  return hasPermission(farmRole.role, permission);
}
