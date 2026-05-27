import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollRunsApi } from '../services/payroll-runs.api';
import type { PayrollRunInput, PayrollRunsParams, PayslipOneTime } from '../types/payroll.types';

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
