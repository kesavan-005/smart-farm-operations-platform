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

const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  [UserRole.OWNER]: new Set([
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
  ]),
  [UserRole.MANAGER]: new Set([
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
  [UserRole.WORKER]: new Set([
    'farm:read',
    'field:read',
    'crop:read',
    'activity:read', 'activity:create',
    'inventory:read',
    'harvest:read', 'harvest:create',
  ]),
  [UserRole.ADMIN]: new Set([
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
  ]),
};

/**
 * Check if a role has a specific permission.
 * Used by ProtectedRoute and UI elements — this is a UX convenience,
 * never trusted as the security boundary (that's the backend @PreAuthorize).
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Check if a user has permission on a specific farm.
 * Looks up the user's role on that farm from their farmRoles array.
 */
export function hasPermissionOnFarm(
  farmRoles: Array<{ farmId: string; role: UserRole }>,
  farmId: string,
  permission: Permission,
): boolean {
  const farmRole = farmRoles.find((fr) => fr.farmId === farmId);
  if (!farmRole) return false;
  return hasPermission(farmRole.role, permission);
}
