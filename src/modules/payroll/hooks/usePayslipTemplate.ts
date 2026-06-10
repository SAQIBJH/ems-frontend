import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers';

import { payslipTemplatesApi } from '../services/payslip-templates.api';
import type { PayslipTemplateInput } from '../types/payroll.types';

const TEMPLATE_KEY = ['payroll', 'payslip-template'] as const;

export function usePayslipTemplate() {
  // `GET /payroll/payslip-templates` is HR_ADMIN/SUPER_ADMIN only. Self-service
  // payslip views (manager/employee) must not fetch it — it 403s and the payslip
  // renders from its own data with the default layout. Gate the query to elevated.
  const { user } = useAuth();
  const elevated = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';
  return useQuery({
    queryKey: TEMPLATE_KEY,
    queryFn: () => payslipTemplatesApi.get(),
    staleTime: 1000 * 60 * 5,
    enabled: elevated,
  });
}

export function useUpdatePayslipTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PayslipTemplateInput) => payslipTemplatesApi.update(body),
    onSuccess: (data) => qc.setQueryData(TEMPLATE_KEY, data),
  });
}
