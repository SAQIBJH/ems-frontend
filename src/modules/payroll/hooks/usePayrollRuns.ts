import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollRunsApi } from '../services/payroll-runs.api';
import type {
  PayrollInput,
  PayrollRunInput,
  PayrollRunsParams,
  PayslipOneTime,
} from '../types/payroll.types';

export const RUNS_KEY = ['payroll', 'runs'] as const;

export function usePayrollRuns(params?: PayrollRunsParams) {
  return useQuery({
    queryKey: [...RUNS_KEY, params],
    queryFn: () => payrollRunsApi.list(params),
  });
}

export function usePayrollRun(id: string | null) {
  return useQuery({
    queryKey: [...RUNS_KEY, id],
    queryFn: () => payrollRunsApi.get(id!),
    enabled: !!id,
  });
}

export function useRunPayslips(
  runId: string | null,
  params?: { page?: number; limit?: number; departmentId?: string; search?: string },
) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'payslips', params],
    queryFn: () => payrollRunsApi.listPayslips(runId!, params),
    enabled: !!runId,
  });
}

export function useRunPayslip(runId: string | null, payslipId: string | null) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'payslips', payslipId],
    queryFn: () => payrollRunsApi.getPayslip(runId!, payslipId!),
    enabled: !!(runId && payslipId),
  });
}

export function useInitiatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayrollRunInput) => payrollRunsApi.initiate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: RUNS_KEY }),
  });
}

export function useCalculatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollRunsApi.calculate(id),
    onSuccess: (_data, id) => qc.invalidateQueries({ queryKey: [...RUNS_KEY, id] }),
  });
}

export function useApprovePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      payrollRunsApi.approve(id, notes),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: [...RUNS_KEY, id] }),
  });
}

export function useApproveRunLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      level,
      approver,
      notes,
    }: {
      id: string;
      level: number;
      approver: string;
      notes?: string;
    }) => payrollRunsApi.approveLevel(id, level, { approver, notes }),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: [...RUNS_KEY, id] }),
  });
}

export function useRunVariance(runId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'variance'],
    queryFn: () => payrollRunsApi.getVariance(runId!),
    enabled: !!runId && enabled,
  });
}

export function useRunAudit(runId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'audit'],
    queryFn: () => payrollRunsApi.getAudit(runId!),
    enabled: !!runId && enabled,
  });
}

export function useDryRunPayrollRun() {
  return useMutation({
    mutationFn: (id: string) => payrollRunsApi.dryRun(id),
  });
}

export function useReprocessPayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payslipId, actor }: { id: string; payslipId: string; actor: string }) =>
      payrollRunsApi.reprocessPayslip(id, payslipId, actor),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: [...RUNS_KEY, id, 'payslips'] }),
  });
}

export function useMarkPaidPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      paidAt,
      paymentReference,
    }: {
      id: string;
      paidAt: string;
      paymentReference: string;
    }) => payrollRunsApi.markPaid(id, { paidAt, paymentReference }),
    onSuccess: (_data, { id }) => qc.invalidateQueries({ queryKey: [...RUNS_KEY, id] }),
  });
}

export function useRunFnf(runId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'fnf'],
    queryFn: () => payrollRunsApi.getFnf(runId!),
    enabled: !!runId && enabled,
  });
}

/* ── Disbursement (§9) ──────────────────────────────────────────────────────── */

export function useRunPaymentBatch(runId: string | null) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'payment-batch'],
    queryFn: () => payrollRunsApi.getPaymentBatch(runId!),
    enabled: !!runId,
  });
}

export function useCreatePaymentBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => payrollRunsApi.createPaymentBatch(runId),
    onSuccess: (_data, runId) =>
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, runId, 'payment-batch'] }),
  });
}

export function useReconcilePaymentBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId }: { runId: string; batchId: string }) =>
      payrollRunsApi.reconcileBatch(batchId),
    onSuccess: (_data, { runId }) =>
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, runId, 'payment-batch'] }),
  });
}

/* ── Publish & events (§10, §20) ─────────────────────────────────────────────── */

export function usePublishPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollRunsApi.publish(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, id] });
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, id, 'events'] });
    },
  });
}

export function useRunEvents(runId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'events'],
    queryFn: () => payrollRunsApi.listEvents(runId!),
    enabled: !!runId && enabled,
  });
}

export function useEventCatalogue() {
  return useQuery({
    queryKey: ['payroll', 'event-catalogue'] as const,
    queryFn: () => payrollRunsApi.getEventCatalogue(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useRunJournal(runId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'journal'],
    queryFn: () => payrollRunsApi.getJournal(runId!),
    enabled: !!runId && enabled,
  });
}

export function usePayrollRoster() {
  return useQuery({
    queryKey: ['payroll', 'roster'] as const,
    queryFn: () => payrollRunsApi.listRoster(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useRunInputs(runId: string | null) {
  return useQuery({
    queryKey: [...RUNS_KEY, runId, 'inputs'],
    queryFn: () => payrollRunsApi.listInputs(runId!),
    enabled: !!runId,
  });
}

export function useUpdateRunInput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      employeeId,
      body,
    }: {
      runId: string;
      employeeId: string;
      body: Partial<PayrollInput>;
    }) => payrollRunsApi.updateInput(runId, employeeId, body),
    onSuccess: (_data, { runId }) =>
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, runId, 'inputs'] }),
  });
}

export function useImportRunInputs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, csv }: { runId: string; csv: string }) =>
      payrollRunsApi.importInputs(runId, csv),
    onSuccess: (_data, { runId }) =>
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, runId, 'inputs'] }),
  });
}

export function useAdjustPayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      payslipId,
      body,
    }: {
      runId: string;
      payslipId: string;
      body: {
        oneTimeAdditions?: PayslipOneTime[];
        oneTimeDeductions?: PayslipOneTime[];
        notes?: string;
      };
    }) => payrollRunsApi.adjustPayslip(runId, payslipId, body),
    onSuccess: (_data, { runId }) =>
      qc.invalidateQueries({ queryKey: [...RUNS_KEY, runId, 'payslips'] }),
  });
}
