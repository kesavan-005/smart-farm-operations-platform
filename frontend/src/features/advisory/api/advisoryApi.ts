import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse } from '@/types/api';
import type { AdvisoryRequest, AdvisoryResponse } from './types';

export function useGenerateAdvisory(farmId: string | null) {
  return useMutation({
    mutationFn: async (request: Omit<AdvisoryRequest, 'farmId'>) => {
      if (!farmId) {
        throw new Error('Farm context is required to generate advisory.');
      }

      const payload: AdvisoryRequest = {
        ...request,
        farmId,
      };

      const response = await apiClient.post<ApiResponse<AdvisoryResponse>>(
        `/farms/${farmId}/advisory`,
        payload
      );
      
      return response.data.data;
    },
  });
}
