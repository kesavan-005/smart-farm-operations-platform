import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { Field } from '@/types/domain';

export function useFields(farmId: string, search?: string, status?: string) {
  return useOfflineQuery<Field>({
    queryKey: ['fields', { farmId, search, status }],
    endpoint: '/fields',
    tableName: 'fields',
    params: { farmId, search, status } as any,
    localFilter: (field) => {
      let match = field.farmId === farmId;
      if (status) match = match && field.status === status;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          field.name.toLowerCase().includes(q) ||
          field.fieldCode.toLowerCase().includes(q)
        );
      }
      return match;
    }
  });
}

export function useField(id: string) {
  return useOfflineQueryById<Field>({
    queryKey: ['fields', id],
    endpoint: `/fields/${id}`,
    tableName: 'fields',
    entityId: id,
  });
}

export function useCreateField(farmId: string) {
  return useOfflineMutation<Field, Omit<Field, 'id' | 'fieldCode' | 'createdAt' | 'updatedAt'>>({
    entityType: 'field',
    tableName: 'fields',
    operation: 'CREATE',
    invalidateKeys: [['fields', { farmId }]],
  });
}

export function useUpdateField(farmId: string, id: string) {
  return useOfflineMutation<Field, Partial<Field> & { id: string }>({
    entityType: 'field',
    tableName: 'fields',
    operation: 'UPDATE',
    invalidateKeys: [['fields', { farmId }], ['fields', id]],
  });
}

export function useDeleteField(farmId: string) {
  return useOfflineMutation<Field, { id: string }>({
    entityType: 'field',
    tableName: 'fields',
    operation: 'DELETE',
    invalidateKeys: [['fields', { farmId }]],
  });
}
