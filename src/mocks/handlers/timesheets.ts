import { http, HttpResponse } from 'msw';
import type {
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '@/modules/timesheets/types/timesheet.types';

const BASE = '/api/timesheets';

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

export const timesheetHandlers = [
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
