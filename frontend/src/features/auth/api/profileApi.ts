import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role?: string;
  preferredLanguage?: string;
  profilePhotoUrl?: string;
  createdAt: string;
}

export function useProfile() {
  return useQuery<UserProfile, Error>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>('/users/me');
      return response.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, Partial<UserProfile>>({
    mutationFn: async (data) => {
      const response = await apiClient.put<UserProfile>('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', 'me'], data);
    },
  });
}

export function useMyFarmRoles() {
  return useQuery<any[], Error>({
    queryKey: ['profile', 'me', 'roles'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/users/me/roles');
      return response.data;
    },
  });
}

