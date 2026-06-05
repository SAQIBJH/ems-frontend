import { apiClient } from '@/lib/api-client';
import type {
  PayrollRun,
  PayrollRunInput,
  PayrollRunsPage,
  PayrollRunsParams,
  PayslipRunPage,
  Payslip,
  PayslipOneTime,
  PayrollInput,
  PayrollInputsPage,
  PayrollInputImportResult,
  FnfSettlement,
  RosterMember,
} from '../types/payroll.types';

export const payrollRunsApi = {
  list: async (params?: PayrollRunsParams): Promise<PayrollRunsPage> => {
    const { data } = await apiClient.get<{ data: PayrollRunsPage }>('/payroll/runs', { params });
    return data.data;
  },

  get: async (id: string): Promise<PayrollRun> => {
    const { data } = await apiClient.get<{ data: PayrollRun }>(`/payroll/runs/${id}`);
    return data.data;
  },

  initiate: async (input: PayrollRunInput): Promise<PayrollRun> => {
    const { data } = await apiClient.post<{ data: PayrollRun }>('/payroll/runs', input);
    return data.data;
  },

  calculate: async (id: string): Promise<{ status: string; estimatedSeconds: number }> => {
    const { data } = await apiClient.post<{ data: { status: string; estimatedSeconds: number } }>(
      `/payroll/runs/${id}/calculate`,
      {},
    );
    return data.data;
  },

  approve: async (id: string, notes?: string): Promise<PayrollRun> => {
    const { data } = await apiClient.post<{ data: PayrollRun }>(`/payroll/runs/${id}/approve`, {
      notes,
    });
    return data.data;
  },

  markPaid: async (
    id: string,
    body: { paidAt: string; paymentReference: string },
  ): Promise<PayrollRun> => {
    const { data } = await apiClient.patch<{ data: PayrollRun }>(
      `/payroll/runs/${id}/mark-paid`,
      body,
    );
    return data.data;
  },

  cancel: async (id: string, reason: string): Promise<PayrollRun> => {
    const { data } = await apiClient.post<{ data: PayrollRun }>(`/payroll/runs/${id}/cancel`, {
      reason,
    });
    return data.data;
  },

  listPayslips: async (
    runId: string,
    params?: { page?: number; limit?: number; departmentId?: string; search?: string },
  ): Promise<PayslipRunPage> => {
    const { data } = await apiClient.get<{ data: PayslipRunPage }>(
      `/payroll/runs/${runId}/payslips`,
      { params },
    );
    return data.data;
  },

  getPayslip: async (runId: string, payslipId: string): Promise<Payslip> => {
    const { data } = await apiClient.get<{ data: Payslip }>(
      `/payroll/runs/${runId}/payslips/${payslipId}`,
    );
    return data.data;
  },

  adjustPayslip: async (
    runId: string,
    payslipId: string,
    body: {
      oneTimeAdditions?: PayslipOneTime[];
      oneTimeDeductions?: PayslipOneTime[];
      notes?: string;
    },
  ): Promise<Payslip> => {
    const { data } = await apiClient.patch<{ data: Payslip }>(
      `/payroll/runs/${runId}/payslips/${payslipId}`,
      body,
    );
    return data.data;
  },

  exportCsv: async (runId: string): Promise<Blob> => {
    const response = await apiClient.get(`/payroll/runs/${runId}/export`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  listInputs: async (runId: string): Promise<PayrollInputsPage> => {
    const { data } = await apiClient.get<{ data: PayrollInputsPage }>(
      `/payroll/runs/${runId}/inputs`,
    );
    return data.data;
  },

  updateInput: async (
    runId: string,
    employeeId: string,
    body: Partial<PayrollInput>,
  ): Promise<PayrollInput> => {
    const { data } = await apiClient.patch<{ data: PayrollInput }>(
      `/payroll/runs/${runId}/inputs/${employeeId}`,
      body,
    );
    return data.data;
  },

  importInputs: async (runId: string, csv: string): Promise<PayrollInputImportResult> => {
    const { data } = await apiClient.post<{ data: PayrollInputImportResult }>(
      `/payroll/runs/${runId}/inputs/import`,
      { csv },
    );
    return data.data;
  },

  getFnf: async (runId: string): Promise<FnfSettlement> => {
    const { data } = await apiClient.get<{ data: FnfSettlement }>(`/payroll/runs/${runId}/fnf`);
    return data.data;
  },

  listRoster: async (): Promise<RosterMember[]> => {
    const { data } = await apiClient.get<{ data: RosterMember[] }>('/payroll/roster');
    return data.data;
  },
};
