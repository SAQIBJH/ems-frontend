import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  timesheetsApi,
  type TimeEntryInput,
  type TimeEntryPatch,
} from '../services/timesheets.api';
import type {
  TimeEntry,
  Timesheet,
  TimesheetSettingsInput,
  TimesheetSummaryRange,
} from '../types/timesheet.types';
import { TIMESHEET_KEYS } from './useProjects';

/** The week's timesheet (synthesized DRAFT when none exists yet). */
export function useWeekTimesheet(week: string, employeeId?: string) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.week(week, employeeId),
    queryFn: () => timesheetsApi.getWeek(week, employeeId),
    enabled: !!week,
  });
}

/** Convenience selector — the entries within the week's timesheet. */
export function useTimeEntries(week: string, employeeId?: string) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.week(week, employeeId),
    queryFn: () => timesheetsApi.getWeek(week, employeeId),
    enabled: !!week,
    select: (ts) => ts.entries,
  });
}

/**
 * Create or update a time entry. When `id` is present it PATCHes; otherwise it
 * POSTs a new entry. Invalidates the owning week so totals/overtime recompute.
 */
export function useUpsertTimeEntry(week: string, employeeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id?: string; input: TimeEntryInput }): Promise<TimeEntry> =>
      vars.id
        ? timesheetsApi.updateEntry(vars.id, vars.input as TimeEntryPatch)
        : timesheetsApi.createEntry(vars.input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.week(week, employeeId) }),
  });
}

export function useDeleteTimeEntry(week: string, employeeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timesheetsApi.deleteEntry(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.week(week, employeeId) }),
  });
}

/** Submit the current week for approval (DRAFT/REJECTED → SUBMITTED). */
export function useSubmitTimesheet(week: string, employeeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timesheetsApi.submit(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.week(week, employeeId) });
      void qc.invalidateQueries({ queryKey: ['timesheets', 'approvals'] });
    },
  });
}

/** The approval queue (submitted weeks awaiting a decision). */
export function useTimesheetApprovals(status: Timesheet['status'] = 'SUBMITTED') {
  return useQuery({
    queryKey: TIMESHEET_KEYS.approvals(status),
    queryFn: () => timesheetsApi.listApprovals(status),
  });
}

export function useApproveTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      timesheetsApi.approve(id, comment),
    onSuccess: (ts) => {
      void qc.invalidateQueries({ queryKey: ['timesheets', 'approvals'] });
      void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.week(ts.weekStart, ts.employeeId) });
    },
  });
}

export function useRejectTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      timesheetsApi.reject(id, comment),
    onSuccess: (ts) => {
      void qc.invalidateQueries({ queryKey: ['timesheets', 'approvals'] });
      void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.week(ts.weekStart, ts.employeeId) });
    },
  });
}

/** Utilization summary over a range (defaults to all employees). */
export function useTimesheetSummary(range: TimesheetSummaryRange = '30d', employeeId?: string) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.summary(range, employeeId),
    queryFn: () => timesheetsApi.getSummary(range, employeeId),
  });
}

/** Tenant timesheet settings (standard hours, overtime, rounding, policies). */
export function useTimesheetSettings() {
  return useQuery({
    queryKey: TIMESHEET_KEYS.settings,
    queryFn: () => timesheetsApi.getSettings(),
  });
}

export function useUpdateTimesheetSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: TimesheetSettingsInput) => timesheetsApi.updateSettings(patch),
    onSuccess: (data) => qc.setQueryData(TIMESHEET_KEYS.settings, data),
  });
}
