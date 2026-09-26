import React from 'react';
import { usePermissionStore } from '@/store/permissionStore';
import type { FarmModule, ModuleAccessLevel, SensitivePermission } from '@/types/permissions';

interface ActionGuardProps {
  module: FarmModule;
  level?: ModuleAccessLevel;
  sensitivePermission?: SensitivePermission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ActionGuard: React.FC<ActionGuardProps> = ({
  module,
  level = 'FULL_ACCESS',
  sensitivePermission,
  fallback = null,
  children,
}) => {
  const { hasModuleAccess, hasSensitivePermission } = usePermissionStore();

  const allowed = sensitivePermission
    ? hasSensitivePermission(sensitivePermission)
    : hasModuleAccess(module, level);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
