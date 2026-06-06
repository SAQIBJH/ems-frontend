import { http, HttpResponse } from 'msw';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import type {
  Project,
  ProjectInput,
  Task,
  TaskInput,
  TimeEntry,
  Timesheet,
} from '@/modules/timesheets/types/timesheet.types';

const BASE = '/api/timesheets';

/** Self employee when none is supplied (the demo "signed-in" employee). */
const DEFAULT_EMPLOYEE_ID = 'emp-001';
const EMPLOYEE_NAMES: Record<string, string> = {
  'emp-001': 'Aman Kumar',
  'emp-002': 'Priya Nair',
};
function employeeName(id: string): string {
  return EMPLOYEE_NAMES[id] ?? 'Employee';
}

/** Standard week used to derive overtime. Replaced by tenant settings in Step T7. */
const DEFAULT_STANDARD_HOURS = 40;

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
      taskId: string;
      date: string;
      hours: number;
      billable?: boolean;
      note?: string;
      employeeId?: string;
    };
    const employeeId = body.employeeId || DEFAULT_EMPLOYEE_ID;
    const weekStart = mondayOf(body.weekStart);
    const ts = ensureTimesheet(employeeId, weekStart);
    if (!EDITABLE_STATUSES.includes(ts.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'WEEK_LOCKED', message: 'This week is submitted and cannot be edited.' },
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
      taskId: body.taskId,
      date: body.date,
      hours: body.hours,
      billable: body.billable ?? task?.billable ?? project?.billable ?? false,
      note: body.note ?? '',
      source: 'MANUAL',
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
          error: { code: 'WEEK_LOCKED', message: 'This week is submitted and cannot be edited.' },
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
          error: { code: 'WEEK_LOCKED', message: 'This week is submitted and cannot be edited.' },
        },
        { status: 422 },
      );
    }
    entries = entries.filter((e) => e.id !== id);
    if (ts) recompute(ts);
    return HttpResponse.json({ success: true, data: { id } });
  }),

  /* Projects */
  http.get(`${BASE}/projects`, () => {
    return HttpResponse.json({ success: true, data: projects });
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
