import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollComponentsApi } from '../services/payroll-components.api';
import type { SalaryComponentInput } from '../types/payroll.types';

export const COMPONENTS_KEY = ['payroll', 'components'] as const;

export function usePayrollComponents(params?: { active?: boolean }) {
  return useQuery({
    queryKey: [...COMPONENTS_KEY, params],
    queryFn: () => payrollComponentsApi.list(params),
  });
}

export function useCreateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryComponentInput) => payrollComponentsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPONENTS_KEY }),
  });
}

export function useUpdateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string } & Partial<SalaryComponentInput>) =>
      payrollComponentsApi.update(args),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPONENTS_KEY }),
  });
}

export function useDeleteComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollComponentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMPONENTS_KEY }),
  });
}
