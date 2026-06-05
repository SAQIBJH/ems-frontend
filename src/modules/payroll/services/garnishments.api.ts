import { apiClient } from '@/lib/api-client';
import type { Garnishment, GarnishmentInput } from '../types/payroll.types';

export const garnishmentsApi = {
  list: async (employeeId: string): Promise<Garnishment[]> => {
    const { data } = await apiClient.get<{ data: Garnishment[] }>(
      `/payroll/employees/${employeeId}/garnishments`,
    );
    return data.data;
  },

  create: async (employeeId: string, input: GarnishmentInput): Promise<Garnishment> => {
    const { data } = await apiClient.post<{ data: Garnishment }>(
      `/payroll/employees/${employeeId}/garnishments`,
      input,
    );
    return data.data;
  },

  remove: async (employeeId: string, garnishmentId: string): Promise<void> => {
    await apiClient.delete(`/payroll/employees/${employeeId}/garnishments/${garnishmentId}`);
  },
};
