import { apiClient } from '@/lib/api-client';
import type { SalaryComponent, SalaryComponentInput } from '../types/payroll.types';

export const payrollComponentsApi = {
  list: async (params?: { active?: boolean }): Promise<SalaryComponent[]> => {
    const { data } = await apiClient.get<{ data: SalaryComponent[] }>('/payroll/components', {
      params,
    });
    return data.data;
  },

  create: async (input: SalaryComponentInput): Promise<SalaryComponent> => {
    const { data } = await apiClient.post<{ data: SalaryComponent }>('/payroll/components', input);
    return data.data;
  },

  update: async ({
    id,
    ...body
  }: { id: string } & Partial<SalaryComponentInput>): Promise<SalaryComponent> => {
    const { data } = await apiClient.patch<{ data: SalaryComponent }>(
      `/payroll/components/${id}`,
      body,
    );
    return data.data;
  },

  remove: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ data: { deleted: boolean } }>(
      `/payroll/components/${id}`,
    );
    return data.data;
  },
};
