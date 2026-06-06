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
  RunVariance,
  PayrollRunAuditEntry,
  RunDryRunResult,
  PaymentBatch,
  BankFileFormat,
  PayrollEvent,
  PayrollEventCatalogEntry,
  JournalDocument,
  JournalExportFormat,
  StatutoryReturnType,
  PayrollRegister,
  PayrollRegisterType,
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

  approveLevel: async (
    id: string,
    level: number,
    body: { approver: string; notes?: string },
  ): Promise<PayrollRun> => {
    const { data } = await apiClient.post<{ data: PayrollRun }>(
      `/payroll/runs/${id}/approvals/${level}`,
      body,
    );
    return data.data;
  },

  dryRun: async (id: string): Promise<RunDryRunResult> => {
    const { data } = await apiClient.post<{ data: RunDryRunResult }>(
      `/payroll/runs/${id}/calculate?dryRun=true`,
      {},
    );
    return data.data;
  },

  getVariance: async (id: string): Promise<RunVariance> => {
    const { data } = await apiClient.get<{ data: RunVariance }>(`/payroll/runs/${id}/variance`);
    return data.data;
  },

  getAudit: async (id: string): Promise<PayrollRunAuditEntry[]> => {
    const { data } = await apiClient.get<{ data: PayrollRunAuditEntry[] }>(
      `/payroll/runs/${id}/audit`,
    );
    return data.data;
  },

  reprocessPayslip: async (id: string, payslipId: string, actor: string): Promise<Payslip> => {
    const { data } = await apiClient.post<{ data: Payslip }>(
      `/payroll/runs/${id}/payslips/${payslipId}/recalculate`,
      { actor },
    );
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

  /* ── Disbursement (§9) ──────────────────────────────────────────────────── */

  getPaymentBatch: async (runId: string): Promise<PaymentBatch | null> => {
    const { data } = await apiClient.get<{ data: PaymentBatch | null }>(
      `/payroll/runs/${runId}/payment-batch`,
    );
    return data.data;
  },

  createPaymentBatch: async (runId: string): Promise<PaymentBatch> => {
    const { data } = await apiClient.post<{ data: PaymentBatch }>(
      `/payroll/runs/${runId}/payment-batch`,
      {},
    );
    return data.data;
  },

  downloadBankFile: async (runId: string, format: BankFileFormat): Promise<Blob> => {
    const response = await apiClient.get(`/payroll/runs/${runId}/bank-file`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getBatchStatus: async (batchId: string): Promise<PaymentBatch> => {
    const { data } = await apiClient.get<{ data: PaymentBatch }>(
      `/payroll/payment-batches/${batchId}/status`,
    );
    return data.data;
  },

  reconcileBatch: async (batchId: string): Promise<PaymentBatch> => {
    const { data } = await apiClient.post<{ data: PaymentBatch }>(
      `/payroll/payment-batches/${batchId}/reconcile`,
      {},
    );
    return data.data;
  },

  /* ── Publish & events (§10, §20) ────────────────────────────────────────── */

  publish: async (runId: string): Promise<PayrollRun> => {
    const { data } = await apiClient.post<{ data: PayrollRun }>(
      `/payroll/runs/${runId}/publish`,
      {},
    );
    return data.data;
  },

  listEvents: async (runId?: string): Promise<PayrollEvent[]> => {
    const { data } = await apiClient.get<{ data: PayrollEvent[] }>('/payroll/events', {
      params: runId ? { runId } : undefined,
    });
    return data.data;
  },

  getEventCatalogue: async (): Promise<PayrollEventCatalogEntry[]> => {
    const { data } = await apiClient.get<{ data: PayrollEventCatalogEntry[] }>(
      '/payroll/event-catalogue',
    );
    return data.data;
  },

  /* ── Accounting journal (§11) ───────────────────────────────────────────── */

  getJournal: async (runId: string): Promise<JournalDocument> => {
    const { data } = await apiClient.get<{ data: JournalDocument }>(
      `/payroll/runs/${runId}/journal`,
    );
    return data.data;
  },

  exportJournal: async (runId: string, format: JournalExportFormat): Promise<Blob> => {
    const response = await apiClient.get(`/payroll/runs/${runId}/journal/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /* ── Statutory filing & registers (§12) ─────────────────────────────────── */

  exportStatutoryReturn: async (runId: string, type: StatutoryReturnType): Promise<Blob> => {
    const response = await apiClient.get(`/payroll/runs/${runId}/statutory-return`, {
      params: { type },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getRegister: async (runId: string, type: PayrollRegisterType): Promise<PayrollRegister> => {
    const { data } = await apiClient.get<{ data: PayrollRegister }>(
      `/payroll/runs/${runId}/register`,
      { params: { type } },
    );
    return data.data;
  },

  exportRegister: async (runId: string, type: PayrollRegisterType): Promise<Blob> => {
    const response = await apiClient.get(`/payroll/runs/${runId}/register/export`, {
      params: { type },
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
