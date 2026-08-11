// useOfflineQuery — the query hook every feature must use
// Reads from IndexedDB first (instant), revalidates from API if online
// Implements stale-while-revalidate with offline persistence

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { db } from './db';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, PaginatedResponse, FilterParams } from '@/types/api';

interface OfflineQueryOptions<TData> {
  /** TanStack Query key */
  queryKey: unknown[];
  /** API endpoint path (e.g., '/farms' or '/farms/123/fields') */
  endpoint: string;
  /** Dexie table name for local cache */
  tableName: string;
  /** Optional: filter function for local IndexedDB data */
  localFilter?: (item: TData) => boolean;
  /** Optional: query parameters for the API call */
  params?: FilterParams;
  /** Optional: stale time in ms (default: 5 minutes) */
  staleTime?: number;
  /** Optional: additional TanStack Query options */
  queryOptions?: Partial<UseQueryOptions<TData[], Error>>;
}

/**
 * Offline-first query hook for list data.
 *
 * Usage:
 *   const { data, isLoading } = useOfflineQuery({
 *     queryKey: ['fields', farmId],
 *     endpoint: `/farms/${farmId}/fields`,
 *     tableName: 'fields',
 *     localFilter: (field) => field.farmId === farmId,
 *   });
 */
export function useOfflineQuery<TData extends { id: string }>(
  options: OfflineQueryOptions<TData>,
) {
  const { queryKey, endpoint, tableName, localFilter, params, staleTime, queryOptions } = options;

  return useQuery<TData[], Error>({
    queryKey,
    queryFn: async (): Promise<TData[]> => {
      try {
        if (navigator.onLine) {
          // Fetch from API
          const response = await apiClient.get<ApiResponse<TData[]> | PaginatedResponse<TData>>(
            endpoint,
            { params },
          );
          const data = response.data.data;
          const items = Array.isArray(data) ? data : [data];

          // Update IndexedDB cache
          const table = db.table(tableName);
          await table.bulkPut(items.map((item) => ({ ...item, _synced: true })));

          return items;
        }
      } catch {
        // Network error — fall through to IndexedDB
      }

      // Offline or error: read from IndexedDB
      const table = db.table(tableName);
      const localData = await table.toArray();
      const filtered = localFilter ? localData.filter(localFilter) : localData;

      return filtered as TData[];
    },

    staleTime: staleTime ?? 30 * 1000, // 30 seconds — short enough for new farms to appear quickly
    gcTime: Infinity, // Never garbage collect — critical for offline support
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,

    ...queryOptions,
  });
}

/**
 * Offline-first query hook for a single entity by ID.
 */
export function useOfflineQueryById<TData extends { id: string }>(options: {
  queryKey: unknown[];
  endpoint: string;
  tableName: string;
  entityId: string;
  staleTime?: number;
}) {
  const { queryKey, endpoint, tableName, entityId, staleTime } = options;

  return useQuery<TData | null, Error>({
    queryKey,
    queryFn: async (): Promise<TData | null> => {
      try {
        if (navigator.onLine) {
          const response = await apiClient.get<ApiResponse<TData>>(endpoint);
          const data = response.data.data;

          // Update IndexedDB cache
          const table = db.table(tableName);
          await table.put({ ...data, _synced: true });

          return data;
        }
      } catch {
        // Fall through to IndexedDB
      }

      // Offline: read from IndexedDB
      const table = db.table(tableName);
      const localData = await table.get(entityId);
      return (localData as TData) ?? null;
    },

    staleTime: staleTime ?? 5 * 60 * 1000,
    gcTime: Infinity,

  });
}
