import { apiClient } from '@/lib/api-client';
import type {
  PayEquityGroupBy,
  PayEquityReport,
  DataPolicy,
  DataPolicyInput,
} from '../types/payroll.types';

export const payrollComplianceApi = {
  getPayEquity: async (groupBy: PayEquityGroupBy): Promise<PayEquityReport> => {
    const { data } = await apiClient.get<{ data: PayEquityReport }>('/payroll/reports/pay-equity', {
      params: { groupBy },
    });
    return data.data;
  },

  downloadAuditPack: async (runId: string): Promise<Blob> => {
    const response = await apiClient.get('/payroll/reports/audit-pack', {
      params: { runId },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getDataPolicy: async (): Promise<DataPolicy> => {
    const { data } = await apiClient.get<{ data: DataPolicy }>('/payroll/settings/data-policy');
    return data.data;
  },

  updateDataPolicy: async (input: DataPolicyInput): Promise<DataPolicy> => {
    const { data } = await apiClient.patch<{ data: DataPolicy }>(
      '/payroll/settings/data-policy',
      input,
    );
    return data.data;
  },
};
