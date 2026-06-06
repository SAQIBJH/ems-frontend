import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payslipTemplatesApi } from '../services/payslip-templates.api';
import type { PayslipTemplateInput } from '../types/payroll.types';

const TEMPLATE_KEY = ['payroll', 'payslip-template'] as const;

export function usePayslipTemplate() {
  return useQuery({
    queryKey: TEMPLATE_KEY,
    queryFn: () => payslipTemplatesApi.get(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdatePayslipTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PayslipTemplateInput) => payslipTemplatesApi.update(body),
    onSuccess: (data) => qc.setQueryData(TEMPLATE_KEY, data),
  });
}
