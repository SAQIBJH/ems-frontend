import { apiClient } from '@/lib/api-client';
import type {
  Worker,
  WorkerClassification,
  ContractorInvoice,
  ContractorInvoiceInput,
  ContractorInvoiceStatus,
  CostGroupBy,
  CostSummary,
} from '../types/payroll.types';

export const workersApi = {
  listWorkers: async (classification?: WorkerClassification): Promise<Worker[]> => {
    const { data } = await apiClient.get<{ data: Worker[] }>('/payroll/workers', {
      params: classification ? { classification } : undefined,
    });
    return data.data;
  },

  updateClassification: async (
    id: string,
    classification: WorkerClassification,
  ): Promise<Worker> => {
    const { data } = await apiClient.patch<{ data: Worker }>(`/payroll/workers/${id}`, {
      classification,
    });
    return data.data;
  },

  listInvoices: async (params?: {
    workerId?: string;
    status?: ContractorInvoiceStatus;
  }): Promise<ContractorInvoice[]> => {
    const { data } = await apiClient.get<{ data: ContractorInvoice[] }>(
      '/payroll/contractor-invoices',
      { params },
    );
    return data.data;
  },

  createInvoice: async (input: ContractorInvoiceInput): Promise<ContractorInvoice> => {
    const { data } = await apiClient.post<{ data: ContractorInvoice }>(
      '/payroll/contractor-invoices',
      input,
    );
    return data.data;
  },

  decideInvoice: async (
    id: string,
    body: { status: ContractorInvoiceStatus; payoutRef?: string },
  ): Promise<ContractorInvoice> => {
    const { data } = await apiClient.patch<{ data: ContractorInvoice }>(
      `/payroll/contractor-invoices/${id}`,
      body,
    );
    return data.data;
  },

  getCostSummary: async (groupBy: CostGroupBy): Promise<CostSummary> => {
    const { data } = await apiClient.get<{ data: CostSummary }>('/payroll/cost-summary', {
      params: { groupBy },
    });
    return data.data;
  },
};
