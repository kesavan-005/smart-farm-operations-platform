import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { FarmSchedule } from '@/types/operations';

export function useSchedules(farmId?: string) {
  return useOfflineQuery<FarmSchedule>({
    queryKey: ['schedules', { farmId }],
    endpoint: '/farm-schedules',
    tableName: 'schedules',
    params: { farmId } as any,
    localFilter: (fs) => {
      if (farmId) return fs.farmId === farmId;
      return true;
    }
  });
}

export function useSchedule(id: string) {
  return useOfflineQueryById<FarmSchedule>({
    queryKey: ['schedules', id],
    endpoint: `/farm-schedules/${id}`,
    tableName: 'schedules',
    entityId: id,
  });
}

export function useCreateSchedule(farmId: string) {
  return useOfflineMutation<FarmSchedule, Omit<FarmSchedule, 'id' | 'createdAt' | 'updatedAt' | 'farmName'>>({
    entityType: 'farmSchedule',
    tableName: 'schedules',
    operation: 'CREATE',
    invalidateKeys: [
      ['schedules'],
      ['schedules', { farmId }],
    ],
  });
}

export function useUpdateSchedule(farmId: string, id: string) {
  return useOfflineMutation<FarmSchedule, Partial<FarmSchedule> & { id: string }>({
    entityType: 'farmSchedule',
    tableName: 'schedules',
    operation: 'UPDATE',
    invalidateKeys: [
      ['schedules'],
      ['schedules', id],
      ['schedules', { farmId }],
    ],
  });
}

export function useDeleteSchedule(farmId: string) {
  return useOfflineMutation<FarmSchedule, { id: string }>({
    entityType: 'farmSchedule',
    tableName: 'schedules',
    operation: 'DELETE',
    invalidateKeys: [
      ['schedules'],
      ['schedules', { farmId }],
    ],
  });
}
