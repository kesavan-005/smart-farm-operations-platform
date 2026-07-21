// App root — providers, error boundary, router
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { queryClient } from '@/lib/queryClient';
import { SyncStatusProvider } from '@/offline';
import { Toaster } from '@/components/ui/toaster';
import { router } from './routes';

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))] px-4" role="alert">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🌾</div>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
          Something went wrong
        </h1>
        <p className="text-[rgb(var(--color-text-secondary))] mb-6">
          {errorMessage}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-[rgb(var(--color-primary-600))] text-white rounded-xl font-medium
                     hover:bg-[rgb(var(--color-primary-700))] transition-colors
                     min-h-[var(--touch-target-min)]"
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <SyncStatusProvider>
          <RouterProvider router={router} />
          <Toaster />
        </SyncStatusProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
