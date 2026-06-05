import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { garnishmentsApi } from '../services/garnishments.api';
import type { GarnishmentInput } from '../types/payroll.types';

export const GARNISHMENTS_KEY = ['payroll', 'garnishments'] as const;

export function useGarnishments(employeeId: string | null) {
  return useQuery({
    queryKey: [...GARNISHMENTS_KEY, employeeId],
    queryFn: () => garnishmentsApi.list(employeeId!),
    enabled: !!employeeId,
  });
}

export function useCreateGarnishment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: GarnishmentInput }) =>
      garnishmentsApi.create(employeeId, input),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: [...GARNISHMENTS_KEY, employeeId] }),
  });
}

export function useDeleteGarnishment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, garnishmentId }: { employeeId: string; garnishmentId: string }) =>
      garnishmentsApi.remove(employeeId, garnishmentId),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: [...GARNISHMENTS_KEY, employeeId] }),
  });
}
