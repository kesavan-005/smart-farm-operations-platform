import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { Crop } from '@/types/domain';

export function useCrops(fieldId: string, search?: string, status?: string) {
  return useOfflineQuery<Crop>({
    queryKey: ['crops', { fieldId, search, status }],
    endpoint: '/crops',
    tableName: 'crops',
    params: { fieldId, search, status } as any,
    localFilter: (crop) => {
      let match = crop.fieldId === fieldId;
      if (status) match = match && crop.status === status;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          crop.name.toLowerCase().includes(q) ||
          (crop.variety?.toLowerCase().includes(q) ?? false) ||
          (crop.season?.toLowerCase().includes(q) ?? false)
        );
      }
      return match;
    }
  });
}

export function useCrop(id: string) {
  return useOfflineQueryById<Crop>({
    queryKey: ['crops', id],
    endpoint: `/crops/${id}`,
    tableName: 'crops',
    entityId: id,
  });
}

export function useCreateCrop(fieldId: string) {
  return useOfflineMutation<Crop, Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>>({
    entityType: 'crop',
    tableName: 'crops',
    operation: 'CREATE',
    invalidateKeys: [['crops', { fieldId }]],
  });
}

export function useUpdateCrop(fieldId: string, id: string) {
  return useOfflineMutation<Crop, Partial<Crop> & { id: string }>({
    entityType: 'crop',
    tableName: 'crops',
    operation: 'UPDATE',
    invalidateKeys: [['crops', { fieldId }], ['crops', id]],
  });
}

export function useDeleteCrop(fieldId: string) {
  return useOfflineMutation<Crop, { id: string }>({
    entityType: 'crop',
    tableName: 'crops',
    operation: 'DELETE',
    invalidateKeys: [['crops', { fieldId }]],
  });
}
