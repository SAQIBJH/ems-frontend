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
