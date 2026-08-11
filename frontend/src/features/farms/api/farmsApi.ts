import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Farm } from '@/types/domain';
import type { FarmContextResponse } from './types';

export function useFarms(search?: string, status?: string) {
  return useOfflineQuery<Farm>({
    queryKey: ['farms', { search, status }],
    endpoint: '/farms',
    tableName: 'farms',
    params: { search, status } as any,
    localFilter: (farm) => {
      let match = true;
      if (status) match = match && farm.status === status;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          farm.name.toLowerCase().includes(q) ||
          (farm.village?.toLowerCase().includes(q) ?? false) ||
          (farm.taluk?.toLowerCase().includes(q) ?? false) ||
          (farm.district?.toLowerCase().includes(q) ?? false) ||
          (farm.state?.toLowerCase().includes(q) ?? false) ||
          farm.farmCode.toLowerCase().includes(q)
        );
      }
      return match;
    }
  });
}

export function useFarm(id: string) {
  return useOfflineQueryById<Farm>({
    queryKey: ['farms', id],
    endpoint: `/farms/${id}`,
    tableName: 'farms',
    entityId: id,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useOfflineMutation<Farm, Omit<Farm, 'id' | 'farmCode' | 'ownerUserId' | 'createdAt' | 'updatedAt'>>({
    entityType: 'farm',
    tableName: 'farms',
    operation: 'CREATE',
    invalidateKeys: [['farms']],
    mutationOptions: {
      onSuccess: () => {
        // Broad invalidation: invalidates ALL queries whose key starts with 'farms'
        // This fixes the key-mismatch: ['farms'] vs ['farms', {search, status}]
        queryClient.invalidateQueries({ queryKey: ['farms'], exact: false });
      }
    }
  });
}

export function useUpdateFarm(id: string) {
  const queryClient = useQueryClient();
  return useOfflineMutation<Farm, Partial<Farm> & { id: string }>({
    entityType: 'farm',
    tableName: 'farms',
    operation: 'UPDATE',
    invalidateKeys: [['farms'], ['farms', id]],
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['farms'], exact: false });
      }
    }
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useOfflineMutation<Farm, { id: string }>({
    entityType: 'farm',
    tableName: 'farms',
    operation: 'DELETE',
    invalidateKeys: [['farms']],
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['farms'], exact: false });
      }
    }
  });
}

export function useFarmContext(farmId: string) {
  return useQuery({
    queryKey: ['farms', farmId, 'context'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: FarmContextResponse }>(`/farms/${farmId}/context`);
      return response.data.data;
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
  });
}

