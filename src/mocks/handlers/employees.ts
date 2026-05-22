import { http, HttpResponse } from 'msw';
import { EMPLOYEE_FIXTURES } from '../data/employees';
import type { Employee, EmployeeDetail } from '@/modules/employees/types/employee.types';

// Mutable in-memory store — resets on page reload (acceptable for dev/demo).
let store: EmployeeDetail[] = EMPLOYEE_FIXTURES.map((e) => ({
  ...e,
  leaveBalances: [],
  documents: [],
}));

export const employeeHandlers = [
  /**
   * GET /api/employees
   * Shape: { success, data: { data: Employee[], pagination: {} } }
   */
  http.get('/api/employees', ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.max(1, Number(url.searchParams.get('limit')) || 20);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const departmentId = url.searchParams.get('departmentId');
    const status = url.searchParams.get('status');

    let filtered: Employee[] = store;

    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.firstName.toLowerCase().includes(search) ||
          e.lastName.toLowerCase().includes(search) ||
          e.workEmail.toLowerCase().includes(search) ||
          e.employeeCode.toLowerCase().includes(search) ||
          e.designation.toLowerCase().includes(search),
      );
    }
    if (departmentId) {
      filtered = filtered.filter((e) => e.departmentId === departmentId);
    }
    if (status) {
      filtered = filtered.filter((e) => e.employmentStatus === status);
    }

    const total = filtered.length;
    const pages = Math.ceil(total / limit);
    const items = filtered.slice((page - 1) * limit, page * limit);

    return HttpResponse.json({
      success: true,
      data: { data: items, pagination: { page, limit, total, pages } },
      meta: {},
    });
  }),

  /**
   * GET /api/employees/:id
   * Shape: { success, data: EmployeeDetail }
   */
  http.get('/api/employees/:id', ({ params }) => {
    const id = params.id as string;
    const employee = store.find((e) => e.id === id);

    if (!employee) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 },
      );
    }

    return HttpResponse.json({ success: true, data: employee, meta: {} });
  }),

  /**
   * POST /api/employees → 201
   * Shape: { success, data: EmployeeDetail }
   */
  http.post('/api/employees', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    const codeExists = store.some((e) => e.employeeCode === body.employeeCode);
    if (codeExists) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_EMPLOYEE_CODE', message: 'Employee code already taken' },
        },
        { status: 409 },
      );
    }
    const emailExists = store.some((e) => e.workEmail === body.workEmail);
    if (emailExists) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_WORK_EMAIL', message: 'Work email already taken' },
        },
        { status: 409 },
      );
    }

    const id = `emp-mock-${Date.now()}`;
    const created: EmployeeDetail = {
      id,
      employeeCode: String(body.employeeCode ?? ''),
      firstName: String(body.firstName ?? ''),
      lastName: String(body.lastName ?? ''),
      workEmail: String(body.workEmail ?? ''),
      personalEmail: (body.personalEmail as string | null) ?? null,
      phone: (body.phone as string | null) ?? null,
      dateOfBirth: (body.dateOfBirth as string | null) ?? null,
      gender: (body.gender as EmployeeDetail['gender']) ?? null,
      address: (body.address as string | null) ?? null,
      designation: String(body.designation ?? ''),
      departmentId: String(body.departmentId ?? ''),
      managerId: (body.managerId as string | null) ?? null,
      joinedOn: String(body.joinedOn ?? new Date().toISOString()),
      employmentType: (body.employmentType as EmployeeDetail['employmentType']) ?? 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      location: (body.location as string | null) ?? null,
      payCurrency: 'INR',
      department: null,
      manager: null,
      user: null,
      leaveBalances: [],
      documents: [],
    };

    store = [...store, created];
    return HttpResponse.json({ success: true, data: created, meta: {} }, { status: 201 });
  }),

  /**
   * PATCH /api/employees/:id → 200
   * Shape: { success, data: EmployeeDetail }
   */
  http.patch('/api/employees/:id', async ({ params, request }) => {
    const id = params.id as string;
    const idx = store.findIndex((e) => e.id === id);

    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated: EmployeeDetail = { ...store[idx], ...(body as Partial<EmployeeDetail>) };
    store = store.map((e) => (e.id === id ? updated : e));

    return HttpResponse.json({ success: true, data: updated, meta: {} });
  }),

  /**
   * DELETE /api/employees/:id → 200 (soft delete)
   * Shape: { success, data: { id, status: "TERMINATED" } }
   */
  http.delete('/api/employees/:id', ({ params }) => {
    const id = params.id as string;
    const idx = store.findIndex((e) => e.id === id);

    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 },
      );
    }

    store = store.map((e) => (e.id === id ? { ...e, employmentStatus: 'TERMINATED' as const } : e));

    return HttpResponse.json({
      success: true,
      data: { id, status: 'TERMINATED' },
      meta: {},
    });
  }),
];
