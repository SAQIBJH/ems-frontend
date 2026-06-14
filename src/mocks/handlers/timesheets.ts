import { http, HttpResponse } from 'msw';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import type {
  Project,
  ProjectInput,
  Task,
  TaskInput,
  TimeEntry,
  Timesheet,
  TimesheetSettings,
} from '@/modules/timesheets/types/timesheet.types';

const BASE = '/api/timesheets';

/** Self employee when none is supplied (the demo "signed-in" employee). */
const DEFAULT_EMPLOYEE_ID = 'emp-001';
const EMPLOYEE_NAMES: Record<string, string> = {
  'emp-001': 'Aman Kumar',
  'emp-002': 'Priya Nair',
};
/** Display name recorded as the decider on approve/reject (demo). */
const DECIDER_NAME = 'HR Admin';
function employeeName(id: string): string {
  return EMPLOYEE_NAMES[id] ?? 'Employee';
}

/** Standard week used to derive overtime. Replaced by tenant settings in Step T7. */
const DEFAULT_STANDARD_HOURS = 40;

/**
 * Tenant timesheet settings. The GET/PATCH endpoints land in Step T7; for now the
 * store holds defaults and is read by the payroll import (Step T6) for
 * `unloggedHoursPolicy` and `standardWeeklyHours`.
 */
let timesheetSettings: TimesheetSettings = {
  standardWeeklyHours: DEFAULT_STANDARD_HOURS,
  overtimeThresholdHours: DEFAULT_STANDARD_HOURS,
  roundingMinutes: 15,
  approvalRequired: true,
  unloggedHoursPolicy: 'FLAG',
  billableDefault: true,
  submitReminderDay: null,
  requireTaskOnEntry: false,
  updatedAt: '2026-04-01T00:00:00.000Z',
};

/* ── Seed data ──────────────────────────────────────────────────────────────── */

let projects: Project[] = [
  {
    id: 'prj-1',
    name: 'Acme Mobile App',
    code: 'AMA',
    clientName: 'Acme Inc',
    status: 'ACTIVE',
    billable: true,
    defaultRate: 4500,
    memberIds: [],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'prj-2',
    name: 'Internal Platform',
    code: 'PLAT',
    clientName: '',
    status: 'ACTIVE',
    billable: false,
    defaultRate: 0,
    memberIds: [],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'prj-3',
    name: 'Website Revamp',
    code: 'WEB',
    clientName: 'Globex',
    status: 'ACTIVE',
    billable: true,
    defaultRate: 3800,
    memberIds: [],
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
  },
];

let tasks: Task[] = [
  { id: 'tsk-1', projectId: 'prj-1', name: 'Frontend', billable: true, active: true },
  { id: 'tsk-2', projectId: 'prj-1', name: 'Backend', billable: true, active: true },
  { id: 'tsk-3', projectId: 'prj-1', name: 'QA', billable: true, active: true },
  { id: 'tsk-4', projectId: 'prj-2', name: 'DevOps', billable: false, active: true },
  { id: 'tsk-5', projectId: 'prj-2', name: 'Internal tooling', billable: false, active: true },
  { id: 'tsk-6', projectId: 'prj-3', name: 'Design', billable: true, active: true },
  { id: 'tsk-7', projectId: 'prj-3', name: 'Development', billable: true, active: true },
];

let projectCounter = 100;
let taskCounter = 100;

function nowIso(): string {
  return new Date().toISOString();
}

/* ── Weekly timesheets + time entries (G.2) ──────────────────────────────────── */

function mondayOf(date: string): string {
  return format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}
