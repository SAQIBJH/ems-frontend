import { apiClient } from '@/lib/api-client';
import type { TaxFormDocument, TaxFormType } from '../types/payroll.types';

export const taxFormsApi = {
  get: async (employeeId: string, type: TaxFormType, fy?: string): Promise<TaxFormDocument> => {
    const { data } = await apiClient.get<{ data: TaxFormDocument }>(
      `/payroll/employees/${employeeId}/tax-form`,
      { params: { type, ...(fy ? { fy } : {}) } },
    );
    return data.data;
  },
};
