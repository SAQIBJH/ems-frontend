import { http, HttpResponse } from 'msw';
import type { PayrollRun, PayslipRunPage } from '@/modules/payroll/types/payroll.types';

let runs: PayrollRun[] = [
  {
    id: 'run-001',
    period: '2026-02',
    periodLabel: 'February 2026',
    status: 'PAID',
    employeeCount: 48,
    totalGross: 4800000,
    totalDeductions: 614400,
    totalNet: 4185600,
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: 'superadmin@acme.test',
    processedAt: '2026-02-26T10:00:00.000Z',
    approvedAt: '2026-02-27T09:00:00.000Z',
    paidAt: '2026-02-28T00:00:00.000Z',
    createdAt: '2026-02-23T08:00:00.000Z',
  },
  {
    id: 'run-002',
    period: '2026-03',
    periodLabel: 'March 2026',
    status: 'PAID',
    employeeCount: 50,
    totalGross: 5000000,
    totalDeductions: 640000,
    totalNet: 4360000,
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: 'superadmin@acme.test',
    processedAt: '2026-03-28T10:00:00.000Z',
    approvedAt: '2026-03-29T09:00:00.000Z',
    paidAt: '2026-03-31T00:00:00.000Z',
    createdAt: '2026-03-25T08:00:00.000Z',
  },
  {
    id: 'run-003',
    period: '2026-04',
    periodLabel: 'April 2026',
    status: 'PAID',
    employeeCount: 50,
    totalGross: 5000000,
    totalDeductions: 640000,
    totalNet: 4360000,
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: 'superadmin@acme.test',
    processedAt: '2026-04-28T10:00:00.000Z',
    approvedAt: '2026-04-29T09:00:00.000Z',
    paidAt: '2026-04-30T00:00:00.000Z',
    createdAt: '2026-04-25T08:00:00.000Z',
  },
  {
    id: 'run-004',
    period: '2026-05',
    periodLabel: 'May 2026',
    status: 'DRAFT',
    employeeCount: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: null,
    processedAt: null,
    approvedAt: null,
    paidAt: null,
    createdAt: '2026-05-01T08:00:00.000Z',
  },
];

let idCounter = 100;