function weekEndOf(weekStart: string): string {
  return format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd');
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

let timesheets: Timesheet[] = [];
let entries: TimeEntry[] = [];
let timesheetCounter = 100;
let entryCounter = 100;

/** Find or create a DRAFT timesheet for an employee's week. */
function ensureTimesheet(employeeId: string, weekStart: string): Timesheet {
  const existing = timesheets.find((t) => t.employeeId === employeeId && t.weekStart === weekStart);
  if (existing) return existing;
  const created: Timesheet = {
    id: `ts-${++timesheetCounter}`,
    employeeId,
    employeeName: employeeName(employeeId),
    weekStart,
    weekEnd: weekEndOf(weekStart),
    status: 'DRAFT',
    totalHours: 0,
    billableHours: 0,
    overtimeHours: 0,
    standardHours: DEFAULT_STANDARD_HOURS,
    submittedAt: null,
    decidedBy: null,
    decidedAt: null,
    comment: null,
    entries: [],
  };
  timesheets = [...timesheets, created];
  return created;
}

/** Recompute a timesheet's rollups from its entries and return the fresh object. */
function recompute(timesheet: Timesheet): Timesheet {
  const own = entries.filter((e) => e.timesheetId === timesheet.id);
  const totalHours = round2(own.reduce((acc, e) => acc + e.hours, 0));
  const billableHours = round2(own.filter((e) => e.billable).reduce((acc, e) => acc + e.hours, 0));
  const overtimeHours = round2(Math.max(0, totalHours - timesheet.standardHours));
  const next: Timesheet = { ...timesheet, totalHours, billableHours, overtimeHours, entries: own };
  timesheets = timesheets.map((t) => (t.id === next.id ? next : t));
  return next;
}

/** A synthesized (unsaved) empty DRAFT for weeks with no data yet. */
function synthesizeWeek(employeeId: string, weekStart: string): Timesheet {
  return {
    id: `ts-draft-${employeeId}-${weekStart}`,
    employeeId,
    employeeName: employeeName(employeeId),
    weekStart,
    weekEnd: weekEndOf(weekStart),
    status: 'DRAFT',
    totalHours: 0,
    billableHours: 0,
    overtimeHours: 0,
    standardHours: DEFAULT_STANDARD_HOURS,
    submittedAt: null,
    decidedBy: null,
    decidedAt: null,
    comment: null,
    entries: [],
  };
}

/** Seed the current week for the demo employee so the grid isn't empty on first view. */
(function seedCurrentWeek() {
  const weekStart = mondayOf(format(new Date(), 'yyyy-MM-dd'));
  const ts = ensureTimesheet(DEFAULT_EMPLOYEE_ID, weekStart);
  const seed: Array<Omit<TimeEntry, 'id' | 'timesheetId' | 'employeeId'>> = [
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: weekStart,
      hours: 8,
      billable: true,
      note: 'Sprint board',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: format(addDays(parseISO(weekStart), 1), 'yyyy-MM-dd'),
      hours: 7.5,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-2',
      taskId: 'tsk-4',
      date: format(addDays(parseISO(weekStart), 1), 'yyyy-MM-dd'),
      hours: 2,
      billable: false,
      note: 'Pipeline fix',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-3',
      taskId: 'tsk-6',
      date: format(addDays(parseISO(weekStart), 2), 'yyyy-MM-dd'),
      hours: 6,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
  ];
  entries = seed.map((e) => ({
    ...e,
    id: `te-${++entryCounter}`,
    timesheetId: ts.id,
    employeeId: DEFAULT_EMPLOYEE_ID,
  }));
  recompute(ts);
})();

/** Seed a SUBMITTED week for a teammate so the Approvals queue isn't empty. */
(function seedApprovalQueue() {
  const lastWeek = format(
    addDays(parseISO(mondayOf(format(new Date(), 'yyyy-MM-dd'))), -7),
    'yyyy-MM-dd',
  );
  const ts = ensureTimesheet('emp-002', lastWeek);
  const days = getWeekDaysLocal(lastWeek);
  const seed: Array<Omit<TimeEntry, 'id' | 'timesheetId' | 'employeeId'>> = [
    {
      projectId: 'prj-1',
      taskId: 'tsk-2',
      date: days[0],
      hours: 8,
      billable: true,
      note: 'API work',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-1',
      taskId: 'tsk-2',
      date: days[1],
      hours: 8.5,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-3',
      taskId: 'tsk-7',
      date: days[2],
      hours: 9,
      billable: true,
      note: 'Launch fixes',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-3',
      taskId: 'tsk-7',
      date: days[3],
      hours: 9,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-2',
      taskId: 'tsk-4',
      date: days[4],
      hours: 8,
      billable: false,
      note: 'On-call',
      source: 'MANUAL',
    },
  ];
  const newEntries = seed.map((e) => ({
    ...e,
    id: `te-${++entryCounter}`,
    timesheetId: ts.id,
    employeeId: 'emp-002',
  }));
  entries = [...entries, ...newEntries];
  const fresh = recompute(ts);
  timesheets = timesheets.map((t) =>
    t.id === fresh.id
      ? { ...fresh, status: 'SUBMITTED', submittedAt: '2026-06-01T17:30:00.000Z' }
      : t,
  );
})();

/** Local copy of the 7-day expansion (the rollups util isn't imported here). */
function getWeekDaysLocal(weekStart: string): string[] {
  const monday = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
}

/**
 * Seed an APPROVED week for emp-001 in May 2026 (the DRAFT run's period) with overtime,
 * so the payroll "Import from timesheets" action (Step T6) has data to map.
 */
(function seedApprovedMay() {
  const mayWeek = mondayOf('2026-05-20'); // a Monday in May 2026
  const ts = ensureTimesheet(DEFAULT_EMPLOYEE_ID, mayWeek);
  const days = getWeekDaysLocal(mayWeek);
  const seed: Array<Omit<TimeEntry, 'id' | 'timesheetId' | 'employeeId'>> = [
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: days[0],
      hours: 9,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: days[1],
      hours: 9.5,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: days[2],
      hours: 9,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: days[3],
      hours: 9,
      billable: true,
      note: '',
      source: 'MANUAL',
    },
    {
      projectId: 'prj-1',
      taskId: 'tsk-1',
      date: days[4],
      hours: 9.5,
      billable: true,
      note: 'Crunch week',
      source: 'MANUAL',
    },
  ];
  const newEntries = seed.map((e) => ({
    ...e,
    id: `te-${++entryCounter}`,
    timesheetId: ts.id,
    employeeId: DEFAULT_EMPLOYEE_ID,
  }));
  entries = [...entries, ...newEntries];
  const fresh = recompute(ts); // total 46 → overtime 6
  timesheets = timesheets.map((t) =>
    t.id === fresh.id
      ? {
          ...fresh,
          status: 'APPROVED',
          submittedAt: '2026-05-25T17:00:00.000Z',
          decidedBy: DECIDER_NAME,
          decidedAt: '2026-05-26T09:00:00.000Z',
        }
      : t,
  );
})();

