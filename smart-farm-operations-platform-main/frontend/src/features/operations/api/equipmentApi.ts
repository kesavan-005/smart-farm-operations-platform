import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { Equipment } from '@/types/operations';

export function useEquipmentList(farmId?: string) {
  return useOfflineQuery<Equipment>({
    queryKey: ['equipment', { farmId }],
    endpoint: '/equipment',
    tableName: 'equipment',
    params: { farmId } as any,
    localFilter: (eq) => {
      if (farmId) return eq.farmId === farmId;
      return true;
    }
  });
}

export function useEquipment(id: string) {
  return useOfflineQueryById<Equipment>({
    queryKey: ['equipment', id],
    endpoint: `/equipment/${id}`,
    tableName: 'equipment',
    entityId: id,
  });
}

export function useCreateEquipment(farmId: string) {
  return useOfflineMutation<Equipment, Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'farmName'>>({
    entityType: 'equipment',
    tableName: 'equipment',
    operation: 'CREATE',
    invalidateKeys: [
      ['equipment'],
      ['equipment', { farmId }],
    ],
  });
}

export function useUpdateEquipment(farmId: string, id: string) {
  return useOfflineMutation<Equipment, Partial<Equipment> & { id: string }>({
    entityType: 'equipment',
    tableName: 'equipment',
    operation: 'UPDATE',
    invalidateKeys: [
      ['equipment'],
      ['equipment', id],
      ['equipment', { farmId }],
    ],
  });
}

export function useDeleteEquipment(farmId: string) {
  return useOfflineMutation<Equipment, { id: string }>({
    entityType: 'equipment',
    tableName: 'equipment',
    operation: 'DELETE',
    invalidateKeys: [
      ['equipment'],
      ['equipment', { farmId }],
    ],
  });
}
