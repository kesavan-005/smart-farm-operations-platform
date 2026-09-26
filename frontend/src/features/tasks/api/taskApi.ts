import { useOfflineQuery, useOfflineQueryById } from '@/offline/useOfflineQuery';
import { useOfflineMutation } from '@/offline/useOfflineMutation';
import type { FarmTask } from '@/types/task';

export interface TaskFilters {
  farmId?: string;
  fieldId?: string;
  activityId?: string;
  assignedUserId?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  const { farmId, fieldId, activityId, assignedUserId, status, priority, search } = filters;

  return useOfflineQuery<FarmTask>({
    queryKey: ['tasks', { farmId, fieldId, activityId, assignedUserId, status, priority, search }],
    endpoint: '/tasks',
    tableName: 'tasks',
    params: { farmId, fieldId, activityId, assignedUserId, status, priority, search } as any,
    localFilter: (task) => {
      let match = true;
      if (farmId) match = match && task.farmId === farmId;
      if (fieldId) match = match && task.fieldId === fieldId;
      if (activityId) match = match && task.activityId === activityId;
      if (assignedUserId) match = match && task.assignedTo === assignedUserId;
      if (status) match = match && task.status === status;
      if (priority) match = match && task.priority === priority;
      if (search) {
        const q = search.toLowerCase();
        match = match && (
          task.title.toLowerCase().includes(q) ||
          (task.description?.toLowerCase().includes(q) ?? false) ||
          (task.remarks?.toLowerCase().includes(q) ?? false)
        );
      }
      return match;
    }
  });
}

export function useTask(id: string) {
  return useOfflineQueryById<FarmTask>({
    queryKey: ['tasks', id],
    endpoint: `/tasks/${id}`,
    tableName: 'tasks',
    entityId: id,
  });
}

export function useCreateTask(farmId: string) {
  return useOfflineMutation<FarmTask, Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt' | 'farmName' | 'fieldName' | 'activityTitle' | 'assignedToName' | 'assignedToPhone' | 'assignedByName' | 'createdByName'>>({
    entityType: 'farmTask',
    tableName: 'tasks',
    operation: 'CREATE',
    invalidateKeys: [
      ['tasks'],
      ['tasks', { farmId }],
    ],
  });
}

export function useUpdateTask(farmId: string, id: string) {
  return useOfflineMutation<FarmTask, Partial<FarmTask> & { id: string }>({
    entityType: 'farmTask',
    tableName: 'tasks',
    operation: 'UPDATE',
    invalidateKeys: [
      ['tasks'],
      ['tasks', id],
      ['tasks', { farmId }],
    ],
  });
}

export function useDeleteTask(farmId: string) {
  return useOfflineMutation<FarmTask, { id: string }>({
    entityType: 'farmTask',
    tableName: 'tasks',
    operation: 'DELETE',
    invalidateKeys: [
      ['tasks'],
      ['tasks', { farmId }],
    ],
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { TaskComment, TaskChecklist, TaskAttachment, TaskHistory } from '@/types/task';

export function useTaskComments(taskId: string) {
  return useQuery<TaskComment[], Error>({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/comments`);
      return res.data.data || [];
    },
    enabled: !!taskId,
  });
}

export function useAddTaskComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskComment, Error, string>({
    mutationFn: async (commentText) => {
      const res = await apiClient.post(`/tasks/${taskId}/comments`, commentText, {
        headers: { 'Content-Type': 'text/plain' },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
    },
  });
}

export function useTaskChecklist(taskId: string) {
  return useQuery<TaskChecklist[], Error>({
    queryKey: ['tasks', taskId, 'checklist'],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/checklist`);
      return res.data.data || [];
    },
    enabled: !!taskId,
  });
}

export function useAddTaskChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskChecklist, Error, string>({
    mutationFn: async (itemName) => {
      const res = await apiClient.post(`/tasks/${taskId}/checklist`, null, {
        params: { itemName },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] });
    },
  });
}

export function useToggleTaskChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskChecklist, Error, string>({
    mutationFn: async (itemId) => {
      const res = await apiClient.put(`/tasks/${taskId}/checklist/${itemId}/toggle`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] });
    },
  });
}

export function useDeleteTaskChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (itemId) => {
      await apiClient.delete(`/tasks/${taskId}/checklist/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'checklist'] });
    },
  });
}

export function useTaskAttachments(taskId: string) {
  return useQuery<TaskAttachment[], Error>({
    queryKey: ['tasks', taskId, 'attachments'],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/attachments`);
      return res.data.data || [];
    },
    enabled: !!taskId,
  });
}

export function useAddTaskAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskAttachment, Error, { url: string; fileName: string }>({
    mutationFn: async ({ url, fileName }) => {
      const res = await apiClient.post(`/tasks/${taskId}/attachments`, null, {
        params: { url, fileName },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'attachments'] });
    },
  });
}

export function useTaskHistory(taskId: string) {
  return useQuery<TaskHistory[], Error>({
    queryKey: ['tasks', taskId, 'history'],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/history`);
      return res.data.data || [];
    },
    enabled: !!taskId,
  });
}
