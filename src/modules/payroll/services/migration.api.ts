import { apiClient } from '@/lib/api-client';
import type {
  PayCalendar,
  PayCalendarInput,
  OpeningBalance,
  OpeningBalanceInput,
  HistoricalPayslipImportRow,
  HistoricalPayslipImportResult,
  ParallelReconcileInput,
  ParallelReconcileResult,
  MigrationStatus,
  MigrationStatusInput,
} from '../types/payroll.types';

export const payrollMigrationApi = {
  /* ── Pay calendars ──────────────────────────────────────────────────────── */

  listPayCalendars: async (): Promise<PayCalendar[]> => {
    const { data } = await apiClient.get<{ data: PayCalendar[] }>('/payroll/pay-calendars');
    return data.data;
  },

  createPayCalendar: async (input: PayCalendarInput): Promise<PayCalendar> => {
    const { data } = await apiClient.post<{ data: PayCalendar }>('/payroll/pay-calendars', input);
    return data.data;
  },

  updatePayCalendar: async (id: string, input: Partial<PayCalendarInput>): Promise<PayCalendar> => {
    const { data } = await apiClient.patch<{ data: PayCalendar }>(
      `/payroll/pay-calendars/${id}`,
      input,
    );
    return data.data;
  },

  /* ── Opening YTD balances ───────────────────────────────────────────────── */

  listOpeningBalances: async (): Promise<OpeningBalance[]> => {
    const { data } = await apiClient.get<{ data: OpeningBalance[] }>('/payroll/opening-balances');
    return data.data;
  },

  saveOpeningBalance: async (
    employeeId: string,
    input: OpeningBalanceInput,
  ): Promise<OpeningBalance> => {
    const { data } = await apiClient.post<{ data: OpeningBalance }>(
      `/payroll/employees/${employeeId}/opening-balances`,
      input,
    );
    return data.data;
  },

  /* ── Historical payslips ────────────────────────────────────────────────── */

  listHistoricalPayslips: async (): Promise<{
    count: number;
    rows: HistoricalPayslipImportRow[];
  }> => {
    const { data } = await apiClient.get<{
      data: { count: number; rows: HistoricalPayslipImportRow[] };
    }>('/payroll/migration/historical-payslips');
    return data.data;
  },

  importHistoricalPayslips: async (
    rows: HistoricalPayslipImportRow[],
  ): Promise<HistoricalPayslipImportResult> => {
    const { data } = await apiClient.post<{ data: HistoricalPayslipImportResult }>(
      '/payroll/migration/historical-payslips',
      { rows },
    );
    return data.data;
  },

  /* ── Parallel run reconcile ─────────────────────────────────────────────── */

  parallelReconcile: async (
    runId: string,
    input: ParallelReconcileInput,
  ): Promise<ParallelReconcileResult> => {
    const { data } = await apiClient.post<{ data: ParallelReconcileResult }>(
      `/payroll/runs/${runId}/parallel-reconcile`,
      input,
    );
    return data.data;
  },

  /* ── Migration status (sandbox + go-live) ───────────────────────────────── */

  getMigrationStatus: async (): Promise<MigrationStatus> => {
    const { data } = await apiClient.get<{ data: MigrationStatus }>('/payroll/migration/status');
    return data.data;
  },

  updateMigrationStatus: async (input: MigrationStatusInput): Promise<MigrationStatus> => {
    const { data } = await apiClient.patch<{ data: MigrationStatus }>(
      '/payroll/migration/status',
      input,
    );
    return data.data;
  },
};
