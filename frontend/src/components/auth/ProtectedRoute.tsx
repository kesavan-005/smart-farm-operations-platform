import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, hasPermission } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || 'WORKER';
    if (!allowedRoles.includes(userRole) && userRole !== 'ADMIN' && userRole !== 'FARM_OWNER') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-6">
          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-red-950/80 border border-red-800/60 rounded-full flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Access Denied (403)</h2>
            <p className="text-sm text-slate-400">
              Your role <span className="font-semibold text-amber-400">{userRole}</span> does not have authorization to access this feature.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm rounded-xl transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-6">
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/80 border border-red-800/60 rounded-full flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Insufficient Permissions</h2>
          <p className="text-sm text-slate-400">
            Missing required permission: <code className="bg-slate-900 px-2 py-1 rounded text-amber-300">{requiredPermission}</code>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
