import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { LaborRecord } from '@/types/operations';

export function useLaborRecords(farmId?: string) {
  return useOfflineQuery<LaborRecord>({
    queryKey: ['laborRecords', { farmId }],
    endpoint: '/labor-records',
    tableName: 'laborRecords',
    params: { farmId } as any,
    localFilter: (lr) => {
      if (farmId) return lr.farmId === farmId;
      return true;
    }
  });
}

export function useLaborRecord(id: string) {
  return useOfflineQueryById<LaborRecord>({
    queryKey: ['laborRecords', id],
    endpoint: `/labor-records/${id}`,
    tableName: 'laborRecords',
    entityId: id,
  });
}

export function useCreateLaborRecord(farmId: string) {
  return useOfflineMutation<LaborRecord, Omit<LaborRecord, 'id' | 'createdAt' | 'updatedAt' | 'farmName' | 'workerName' | 'workerPhone'>>({
    entityType: 'laborRecord',
    tableName: 'laborRecords',
    operation: 'CREATE',
    invalidateKeys: [
      ['laborRecords'],
      ['laborRecords', { farmId }],
    ],
  });
}

export function useUpdateLaborRecord(farmId: string, id: string) {
  return useOfflineMutation<LaborRecord, Partial<LaborRecord> & { id: string }>({
    entityType: 'laborRecord',
    tableName: 'laborRecords',
    operation: 'UPDATE',
    invalidateKeys: [
      ['laborRecords'],
      ['laborRecords', id],
      ['laborRecords', { farmId }],
    ],
  });
}

export function useDeleteLaborRecord(farmId: string) {
  return useOfflineMutation<LaborRecord, { id: string }>({
    entityType: 'laborRecord',
    tableName: 'laborRecords',
    operation: 'DELETE',
    invalidateKeys: [
      ['laborRecords'],
      ['laborRecords', { farmId }],
    ],
  });
}
