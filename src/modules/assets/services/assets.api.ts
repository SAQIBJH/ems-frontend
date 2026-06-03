import { apiClient } from '@/lib/api-client';
import type {
  AssetsSummary,
  AssetsPage,
  Asset,
  RequestsPage,
  AddAssetInput,
  AssetsParams,
  RequestsParams,
} from '../types/assets.types';

export const assetsApi = {
  getSummary: async (): Promise<AssetsSummary> => {
    const { data } = await apiClient.get<{ data: AssetsSummary }>('/assets/summary');
    return data.data;
  },

  getAssets: async (params?: AssetsParams): Promise<AssetsPage> => {
    const { data } = await apiClient.get<{ data: AssetsPage }>('/assets', { params });
    return data.data;
  },

  getRequests: async (params?: RequestsParams): Promise<RequestsPage> => {
    const { data } = await apiClient.get<{ data: RequestsPage }>('/assets/requests', { params });
    return data.data;
  },

  approveRequest: async (id: string): Promise<{ id: string; status: string }> => {
    const { data } = await apiClient.patch<{ data: { id: string; status: string } }>(
      `/assets/requests/${id}/approve`,
      {},
    );
    return data.data;
  },

  declineRequest: async (id: string, reason?: string): Promise<{ id: string; status: string }> => {
    const { data } = await apiClient.patch<{ data: { id: string; status: string } }>(
      `/assets/requests/${id}/decline`,
      { reason },
    );
    return data.data;
  },

  addAsset: async (input: AddAssetInput): Promise<Asset> => {
    const { data } = await apiClient.post<{ data: Asset }>('/assets', input);
    return data.data;
  },
};
