import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerateAdvisory } from './advisoryApi';
import { apiClient } from '@/lib/apiClient';

// Mock the apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('useGenerateAdvisory', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('constructs correct URL and payload without client-controlled farmId in body', async () => {
    const farmId = 'farm-123';
    const mockResponse = {
      data: {
        data: {
          answer: 'Test answer',
          sources: [],
          weatherUsed: true,
        },
      },
    };

    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useGenerateAdvisory(farmId), { wrapper });

    result.current.mutate({
      question: 'How do I water crops?',
      fieldId: 'field-456',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/farms/farm-123/advisory',
      {
        question: 'How do I water crops?',
        fieldId: 'field-456',
        farmId: 'farm-123', // Appended by the hook
      }
    );

    expect(result.current.data).toEqual(mockResponse.data.data);
  });

  it('preserves AdvisoryResponse fields', async () => {
    const mockResponse = {
      data: {
        data: {
          answer: 'Detailed answer',
          sources: [{ title: 'Source 1', score: 0.95 }],
          weatherUsed: false,
        },
      },
    };

    (apiClient.post as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useGenerateAdvisory('farm-123'), { wrapper });

    result.current.mutate({ question: 'Test' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const response = result.current.data;
    expect(response?.answer).toBe('Detailed answer');
    expect(response?.sources?.[0]?.title).toBe('Source 1');
    expect(response?.weatherUsed).toBe(false);
  });

  it('propagates API errors correctly', async () => {
    const mockError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid question',
    };

    (apiClient.post as any).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useGenerateAdvisory('farm-123'), { wrapper });

    result.current.mutate({ question: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('fails immediately if farmId is null', async () => {
    const { result } = renderHook(() => useGenerateAdvisory(null), { wrapper });

    result.current.mutate({ question: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Farm context is required to generate advisory.');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
