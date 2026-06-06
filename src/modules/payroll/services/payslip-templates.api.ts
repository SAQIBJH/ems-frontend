import { apiClient } from '@/lib/api-client';
import type { PayslipTemplate, PayslipTemplateInput } from '../types/payroll.types';

export const payslipTemplatesApi = {
  get: async (): Promise<PayslipTemplate> => {
    const { data } = await apiClient.get<{ data: PayslipTemplate }>('/payroll/payslip-templates');
    return data.data;
  },

  update: async (body: PayslipTemplateInput): Promise<PayslipTemplate> => {
    const { data } = await apiClient.patch<{ data: PayslipTemplate }>(
      '/payroll/payslip-templates',
      body,
    );
    return data.data;
  },
};
