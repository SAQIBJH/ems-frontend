import { apiClient } from '@/lib/api-client';
import type { SearchResponse } from '../types/search.types';

export const searchApi = {
  search: async (q: string, limit = 8): Promise<SearchResponse> => {
    const { data } = await apiClient.get<{ success: boolean; data: SearchResponse }>('/search', {
      params: { q, limit },
    });
    return data.data;
  },
};
