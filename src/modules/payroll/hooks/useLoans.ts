import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../services/loans.api';
import type { LoanInput } from '../types/payroll.types';

export const LOANS_KEY = ['payroll', 'loans'] as const;

export function useEmployeeLoans(employeeId: string | null) {
  return useQuery({
    queryKey: [...LOANS_KEY, employeeId],
    queryFn: () => loansApi.list(employeeId!),
    enabled: !!employeeId,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: LoanInput }) =>
      loansApi.create(employeeId, input),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: [...LOANS_KEY, employeeId] }),
  });
}

export function useForecloseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, loanId }: { employeeId: string; loanId: string }) =>
      loansApi.foreclose(employeeId, loanId),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: [...LOANS_KEY, employeeId] }),
  });
}
