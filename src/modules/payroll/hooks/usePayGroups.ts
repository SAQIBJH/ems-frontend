import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payGroupsApi } from '../services/pay-groups.api';
import type { PayGroupInput } from '../types/payroll.types';

export const PAY_GROUPS_KEY = ['payroll', 'groups'] as const;
export const PAY_SCHEDULES_KEY = ['payroll', 'schedules'] as const;

export function usePayGroups() {
  return useQuery({
    queryKey: PAY_GROUPS_KEY,
    queryFn: () => payGroupsApi.list(),
  });
}

export function usePaySchedules() {
  return useQuery({
    queryKey: PAY_SCHEDULES_KEY,
    queryFn: () => payGroupsApi.listSchedules(),
  });
}

export function useCreatePayGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayGroupInput) => payGroupsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAY_GROUPS_KEY }),
  });
}

export function useUpdatePayGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string } & Partial<PayGroupInput>) => payGroupsApi.update(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAY_GROUPS_KEY }),
  });
}

export function useDeletePayGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payGroupsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAY_GROUPS_KEY }),
  });
}
