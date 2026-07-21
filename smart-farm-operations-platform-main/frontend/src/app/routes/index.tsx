// React Router route definitions — mirrors SAD Section 26
// Every feature route is code-split via React.lazy

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';

// ==========================================
// Lazy-loaded page components
// Phase 1: all are placeholder "Coming Soon" pages


// Auth pages (Phase 2)
const LoginPage = lazy(() => import('@/features/auth/components/LoginScreen'));
const RegisterPage = lazy(() => import('@/features/auth/components/RegisterScreen'));
const ForgotPasswordPage = lazy(() => import('./ComingSoonPage'));

// Main pages (Phase 3+)
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardScreen'));
const FarmListPage = lazy(() => import('@/features/farms').then(m => ({ default: m.FarmListScreen })));
const FarmDetailPage = lazy(() => import('@/features/farms').then(m => ({ default: m.FarmDetailScreen })));
const FarmMapPage = lazy(() => import('./ComingSoonPage'));
const FieldDetailPage = lazy(() => import('@/features/fields').then(m => ({ default: m.FieldDetailScreen })));
const CropDetailPage = lazy(() => import('@/features/crops').then(m => ({ default: m.CropDetailScreen })));
const ActivityTimelinePage = lazy(() => import('./ComingSoonPage'));
const AddActivityPage = lazy(() => import('./ComingSoonPage'));
const OperationsPage = lazy(() => import('@/features/operations/components/OperationsScreen'));

// Supporting pages (Phase 4+)
const InventoryPage = lazy(() => import('@/features/inventory/components/InventoryScreen'));
const LabourPage = lazy(() => import('./ComingSoonPage'));
const ExpensesPage = lazy(() => import('@/features/finance').then(m => ({ default: m.FinanceScreen })));
const IncomePage = lazy(() => import('./ComingSoonPage'));
const HarvestPage = lazy(() => import('./ComingSoonPage'));

// Cross-cutting pages (Phase 5+)
const ReportsPage = lazy(() => import('./ComingSoonPage'));
const WeatherPage = lazy(() => import('./ComingSoonPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/components/NotificationScreen'));
const SettingsPage = lazy(() => import('@/features/auth/components/SettingsScreen'));
const ProfilePage = lazy(() => import('@/features/auth/components/ProfileScreen'));
const HelpPage = lazy(() => import('@/features/help/components/HelpScreen'));

// Error pages
const NotFoundPage = lazy(() => import('./errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('./errors/ForbiddenPage'));
const ServerErrorPage = lazy(() => import('./errors/ServerErrorPage'));
const UnauthorizedPage = lazy(() => import('./errors/UnauthorizedPage'));
const OfflinePage = lazy(() => import('./errors/OfflinePage'));

// Admin pages (Phase 6)
const AdminDashboardPage = lazy(() => import('./ComingSoonPage'));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-[rgb(var(--color-primary-200))] border-t-[rgb(var(--color-primary-600))] rounded-full animate-spin" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // ==========================================
  // Auth routes — AuthLayout
  // ==========================================
  {
    element: (
      <AuthLayout>
        <SuspenseWrapper>
          <LoginPage />
        </SuspenseWrapper>
      </AuthLayout>
    ),
    path: '/login',
  },
  {
    element: (
      <AuthLayout>
        <SuspenseWrapper>
          <RegisterPage />
        </SuspenseWrapper>
      </AuthLayout>
    ),
    path: '/register',
  },
  {
    element: (
      <AuthLayout>
        <SuspenseWrapper>
          <ForgotPasswordPage />
        </SuspenseWrapper>
      </AuthLayout>
    ),
    path: '/forgot-password',
  },

  // ==========================================
  // App routes — AppLayout
  // ==========================================
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: '/dashboard',
        element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
      },

      // Farm hierarchy
      {
        path: '/farms',
        element: <SuspenseWrapper><FarmListPage /></SuspenseWrapper>,
      },
      {
        path: '/farms/:farmId',
        element: <SuspenseWrapper><FarmDetailPage /></SuspenseWrapper>,
      },
      {
        path: '/farms/:farmId/map',
        element: <SuspenseWrapper><FarmMapPage /></SuspenseWrapper>,
      },
      {
        path: '/farms/:farmId/fields/:fieldId',
        element: <SuspenseWrapper><FieldDetailPage /></SuspenseWrapper>,
      },
      {
        path: '/farms/:farmId/fields/:fieldId/crops/:cropId',
        element: <SuspenseWrapper><CropDetailPage /></SuspenseWrapper>,
      },
      {
        path: '/farms/:farmId/fields/:fieldId/crops/:cropId/activities',
        element: <SuspenseWrapper><ActivityTimelinePage /></SuspenseWrapper>,
      },
      { path: '/operations', element: <SuspenseWrapper><OperationsPage /></SuspenseWrapper> },

      // Supporting modules
      { path: '/inventory', element: <SuspenseWrapper><InventoryPage /></SuspenseWrapper> },
      { path: '/labour', element: <SuspenseWrapper><LabourPage /></SuspenseWrapper> },
      { path: '/expenses', element: <SuspenseWrapper><ExpensesPage /></SuspenseWrapper> },
      { path: '/income', element: <SuspenseWrapper><IncomePage /></SuspenseWrapper> },
      { path: '/harvest', element: <SuspenseWrapper><HarvestPage /></SuspenseWrapper> },

      // Cross-cutting
      { path: '/reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
      { path: '/weather', element: <SuspenseWrapper><WeatherPage /></SuspenseWrapper> },
      { path: '/notifications', element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper> },
      { path: '/settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
      { path: '/profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
      { path: '/help', element: <SuspenseWrapper><HelpPage /></SuspenseWrapper> },

      // Errors
      { path: '/401', element: <SuspenseWrapper><UnauthorizedPage /></SuspenseWrapper> },
      { path: '/403', element: <SuspenseWrapper><ForbiddenPage /></SuspenseWrapper> },
      { path: '/500', element: <SuspenseWrapper><ServerErrorPage /></SuspenseWrapper> },
      { path: '/offline', element: <SuspenseWrapper><OfflinePage /></SuspenseWrapper> },

      // Admin
      { path: '/admin/*', element: <SuspenseWrapper><AdminDashboardPage /></SuspenseWrapper> },
    ],
  },

  // ==========================================
  // Focus routes (no nav chrome) — defined inline in Phase 3+
  // e.g., /farms/:farmId/fields/:fieldId/crops/:cropId/activities/add
  // ==========================================
  {
    path: '/farms/:farmId/fields/:fieldId/crops/:cropId/activities/add',
    element: <SuspenseWrapper><AddActivityPage /></SuspenseWrapper>,
  },

  // Catch-all 404
  {
    path: '*',
    element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper>,
  },
]);
