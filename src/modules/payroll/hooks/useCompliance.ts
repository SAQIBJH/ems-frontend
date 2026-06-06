import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollComplianceApi } from '../services/compliance.api';
import type { PayEquityGroupBy, DataPolicyInput } from '../types/payroll.types';

const COMPLIANCE_KEY = ['payroll', 'compliance'] as const;

export function usePayEquityReport(groupBy: PayEquityGroupBy) {
  return useQuery({
    queryKey: [...COMPLIANCE_KEY, 'pay-equity', groupBy],
    queryFn: () => payrollComplianceApi.getPayEquity(groupBy),
  });
}

export function useDataPolicy() {
  return useQuery({
    queryKey: [...COMPLIANCE_KEY, 'data-policy'],
    queryFn: () => payrollComplianceApi.getDataPolicy(),
  });
}

export function useUpdateDataPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DataPolicyInput) => payrollComplianceApi.updateDataPolicy(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...COMPLIANCE_KEY, 'data-policy'] }),
  });
}
