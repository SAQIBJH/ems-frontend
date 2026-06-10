import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { payslipTemplatesApi } from '../services/payslip-templates.api';
import type { PayslipTemplateInput } from '../types/payroll.types';

const TEMPLATE_KEY = ['payroll', 'payslip-template'] as const;

export function usePayslipTemplate() {
  // `GET /payroll/payslip-templates` is readable by all authenticated users
  // (BE-8 fixed 2026-06-10) so self-service payslip views (manager/employee) can
  // render with the configured layout. Previously this was gated to HR/SUPER to
  // avoid a 403.
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