const EDITABLE_STATUSES: Timesheet['status'][] = ['DRAFT', 'REJECTED'];

export const timesheetHandlers = [
  /* Weekly timesheet (G.2) — fetch/synthesize the week */
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const week = url.searchParams.get('week');
    if (!week) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'week is required' } },
        { status: 422 },
      );
    }
    const weekStart = mondayOf(week);
    const employeeId = url.searchParams.get('employeeId') || DEFAULT_EMPLOYEE_ID;
    const existing = timesheets.find(
      (t) => t.employeeId === employeeId && t.weekStart === weekStart,
    );
    const data = existing ? recompute(existing) : synthesizeWeek(employeeId, weekStart);
    return HttpResponse.json({ success: true, data });
  }),

  /* Create a time entry (G.2) */
  http.post(`${BASE}/entries`, async ({ request }) => {
    const body = (await request.json()) as {
      weekStart: string;
      projectId: string;
      taskId?: string | null;
      date: string;
      hours: number;
      billable?: boolean;
      note?: string;
      source?: TimeEntry['source'];
      employeeId?: string;
    };
    const employeeId = body.employeeId || DEFAULT_EMPLOYEE_ID;
    const weekStart = mondayOf(body.weekStart);
    const ts = ensureTimesheet(employeeId, weekStart);
    if (!EDITABLE_STATUSES.includes(ts.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'TIMESHEET_LOCKED',
            message: 'This week is submitted and cannot be edited.',
          },
        },
        { status: 422 },
      );
    }
    if (timesheetSettings.requireTaskOnEntry && !body.taskId) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TASK_REQUIRED', message: 'A task is required on every time entry.' },
        },
        { status: 422 },
      );
    }
    const project = projects.find((p) => p.id === body.projectId);
    const task = tasks.find((t) => t.id === body.taskId);
    const created: TimeEntry = {
      id: `te-${++entryCounter}`,
      timesheetId: ts.id,
      employeeId,
      projectId: body.projectId,
      taskId: body.taskId ?? null,
      date: body.date,
      hours: body.hours,
      billable: body.billable ?? task?.billable ?? project?.billable ?? false,
      note: body.note ?? '',
      source: body.source === 'TIMER' ? 'TIMER' : 'MANUAL',
    };
    entries = [...entries, created];
    recompute(ts);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  /* Update a time entry (G.2) */
  http.patch(`${BASE}/entries/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<
      Pick<TimeEntry, 'projectId' | 'taskId' | 'date' | 'hours' | 'billable' | 'note'>
    >;
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 },
      );
    }
    const ts = timesheets.find((t) => t.id === entries[idx].timesheetId);
    if (ts && !EDITABLE_STATUSES.includes(ts.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'TIMESHEET_LOCKED',
            message: 'This week is submitted and cannot be edited.',
          },
        },
        { status: 422 },
      );
    }
    // Only enforced when the patch actually touches taskId (matches live behaviour).
    if (timesheetSettings.requireTaskOnEntry && 'taskId' in body && !body.taskId) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TASK_REQUIRED', message: 'A task is required on every time entry.' },
        },
        { status: 422 },
      );
    }
    const updated: TimeEntry = { ...entries[idx], ...body, id };
    entries = [...entries.slice(0, idx), updated, ...entries.slice(idx + 1)];
    if (ts) recompute(ts);
    return HttpResponse.json({ success: true, data: updated });
  }),

  /* Delete a time entry (G.2) */
  http.delete(`${BASE}/entries/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const entry = entries.find((e) => e.id === id);
    if (!entry) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 },
      );
    }
    const ts = timesheets.find((t) => t.id === entry.timesheetId);
    if (ts && !EDITABLE_STATUSES.includes(ts.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'TIMESHEET_LOCKED',
            message: 'This week is submitted and cannot be edited.',
          },
        },
        { status: 422 },
      );
    }
    entries = entries.filter((e) => e.id !== id);
    if (ts) recompute(ts);
    return HttpResponse.json({ success: true, data: { id } });
  }),

  /* Tenant settings (G.5) */
  http.get(`${BASE}/settings`, () => {
    return HttpResponse.json({ success: true, data: timesheetSettings });
  }),

  http.patch(`${BASE}/settings`, async ({ request }) => {
    const body = (await request.json()) as Partial<TimesheetSettings>;
    timesheetSettings = {
      ...timesheetSettings,
      ...body,
      updatedAt: nowIso(),
    };
    return HttpResponse.json({ success: true, data: timesheetSettings });
  }),

  /* Utilization summary (G.4) — totals, billable split, overtime, by project/employee */
  http.get(`${BASE}/summary`, ({ request }) => {
    const url = new URL(request.url);
    const range = url.searchParams.get('range') === '90d' ? '90d' : '30d';
    const employeeId = url.searchParams.get('employeeId') || undefined;
    const cutoff = format(
      addDays(parseISO(format(new Date(), 'yyyy-MM-dd')), range === '90d' ? -90 : -30),
      'yyyy-MM-dd',
    );

    const scopedEntries = entries.filter(
      (e) => e.date >= cutoff && (!employeeId || e.employeeId === employeeId),
    );

    const totalHours = round2(scopedEntries.reduce((acc, e) => acc + e.hours, 0));
    const billableHours = round2(
      scopedEntries.filter((e) => e.billable).reduce((acc, e) => acc + e.hours, 0),
    );
    const nonBillableHours = round2(totalHours - billableHours);
    const utilizationPct = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

    // Overtime from weeks whose Monday falls in range (and match the employee filter).
    const overtimeHours = round2(
      timesheets
        .filter((t) => t.weekStart >= cutoff && (!employeeId || t.employeeId === employeeId))
        .reduce((acc, t) => acc + recompute(t).overtimeHours, 0),
    );

    // By project
    const byProjectMap = new Map<string, { hours: number; billableHours: number }>();
    for (const e of scopedEntries) {
      const agg = byProjectMap.get(e.projectId) ?? { hours: 0, billableHours: 0 };
      agg.hours = round2(agg.hours + e.hours);
      if (e.billable) agg.billableHours = round2(agg.billableHours + e.hours);
      byProjectMap.set(e.projectId, agg);
    }
    const byProject = [...byProjectMap.entries()]
      .map(([projectId, agg]) => ({
        projectId,
        projectName: projects.find((p) => p.id === projectId)?.name ?? 'Project',
        hours: agg.hours,
        billableHours: agg.billableHours,
      }))
      .sort((a, b) => b.hours - a.hours);

    // By employee
    const byEmployeeMap = new Map<string, { hours: number; billable: number }>();
    for (const e of scopedEntries) {
      const agg = byEmployeeMap.get(e.employeeId) ?? { hours: 0, billable: 0 };
      agg.hours = round2(agg.hours + e.hours);
      if (e.billable) agg.billable = round2(agg.billable + e.hours);
      byEmployeeMap.set(e.employeeId, agg);
    }
    const byEmployee = [...byEmployeeMap.entries()]
      .map(([id, agg]) => ({
        employeeId: id,
        employeeName: employeeName(id),
        hours: agg.hours,
        utilizationPct: agg.hours > 0 ? Math.round((agg.billable / agg.hours) * 100) : 0,
      }))
      .sort((a, b) => b.hours - a.hours);

    return HttpResponse.json({
      success: true,
      data: {
        totalHours,
        billableHours,
        nonBillableHours,
        overtimeHours,
        utilizationPct,
        byProject,
        byEmployee,
      },
    });
  }),

  /* Submit the week for approval (G.2) — DRAFT/REJECTED → SUBMITTED */
  http.post(`${BASE}/:id/submit`, ({ params }) => {
    const { id } = params as { id: string };
    const ts = timesheets.find((t) => t.id === id);
    if (!ts) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 },
      );
    }
    if (!EDITABLE_STATUSES.includes(ts.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_SUBMITTED', message: 'This week has already been submitted.' },
        },
        { status: 422 },
      );
    }
    const fresh = recompute(ts);
    if (fresh.totalHours <= 0) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMPTY_TIMESHEET', message: 'Log some hours before submitting.' },
        },
        { status: 422 },
      );
    }
    const updated: Timesheet = {
      ...fresh,
      status: 'SUBMITTED',
      submittedAt: nowIso(),
      decidedBy: null,
      decidedAt: null,
      comment: null,
    };
    timesheets = timesheets.map((t) => (t.id === id ? updated : t));
    return HttpResponse.json({ success: true, data: updated });
  }),

  /* Recall a submitted (not-yet-decided) week back to DRAFT — owner only (M6 / Domain G) */
  http.post(`${BASE}/:id/recall`, ({ params }) => {
    const { id } = params as { id: string };
    const ts = timesheets.find((t) => t.id === id);
    if (!ts) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 },
      );
    }
    if (ts.status !== 'SUBMITTED') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_RECALLABLE',
            message: 'Only a week awaiting approval can be recalled.',
          },
        },
        { status: 422 },
      );
    }
    const updated: Timesheet = {
      ...ts,
      status: 'DRAFT',
      submittedAt: null,
      decidedBy: null,
      decidedAt: null,
      comment: null,
    };
    timesheets = timesheets.map((t) => (t.id === id ? updated : t));
    return HttpResponse.json({ success: true, data: updated });
  }),

  /* Copy a previous week's rows (project/task/billable) into a target week with zero
     hours, so the user just fills numbers (M5 / Domain G). Idempotent — skips rows the
     target already has; optionally carries notes. */
  http.post(`${BASE}/copy-week`, async ({ request }) => {
    const body = (await request.json()) as {
      fromWeekStart: string;
      toWeekStart: string;
      withNotes?: boolean;
      employeeId?: string;
    };
    const employeeId = body.employeeId || DEFAULT_EMPLOYEE_ID;
    const from = mondayOf(body.fromWeekStart);
    const target = ensureTimesheet(employeeId, mondayOf(body.toWeekStart));
    if (!EDITABLE_STATUSES.includes(target.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'WEEK_LOCKED',
            message: 'The target week is submitted and cannot be edited.',
          },
        },
        { status: 422 },
      );
    }
    const fromTs = timesheets.find((t) => t.employeeId === employeeId && t.weekStart === from);
    const sourceEntries = fromTs ? entries.filter((e) => e.timesheetId === fromTs.id) : [];
    const seen = new Set<string>();
    let copied = 0;
    for (const e of sourceEntries) {
      const key = `${e.projectId}::${e.taskId ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const exists = entries.some(
        (te) => te.timesheetId === target.id && `${te.projectId}::${te.taskId ?? ''}` === key,
      );
      if (exists) continue;
      entries = [
        ...entries,
        {
          id: `te-${++entryCounter}`,
          timesheetId: target.id,
          employeeId,
          projectId: e.projectId,
          taskId: e.taskId,
          date: target.weekStart,
          hours: 0,
          billable: e.billable,
          note: body.withNotes ? e.note : '',
          source: 'MANUAL',
        },
      ];
      copied += 1;
    }
    const fresh = recompute(target);
    return HttpResponse.json({ success: true, data: fresh, meta: { copied } }, { status: 201 });
  }),

  /* Approval queue (G.3) — managers see their team, HR sees all (mock: all) */
  http.get(`${BASE}/approvals`, ({ request }) => {
    const status = (new URL(request.url).searchParams.get('status') ||
      'SUBMITTED') as Timesheet['status'];
    const data = timesheets
      .filter((t) => t.status === status)
      .map((t) => recompute(t))
      .sort((a, b) => (b.weekStart < a.weekStart ? -1 : 1));
    return HttpResponse.json({ success: true, data });
  }),

  /* Approve a submitted week (G.3) — SUBMITTED → APPROVED */
  http.post(`${BASE}/:id/approve`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json().catch(() => ({}))) as { comment?: string };
    const ts = timesheets.find((t) => t.id === id);
    if (!ts) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 },
      );
    }
    if (ts.status !== 'SUBMITTED') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_SUBMITTED', message: 'Only submitted weeks can be approved.' },
        },
        { status: 422 },
      );
    }
    const updated: Timesheet = {
      ...recompute(ts),
      status: 'APPROVED',
      decidedBy: DECIDER_NAME,
      decidedAt: nowIso(),
      comment: body.comment?.trim() || null,
    };
    timesheets = timesheets.map((t) => (t.id === id ? updated : t));
    return HttpResponse.json({ success: true, data: updated });
  }),

  /* Reject a submitted week (G.3) — SUBMITTED → REJECTED (re-editable) */
  http.post(`${BASE}/:id/reject`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json().catch(() => ({}))) as { comment?: string };
    const ts = timesheets.find((t) => t.id === id);
    if (!ts) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 },
      );
    }
    if (ts.status !== 'SUBMITTED') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_SUBMITTED', message: 'Only submitted weeks can be rejected.' },
        },
        { status: 422 },
      );
    }
    if (!body.comment?.trim()) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION',
            message: 'A reason is required to reject.',
            details: [{ field: 'comment', message: 'Provide a reason for the rejection.' }],
          },
        },
        { status: 422 },
      );
    }
    const updated: Timesheet = {
      ...recompute(ts),
      status: 'REJECTED',
      decidedBy: DECIDER_NAME,
      decidedAt: nowIso(),
      comment: body.comment.trim(),
    };
    timesheets = timesheets.map((t) => (t.id === id ? updated : t));
    return HttpResponse.json({ success: true, data: updated });
  }),

  /* Projects — optionally scoped to a member (Step T3.1) */
  http.get(`${BASE}/projects`, ({ request }) => {
    const memberParam = new URL(request.url).searchParams.get('memberId');
    if (!memberParam) {
      // Unscoped (admin / management) view — every project.
      return HttpResponse.json({ success: true, data: projects });
    }
    const memberId = memberParam === 'self' ? DEFAULT_EMPLOYEE_ID : memberParam;
    // Open projects (empty memberIds) plus those the employee is a member of.
    const scoped = projects.filter(
      (p) => p.memberIds.length === 0 || p.memberIds.includes(memberId),
    );
    return HttpResponse.json({ success: true, data: scoped });
  }),

  http.post(`${BASE}/projects`, async ({ request }) => {
    const body = (await request.json()) as ProjectInput;
    if (projects.some((p) => p.code.toLowerCase() === body.code.toLowerCase())) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_CODE', message: 'Project code already exists' },
        },
        { status: 409 },
      );
    }
    const created: Project = {
      id: `prj-${++projectCounter}`,
      name: body.name,
      code: body.code,
      clientName: body.clientName ?? '',
      status: body.status ?? 'ACTIVE',
      billable: body.billable,
      defaultRate: body.defaultRate ?? 0,
      memberIds: body.memberIds ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    projects = [...projects, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch(`${BASE}/projects/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<ProjectInput>;
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 },
      );
    }
    if (
      body.code &&
      projects.some((p) => p.id !== id && p.code.toLowerCase() === body.code!.toLowerCase())
    ) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_CODE', message: 'Project code already exists' },
        },
        { status: 409 },
      );
    }
    const updated: Project = { ...projects[idx], ...body, id, updatedAt: nowIso() };
    projects = [...projects.slice(0, idx), updated, ...projects.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),

  // Archive if it has tasks (preserve history); hard-delete otherwise.
  http.delete(`${BASE}/projects/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const project = projects.find((p) => p.id === id);
    if (!project) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 },
      );
    }
    const hasTasks = tasks.some((t) => t.projectId === id);
    if (hasTasks) {
      projects = projects.map((p) =>
        p.id === id ? { ...p, status: 'ARCHIVED', updatedAt: nowIso() } : p,
      );
      return HttpResponse.json({ success: true, data: { id, status: 'ARCHIVED' } });
    }
    projects = projects.filter((p) => p.id !== id);
    return HttpResponse.json({ success: true, data: { id, status: 'DELETED' } });
  }),

  /* Tasks */
  http.get(`${BASE}/projects/:id/tasks`, ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json({
      success: true,
      data: tasks.filter((t) => t.projectId === id),
    });
  }),

  http.post(`${BASE}/projects/:id/tasks`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!projects.some((p) => p.id === id)) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as TaskInput;
    const created: Task = {
      id: `tsk-${++taskCounter}`,
      projectId: id,
      name: body.name,
      billable: body.billable,
      active: body.active ?? true,
    };
    tasks = [...tasks, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch(`${BASE}/tasks/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<TaskInput>;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 },
      );
    }
    const updated: Task = { ...tasks[idx], ...body, id };
    tasks = [...tasks.slice(0, idx), updated, ...tasks.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),
];

/** Read accessors for later steps (entries/timesheets reuse the seeded data). */
export function getTimesheetProjects(): Project[] {
  return projects;
}
export function getTimesheetTasks(): Task[] {
  return tasks;
}
export function getTimesheets(): Timesheet[] {
  return timesheets;
}
export function getTimeEntries(): TimeEntry[] {
  return entries;
}
/** Current tenant timesheet settings (read by the payroll import; managed in Step T7). */
export function getTimesheetSettings(): TimesheetSettings {
  return timesheetSettings;
}
export function setTimesheetSettings(next: TimesheetSettings): void {
  timesheetSettings = next;
}
