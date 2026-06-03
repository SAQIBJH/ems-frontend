import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../services/assets.api';
import type { AssetsParams, RequestsParams, AddAssetInput } from '../types/assets.types';

export const ASSETS_KEYS = {
  summary: ['assets', 'summary'] as const,
  assets: (params?: AssetsParams) => ['assets', 'list', params] as const,
  requests: (params?: RequestsParams) => ['assets', 'requests', params] as const,
};

export function useAssetsSummary() {
  return useQuery({
    queryKey: ASSETS_KEYS.summary,
    queryFn: () => assetsApi.getSummary(),
  });
}

export function useAssets(params?: AssetsParams) {
  return useQuery({
    queryKey: ASSETS_KEYS.assets(params),
    queryFn: () => assetsApi.getAssets(params),
  });
}

export function useAssetRequests(params?: RequestsParams) {
  return useQuery({
    queryKey: ASSETS_KEYS.requests(params),
    queryFn: () => assetsApi.getRequests(params),
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetsApi.approveRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assets', 'requests'] });
    },
  });
}

export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      assetsApi.declineRequest(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assets', 'requests'] });
    },
  });
}

export function useAddAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddAssetInput) => assetsApi.addAsset(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assets', 'list'] });
      void qc.invalidateQueries({ queryKey: ['assets', 'summary'] });
    },
  });
}
