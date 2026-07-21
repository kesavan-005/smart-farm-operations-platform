import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { WorkOrder } from '@/types/operations';

export function useWorkOrders(farmId?: string) {
  return useOfflineQuery<WorkOrder>({
    queryKey: ['workOrders', { farmId }],
    endpoint: '/work-orders',
    tableName: 'workOrders',
    params: { farmId } as any,
    localFilter: (wo) => {
      if (farmId) return wo.farmId === farmId;
      return true;
    }
  });
}

export function useWorkOrder(id: string) {
  return useOfflineQueryById<WorkOrder>({
    queryKey: ['workOrders', id],
    endpoint: `/work-orders/${id}`,
    tableName: 'workOrders',
    entityId: id,
  });
}

export function useCreateWorkOrder(farmId: string) {
  return useOfflineMutation<WorkOrder, Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'farmName'>>({
    entityType: 'workOrder',
    tableName: 'workOrders',
    operation: 'CREATE',
    invalidateKeys: [
      ['workOrders'],
      ['workOrders', { farmId }],
    ],
  });
}

export function useUpdateWorkOrder(farmId: string, id: string) {
  return useOfflineMutation<WorkOrder, Partial<WorkOrder> & { id: string }>({
    entityType: 'workOrder',
    tableName: 'workOrders',
    operation: 'UPDATE',
    invalidateKeys: [
      ['workOrders'],
      ['workOrders', id],
      ['workOrders', { farmId }],
    ],
  });
}

export function useDeleteWorkOrder(farmId: string) {
  return useOfflineMutation<WorkOrder, { id: string }>({
    entityType: 'workOrder',
    tableName: 'workOrders',
    operation: 'DELETE',
    invalidateKeys: [
      ['workOrders'],
      ['workOrders', { farmId }],
    ],
  });
}
