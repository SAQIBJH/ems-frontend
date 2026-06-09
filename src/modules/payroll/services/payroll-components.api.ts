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
    // `code` is immutable on PATCH — the live backend rejects any body that
    // carries it with 400 CODE_IMMUTABLE (docs/API_MAPPING.md). Strip it so the
    // edit goes through; the stored code is preserved server-side either way.
    const payload = { ...body };
    delete (payload as Record<string, unknown>).code;
    const { data } = await apiClient.patch<{ data: SalaryComponent }>(
      `/payroll/components/${id}`,
      payload,
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
