import { apiClient } from '@/lib/api-client';

import type {
  TimeEntry,
  TimeEntrySource,
  Timesheet,
  TimesheetSettings,
  TimesheetSettingsInput,
  TimesheetSummary,
  TimesheetSummaryRange,
} from '../types/timesheet.types';

/** Body for creating a time entry (self — employeeId is derived server-side). */
export interface TimeEntryInput {
  /** Monday of the target week (YYYY-MM-DD). */
  weekStart: string;
  projectId: string;
  taskId: string;
  /** Day the time is logged against (YYYY-MM-DD). */
  date: string;
  hours: number;
  billable?: boolean;
  note?: string;
  /** MANUAL (default) or TIMER when posted by the stop action of the timer. */
  source?: TimeEntrySource;
}

/** Patchable fields on an existing entry (the week it belongs to never changes). */
export type TimeEntryPatch = Partial<Omit<TimeEntryInput, 'weekStart'>>;

export const timesheetsApi = {
  /** Fetch (or synthesize an empty DRAFT for) the week's timesheet. */
  getWeek: async (week: string, employeeId?: string): Promise<Timesheet> => {
    const params = new URLSearchParams({ week });
    if (employeeId) params.set('employeeId', employeeId);
    const { data } = await apiClient.get<{ data: Timesheet }>(`/timesheets?${params.toString()}`);
    return data.data;
  },

  createEntry: async (input: TimeEntryInput): Promise<TimeEntry> => {
    const { data } = await apiClient.post<{ data: TimeEntry }>('/timesheets/entries', input);
    return data.data;
  },

  updateEntry: async (id: string, patch: TimeEntryPatch): Promise<TimeEntry> => {
    const { data } = await apiClient.patch<{ data: TimeEntry }>(`/timesheets/entries/${id}`, patch);
    return data.data;
  },

  deleteEntry: async (id: string): Promise<{ id: string }> => {
    const { data } = await apiClient.delete<{ data: { id: string } }>(`/timesheets/entries/${id}`);
    return data.data;
  },

  /** Submit a DRAFT/REJECTED week for approval → SUBMITTED. */
  submit: async (id: string): Promise<Timesheet> => {
    const { data } = await apiClient.post<{ data: Timesheet }>(`/timesheets/${id}/submit`);
    return data.data;
  },

  /** Approval queue — submitted weeks awaiting a decision. */
  listApprovals: async (status: Timesheet['status'] = 'SUBMITTED'): Promise<Timesheet[]> => {
    const { data } = await apiClient.get<{ data: Timesheet[] }>(
      `/timesheets/approvals?status=${status}`,
    );
    return data.data;
  },

  approve: async (id: string, comment?: string): Promise<Timesheet> => {
    const { data } = await apiClient.post<{ data: Timesheet }>(`/timesheets/${id}/approve`, {
      comment,
    });
    return data.data;
  },

  reject: async (id: string, comment: string): Promise<Timesheet> => {
    const { data } = await apiClient.post<{ data: Timesheet }>(`/timesheets/${id}/reject`, {
      comment,
    });
    return data.data;
  },

  /** Utilization summary over a range (defaults to all employees). */
  getSummary: async (
    range: TimesheetSummaryRange = '30d',
    employeeId?: string,
  ): Promise<TimesheetSummary> => {
    const params = new URLSearchParams({ range });
    if (employeeId) params.set('employeeId', employeeId);
    const { data } = await apiClient.get<{ data: TimesheetSummary }>(
      `/timesheets/summary?${params.toString()}`,
    );
    return data.data;
  },

  /** Tenant timesheet settings. */
  getSettings: async (): Promise<TimesheetSettings> => {
    const { data } = await apiClient.get<{ data: TimesheetSettings }>('/timesheets/settings');
    return data.data;
  },

  updateSettings: async (patch: TimesheetSettingsInput): Promise<TimesheetSettings> => {
    const { data } = await apiClient.patch<{ data: TimesheetSettings }>(
      '/timesheets/settings',
      patch,
    );
    return data.data;
  },
};
