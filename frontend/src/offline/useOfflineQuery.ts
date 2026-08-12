// useOfflineQuery — the query hook every feature must use
// Reads from IndexedDB first (instant), revalidates from API if online
// Implements stale-while-revalidate with offline persistence

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { db } from './db';
import { apiClient } from '../lib/apiClient';
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
          const rawData = response.data.data;
          let items: TData[] = [];

          if (Array.isArray(rawData)) {
            items = rawData;
          } else if (rawData && typeof rawData === 'object' && 'content' in rawData && Array.isArray((rawData as any).content)) {
            items = (rawData as any).content;
          } else if (rawData) {
            items = [rawData as TData];
          }

          // Update IndexedDB cache & purge stale synced items no longer on server
          const table = db.table(tableName);
          if (items.length > 0) {
            await table.bulkPut(items.map((item) => ({ ...item, _synced: true })));
          }

          // Get all local data
          const localData = await table.toArray();
          const serverIds = new Set(items.map((i) => i.id));

          // Get pending sync entries from syncQueue to protect offline-created items
          const pendingSyncEntries = await db.syncQueue.where('entityType').equals(tableName.replace(/s$/, '')).toArray();
          const pendingIds = new Set(pendingSyncEntries.map((e: any) => e.payload?.id).filter(Boolean));

          // Delete stale entries that no longer exist on server and are not pending sync
          const staleEntries = localData.filter(
            (item: any) => !serverIds.has(item.id) && !pendingIds.has(item.id)
          );
          if (staleEntries.length > 0) {
            await table.bulkDelete(staleEntries.map((e: any) => e.id));

            if (tableName === 'farms') {
              const currentActiveId = (await import('../store/farmStore')).useFarmStore.getState().activeFarmId;
              if (currentActiveId && staleEntries.some((e: any) => e.id === currentActiveId)) {
                const newActiveId = items.length > 0 && items[0] ? items[0].id : null;
                if (newActiveId) {
                  (await import('../store/farmStore')).useFarmStore.getState().setActiveFarmId(newActiveId);
                }
              }
            }
          }

          // Merge unsynced local items pending sync
          const unsyncedLocal = localData.filter(
            (item) => (item._synced === false || pendingIds.has(item.id)) && (!localFilter || localFilter(item as TData))
          );
          const merged = [...items];
          for (const u of unsyncedLocal) {
            if (!serverIds.has(u.id) && !merged.some((m) => m.id === u.id)) {
              merged.push(u as TData);
            }
          }

          return merged;
        }
      } catch (err) {
        console.warn(`useOfflineQuery network error for ${endpoint}, falling back to IndexedDB`, err);
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

          if (data && data.id) {
            // Update IndexedDB cache
            const table = db.table(tableName);
            await table.put({ ...data, _synced: true });
          }

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
