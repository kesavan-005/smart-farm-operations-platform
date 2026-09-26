import React from 'react';
import { usePermissionStore } from '@/store/permissionStore';
import type { FarmModule, ModuleAccessLevel } from '@/types/permissions';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface PermissionGuardProps {
  module: FarmModule;
  level?: ModuleAccessLevel;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  level = 'VIEW_ONLY',
  children,
}) => {
  const { hasModuleAccess, isLoading } = usePermissionStore();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!hasModuleAccess(module, level)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-950/60 border border-amber-800/60 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {t('permissions.accessRestrictedTitle', 'Access Restricted')}
          </h2>
          <p className="text-sm text-slate-400">
            {t(
              'permissions.accessRestrictedDesc',
              'You don\'t have permission to access this section. Please contact your Farm Owner.'
            )}
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              {t('permissions.backToDashboard', 'Back to Dashboard')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
