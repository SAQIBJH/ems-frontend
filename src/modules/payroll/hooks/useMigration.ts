import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollMigrationApi } from '../services/migration.api';
import type {
  PayCalendarInput,
  OpeningBalanceInput,
  HistoricalPayslipImportRow,
  ParallelReconcileInput,
  MigrationStatusInput,
} from '../types/payroll.types';

const MIGRATION_KEY = ['payroll', 'migration'] as const;

/* ── Pay calendars ──────────────────────────────────────────────────────────── */

export function usePayCalendars() {
  return useQuery({
    queryKey: [...MIGRATION_KEY, 'pay-calendars'],
    queryFn: () => payrollMigrationApi.listPayCalendars(),
  });
}

/**
 * Pay cycles for a calendar across a month range. Disabled until a calendar id and
 * range are supplied (the run-create cycle picker enables it on demand).
 */
export function usePayCalendarCycles(
  calendarId: string | null,
  range: { from: string; to: string } | null,
) {
  return useQuery({
    queryKey: [...MIGRATION_KEY, 'pay-calendars', calendarId, 'cycles', range],
    queryFn: () => payrollMigrationApi.getPayCalendarCycles(calendarId!, range!),
    enabled: !!calendarId && !!range,
  });
}

export function useCreatePayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayCalendarInput) => payrollMigrationApi.createPayCalendar(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'pay-calendars'] }),
  });
}

export function useUpdatePayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PayCalendarInput> }) =>
      payrollMigrationApi.updatePayCalendar(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'pay-calendars'] }),
  });
}

/* ── Opening balances ───────────────────────────────────────────────────────── */

export function useOpeningBalances() {
  return useQuery({
    queryKey: [...MIGRATION_KEY, 'opening-balances'],
    queryFn: () => payrollMigrationApi.listOpeningBalances(),
  });
}

export function useSaveOpeningBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: OpeningBalanceInput }) =>
      payrollMigrationApi.saveOpeningBalance(employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'opening-balances'] });
      qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'status'] });
    },
  });
}

/* ── Historical payslips ────────────────────────────────────────────────────── */

export function useHistoricalPayslips() {
  return useQuery({
    queryKey: [...MIGRATION_KEY, 'historical-payslips'],
    queryFn: () => payrollMigrationApi.listHistoricalPayslips(),
  });
}

export function useImportHistoricalPayslips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: HistoricalPayslipImportRow[]) =>
      payrollMigrationApi.importHistoricalPayslips(rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'historical-payslips'] });
      qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'status'] });
    },
  });
}

/* ── Parallel reconcile ─────────────────────────────────────────────────────── */

export function useParallelReconcile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, input }: { runId: string; input: ParallelReconcileInput }) =>
      payrollMigrationApi.parallelReconcile(runId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'status'] }),
  });
}

/* ── Migration status ───────────────────────────────────────────────────────── */

export function useMigrationStatus() {
  return useQuery({
    queryKey: [...MIGRATION_KEY, 'status'],
    queryFn: () => payrollMigrationApi.getMigrationStatus(),
  });
}

export function useUpdateMigrationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MigrationStatusInput) => payrollMigrationApi.updateMigrationStatus(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...MIGRATION_KEY, 'status'] }),
  });
}
