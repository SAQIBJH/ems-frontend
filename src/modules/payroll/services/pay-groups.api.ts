import { apiClient } from '@/lib/api-client';
import type { PayGroup, PayGroupInput, PayScheduleRecord } from '../types/payroll.types';

export const payGroupsApi = {
  list: async (): Promise<PayGroup[]> => {
    const { data } = await apiClient.get<{ data: PayGroup[] }>('/payroll/groups');
    return data.data;
  },

  create: async (input: PayGroupInput): Promise<PayGroup> => {
    const { data } = await apiClient.post<{ data: PayGroup }>('/payroll/groups', input);
    return data.data;
  },

  update: async ({ id, ...body }: { id: string } & Partial<PayGroupInput>): Promise<PayGroup> => {
    const { data } = await apiClient.patch<{ data: PayGroup }>(`/payroll/groups/${id}`, body);
    return data.data;
  },

  remove: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ data: { deleted: boolean } }>(
      `/payroll/groups/${id}`,
    );
    return data.data;
  },

  listSchedules: async (): Promise<PayScheduleRecord[]> => {
    const { data } = await apiClient.get<{ data: PayScheduleRecord[] }>('/payroll/schedules');
    return data.data;
  },
};
