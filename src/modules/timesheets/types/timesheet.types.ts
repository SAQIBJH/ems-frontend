/* ── Timesheets domain types (§27) ─────────────────────────────────────────────
 * MSW-backed, camelCase. Hours are decimal numbers (e.g. 7.5); dates YYYY-MM-DD;
 * a week is identified by its Monday (weekStart). Distinct from Attendance.
 */

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
  status: ProjectStatus;
  billable: boolean;
  /** Default billable rate (major units of the tenant currency); 0 = unset. */
  defaultRate: number;
  /** Employee ids who can log against this project ([] = everyone). */
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  code: string;
  clientName: string;
  billable: boolean;
  defaultRate: number;
  status?: ProjectStatus;
  memberIds?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  billable: boolean;
  active: boolean;
}

export interface TaskInput {
  name: string;
  billable: boolean;
  active?: boolean;
}

/* ── Time entries & weekly timesheet (built from Step T2) ─────────────────────── */

export type TimeEntrySource = 'MANUAL' | 'TIMER';

export interface TimeEntry {
  id: string;
  timesheetId: string;
  employeeId: string;
  projectId: string;
  taskId: string;
  /** YYYY-MM-DD. */
  date: string;
  hours: number;
  billable: boolean;
  note: string;
  source: TimeEntrySource;
}

export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  weekEnd: string;
  status: TimesheetStatus;
  totalHours: number;
  billableHours: number;
  /** max(0, totalHours − standardHours) — what Step T6 imports to payroll. */
  overtimeHours: number;
  standardHours: number;
  submittedAt: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  comment: string | null;
  entries: TimeEntry[];
}

/* ── Settings (Step T7) ───────────────────────────────────────────────────────── */

/** Shortfall handling: IGNORE = never; FLAG = surface in review; DEDUCT = reduce pay. */
export type UnloggedHoursPolicy = 'IGNORE' | 'FLAG' | 'DEDUCT';

export interface TimesheetSettings {
  standardWeeklyHours: number;
  overtimeThresholdHours: number;
  roundingMinutes: number;
  approvalRequired: boolean;
  unloggedHoursPolicy: UnloggedHoursPolicy;
  billableDefault: boolean;
  updatedAt: string;
}

export interface TimesheetSettingsInput {
  standardWeeklyHours?: number;
  overtimeThresholdHours?: number;
  roundingMinutes?: number;
  approvalRequired?: boolean;
  unloggedHoursPolicy?: UnloggedHoursPolicy;
  billableDefault?: boolean;
}
