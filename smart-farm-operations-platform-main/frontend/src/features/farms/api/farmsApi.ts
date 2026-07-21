import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { Farm } from '@/types/domain';

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
  return useOfflineMutation<Farm, Omit<Farm, 'id' | 'farmCode' | 'ownerUserId' | 'createdAt' | 'updatedAt'>>({
    entityType: 'farm',
    tableName: 'farms',
    operation: 'CREATE',
    invalidateKeys: [['farms']],
  });
}

export function useUpdateFarm(id: string) {
  return useOfflineMutation<Farm, Partial<Farm> & { id: string }>({
    entityType: 'farm',
    tableName: 'farms',
    operation: 'UPDATE',
    invalidateKeys: [['farms'], ['farms', id]],
  });
}

export function useDeleteFarm() {
  return useOfflineMutation<Farm, { id: string }>({
    entityType: 'farm',
    tableName: 'farms',
    operation: 'DELETE',
    invalidateKeys: [['farms']],
  });
}
