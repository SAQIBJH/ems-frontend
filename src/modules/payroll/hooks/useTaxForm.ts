import { useQuery } from '@tanstack/react-query';
import { taxFormsApi } from '../services/tax-forms.api';
import type { TaxFormType } from '../types/payroll.types';

/** Generate (and cache) an employee's annual tax form. Enabled only when requested. */
export function useTaxForm(
  employeeId: string | null,
  type: TaxFormType,
  fy: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['payroll', 'tax-form', employeeId, type, fy] as const,
    queryFn: () => taxFormsApi.get(employeeId!, type, fy),
    enabled: !!employeeId && enabled,
  });
}
