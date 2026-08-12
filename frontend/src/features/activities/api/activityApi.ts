import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { FarmActivity } from '@/types/activity';

export interface ActivityFilters {
  farmId?: string;
  fieldId?: string;
  cropId?: string;
  activityType?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export function useActivities(filters: ActivityFilters = {}) {
  const { farmId, fieldId, cropId, activityType, status, priority, search } = filters;
  
  return useOfflineQuery<FarmActivity>({
    queryKey: ['activities', { farmId, fieldId, cropId, activityType, status, priority, search }],
    endpoint: '/activities',
    tableName: 'activities',
    params: { farmId, fieldId, cropId, activityType, status, priority, search } as any,
    localFilter: (act) => {
      let match = true;
      if (farmId) match = match && act.farmId === farmId;
      if (fieldId) match = match && act.fieldId === fieldId;
      if (cropId) match = match && act.cropId === cropId;
      if (activityType) match = match && act.activityType === activityType;
      if (status) match = match && act.status === status;
      if (priority) match = match && act.priority === priority;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          act.title.toLowerCase().includes(q) ||
          (act.description?.toLowerCase().includes(q) ?? false) ||
          (act.notes?.toLowerCase().includes(q) ?? false)
        );
      }
      return match;
    }
  });
}

export function useActivity(id: string) {
  return useOfflineQueryById<FarmActivity>({
    queryKey: ['activities', id],
    endpoint: `/activities/${id}`,
    tableName: 'activities',
    entityId: id,
  });
}

export function useCreateActivity(farmId: string) {
  return useOfflineMutation<FarmActivity, Omit<FarmActivity, 'id' | 'createdAt' | 'updatedAt' | 'farmCode' | 'farmName' | 'fieldCode' | 'fieldName'>>({
    entityType: 'farmActivity',
    tableName: 'activities',
    operation: 'CREATE',
    invalidateKeys: [
      ['activities'],
      ['activities', { farmId }],
    ],
  });
}

export function useUpdateActivity(farmId: string, id: string) {
  return useOfflineMutation<FarmActivity, Partial<FarmActivity> & { id: string }>({
    entityType: 'farmActivity',
    tableName: 'activities',
    operation: 'UPDATE',
    invalidateKeys: [
      ['activities'],
      ['activities', id],
      ['activities', { farmId }],
    ],
  });
}

export function useDeleteActivity(farmId: string) {
  return useOfflineMutation<FarmActivity, { id: string }>({
    entityType: 'farmActivity',
    tableName: 'activities',
    operation: 'DELETE',
    invalidateKeys: [
      ['activities'],
      ['activities', { farmId }],
    ],
  });
}