const MOCK_PAYSLIPS: PayslipRunPage = {
  items: [
    {
      id: 'rslip-001',
      employeeId: 'emp-001',
      employeeCode: 'E0001',
      employeeName: 'Aman Kumar',
      departmentName: 'Engineering',
      designation: 'Senior Engineer',
      currency: 'INR',
      grossEarnings: 150000,
      totalDeductions: 19100,
      netPay: 130900,
      workingDays: 22,
      presentDays: 22,
      lopDays: 0,
      status: 'PENDING',
      hasAdjustments: false,
    },
    {
      id: 'rslip-002',
      employeeId: 'emp-004',
      employeeCode: 'E0004',
      employeeName: 'Priya Sharma',
      departmentName: 'Engineering',
      designation: 'Software Engineer',
      currency: 'INR',
      grossEarnings: 100000,
      totalDeductions: 12800,
      netPay: 87200,
      workingDays: 22,
      presentDays: 21,
      lopDays: 0,
      status: 'PENDING',
      hasAdjustments: false,
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

export const payrollRunHandlers = [
  http.get('/api/payroll/runs', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '10');
    const statusFilter = url.searchParams.get('status');
    let filtered = runs;
    if (statusFilter) filtered = runs.filter((r) => r.status === statusFilter);
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);
    return HttpResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        },
      },
    });
  }),

  http.get('/api/payroll/runs/:id', ({ params }) => {
    const { id } = params as { id: string };
    const run = runs.find((r) => r.id === id);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        ...run,
        summary: {
          byDepartment: [
            { departmentName: 'Engineering', employeeCount: 12, totalNet: 1245000 },
            { departmentName: 'HR', employeeCount: 5, totalNet: 390000 },
          ],
          warnings: [],
        },
      },
    });
  }),

  http.post('/api/payroll/runs', async ({ request }) => {
    const body = (await request.json()) as { period: string; includeAllActiveEmployees: boolean };
    if (runs.some((r) => r.period === body.period && r.status !== 'CANCELLED')) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'RUN_EXISTS', message: 'A run for this period already exists' },
        },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const created: PayrollRun = {
      id: `run-${++idCounter}`,
      period: body.period,
      periodLabel: new Date(body.period + '-01').toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      status: 'DRAFT',
      employeeCount: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      currency: 'INR',
      initiatedBy: 'hr@acme.test',
      approvedBy: null,
      processedAt: null,
      approvedAt: null,
      paidAt: null,
      createdAt: now,
    };
    runs = [...runs, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.post('/api/payroll/runs/:id/calculate', ({ params }) => {
    const { id } = params as { id: string };
    const idx = runs.findIndex((r) => r.id === id);
    if (idx !== -1) {
      runs = runs.map((r, i) =>
        i === idx ? { ...r, status: 'CALCULATING', processedAt: new Date().toISOString() } : r,
      );
      // Simulate completing to REVIEW after brief delay
      setTimeout(() => {
        runs = runs.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'REVIEW',
                employeeCount: 48,
                totalGross: 4800000,
                totalDeductions: 614400,
                totalNet: 4185600,
              }
            : r,
        );
      }, 2000);
    }
    return HttpResponse.json(
      { success: true, data: { status: 'CALCULATING', estimatedSeconds: 5 } },
      { status: 202 },
    );
  }),

  http.post('/api/payroll/runs/:id/approve', async ({ params, request }) => {
    const { id } = params as { id: string };
    await request.json();
    runs = runs.map((r) =>
      r.id === id ? { ...r, status: 'APPROVED', approvedAt: new Date().toISOString() } : r,
    );
    const run = runs.find((r) => r.id === id);
    return HttpResponse.json({ success: true, data: run });
  }),

  http.patch('/api/payroll/runs/:id/mark-paid', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { paidAt: string; paymentReference: string };
    runs = runs.map((r) => (r.id === id ? { ...r, status: 'PAID', paidAt: body.paidAt } : r));
    const run = runs.find((r) => r.id === id);
    return HttpResponse.json({ success: true, data: run });
  }),

  http.post('/api/payroll/runs/:id/cancel', async ({ params }) => {
    const { id } = params as { id: string };
    runs = runs.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r));
    const run = runs.find((r) => r.id === id);
    return HttpResponse.json({ success: true, data: run });
  }),

  http.get('/api/payroll/runs/:runId/payslips', ({ params }) => {
    const { runId } = params as { runId: string };
    const run = runs.find((r) => r.id === runId);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: MOCK_PAYSLIPS });
  }),

  http.get('/api/payroll/runs/:runId/payslips/:payslipId', ({ params }) => {
    const { payslipId } = params as { payslipId: string };
    const item = MOCK_PAYSLIPS.items.find((p) => p.id === payslipId);
    if (!item) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } },
        { status: 404 },
      );
    }
    const detail = {
      ...item,
      employee: {
        id: item.employeeId,
        firstName: item.employeeName.split(' ')[0],
        lastName: item.employeeName.split(' ')[1] ?? '',
        employeeCode: item.employeeCode,
        designation: item.designation,
        departmentName: item.departmentName,
      },
      company: { name: 'Acme Corp', address: '123 Tech Park, Pune 411001', logoUrl: null },
      earnings: [
        { code: 'BASIC', name: 'Basic Salary', amount: 50000, taxable: true },
        { code: 'HRA', name: 'House Rent Allowance', amount: 20000, taxable: false },
      ],
      deductions: [
        { code: 'PF', name: 'Provident Fund', amount: 6000 },
        { code: 'TDS', name: 'TDS (Income Tax)', amount: 6600 },
      ],
      oneTimeAdditions: [],
      oneTimeDeductions: [],
      leaveDays: 0,
      paymentReference: 'NEFT/2026/05/BATCH001',
      generatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: detail });
  }),

  http.patch('/api/payroll/runs/:runId/payslips/:payslipId', async ({ params, request }) => {
    const { payslipId } = params as { payslipId: string };
    const body = (await request.json()) as Record<string, unknown>;
    const item = MOCK_PAYSLIPS.items.find((p) => p.id === payslipId);
    return HttpResponse.json({ success: true, data: { ...item, ...body, hasAdjustments: true } });
  }),

  http.get('/api/payroll/runs/:runId/export', () => {
    const csv =
      'employeeCode,employeeName,grossEarnings,totalDeductions,netPay\nE0001,Aman Kumar,150000,19100,130900\nE0004,Priya Sharma,100000,12800,87200';
    return new HttpResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="payroll-run.csv"',
      },
    });
  }),
];
