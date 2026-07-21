// TanStack Query client configuration
// Includes persistence to IndexedDB for offline support

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes default
      gcTime: Infinity,                // Never garbage collect (offline support)
      retry: 2,                        // Retry failed requests twice
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0, // Mutations go through useOfflineMutation — retries handled by sync queue
    },
  },
});
