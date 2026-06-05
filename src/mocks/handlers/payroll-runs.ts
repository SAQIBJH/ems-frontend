import { http, HttpResponse } from 'msw';
import type { PayrollRun } from '@/modules/payroll/types/payroll.types';
import type { RunConfigSnapshotRef } from '@/modules/payroll/types/statutory.types';
import { computeRun } from '../data/payroll-engine';
import { resolveActivePack } from './payroll-statutory';
import { getRunInputs } from './payroll-inputs';

// The demo tenant's payroll roster operates under the India legal entity.
const RUN_COUNTRY = 'IN';

// Canonical computed totals (the roster is fixed, so every run shares them until
// per-period inputs land in Step 101). Derived from the engine — never hardcoded.
const BASE = computeRun('base', '2026-05');

/**
 * Pin the statutory pack version in force for the run's country + period.
 * Stored on the run so recompute resolves the same version (reproducibility).
 */
function pinConfig(period: string): RunConfigSnapshotRef | null {
  const pack = resolveActivePack(RUN_COUNTRY, period);
  if (!pack) return null;
  return {
    statutoryPackId: pack.id,
    country: pack.country,
    version: pack.version,
    effectiveFrom: pack.effectiveFrom,
    pinnedAt: new Date().toISOString(),
  };
}

function runTotals(): Pick<
  PayrollRun,
  'employeeCount' | 'totalGross' | 'totalDeductions' | 'employerCost' | 'totalNet'
> {
  return {
    employeeCount: BASE.totals.employeeCount,
    totalGross: BASE.totals.totalGross,
    totalDeductions: BASE.totals.totalDeductions,
    employerCost: BASE.totals.employerCost,
    totalNet: BASE.totals.totalNet,
  };
}

let runs: PayrollRun[] = [
  {
    id: 'run-001',
    period: '2026-02',
    periodLabel: 'February 2026',
    status: 'PAID',
    ...runTotals(),
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: 'superadmin@acme.test',
    processedAt: '2026-02-26T10:00:00.000Z',
    approvedAt: '2026-02-27T09:00:00.000Z',
    paidAt: '2026-02-28T00:00:00.000Z',
    configSnapshotRef: pinConfig('2026-02'),
    createdAt: '2026-02-23T08:00:00.000Z',
  },
  {
    id: 'run-002',
    period: '2026-03',
    periodLabel: 'March 2026',
    status: 'PAID',
    ...runTotals(),
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: 'superadmin@acme.test',
    processedAt: '2026-03-28T10:00:00.000Z',
    approvedAt: '2026-03-29T09:00:00.000Z',
    paidAt: '2026-03-31T00:00:00.000Z',
    configSnapshotRef: pinConfig('2026-03'),
    createdAt: '2026-03-25T08:00:00.000Z',
  },
  {
    id: 'run-003',
    period: '2026-04',
    periodLabel: 'April 2026',
    status: 'PAID',
    ...runTotals(),
    currency: 'INR',
    initiatedBy: 'hr@acme.test',
    approvedBy: 'superadmin@acme.test',
    processedAt: '2026-04-28T10:00:00.000Z',
    approvedAt: '2026-04-29T09:00:00.000Z',
    paidAt: '2026-04-30T00:00:00.000Z',
    configSnapshotRef: pinConfig('2026-04'),
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
    employerCost: 0,
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

/** Status + period for a run (consumed by the inputs handler; avoids a store import). */
export function getRunMeta(
  runId: string,
): { status: PayrollRun['status']; period: string } | undefined {
  const run = runs.find((r) => r.id === runId);
  return run ? { status: run.status, period: run.period } : undefined;
}

function payslipStatusFor(run: PayrollRun) {
  return run.status === 'PAID' ? ('PAID' as const) : ('PENDING' as const);
}

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
    // Only runs that have been calculated have a meaningful summary.
    const computed =
      run.status === 'DRAFT' || run.status === 'CANCELLED'
        ? { byDepartment: [], warnings: [] }
        : computeRun(run.id, run.period, payslipStatusFor(run), getRunInputs(run.id));
    return HttpResponse.json({
      success: true,
      data: {
        ...run,
        summary: { byDepartment: computed.byDepartment, warnings: computed.warnings },
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
      employerCost: 0,
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
      // Compute real numbers from the engine, then move to REVIEW after a brief delay.
      setTimeout(() => {
        const run = runs.find((r) => r.id === id);
        if (!run) return;
        const computed = computeRun(run.id, run.period, 'PENDING', getRunInputs(id));
        runs = runs.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'REVIEW',
                employeeCount: computed.totals.employeeCount,
                totalGross: computed.totals.totalGross,
                totalDeductions: computed.totals.totalDeductions,
                employerCost: computed.totals.employerCost,
                totalNet: computed.totals.totalNet,
                // Pin the statutory pack version used — recompute is reproducible.
                configSnapshotRef: pinConfig(run.period),
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
    const computed = computeRun(run.id, run.period, payslipStatusFor(run), getRunInputs(run.id));
    return HttpResponse.json({
      success: true,
      data: {
        items: computed.items,
        pagination: {
          page: 1,
          limit: computed.items.length || 1,
          total: computed.items.length,
          totalPages: 1,
        },
      },
    });
  }),

  http.get('/api/payroll/runs/:runId/payslips/:payslipId', ({ params }) => {
    const { runId, payslipId } = params as { runId: string; payslipId: string };
    const run = runs.find((r) => r.id === runId);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    const computed = computeRun(run.id, run.period, payslipStatusFor(run), getRunInputs(run.id));
    const detail = computed.details[payslipId];
    if (!detail) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: detail });
  }),

  http.patch('/api/payroll/runs/:runId/payslips/:payslipId', async ({ params, request }) => {
    const { runId, payslipId } = params as { runId: string; payslipId: string };
    const body = (await request.json()) as Record<string, unknown>;
    const run = runs.find((r) => r.id === runId);
    const computed = run
      ? computeRun(run.id, run.period, payslipStatusFor(run), getRunInputs(run.id))
      : null;
    const detail = computed?.details[payslipId];
    return HttpResponse.json({ success: true, data: { ...detail, ...body, hasAdjustments: true } });
  }),

  http.get('/api/payroll/runs/:runId/export', ({ params }) => {
    const { runId } = params as { runId: string };
    const run = runs.find((r) => r.id === runId);
    const computed = run
      ? computeRun(run.id, run.period, payslipStatusFor(run), getRunInputs(run.id))
      : BASE;
    const header = 'employeeCode,employeeName,grossEarnings,totalDeductions,netPay';
    const rows = computed.items.map(
      (i) =>
        `${i.employeeCode},${i.employeeName},${i.grossEarnings},${i.totalDeductions},${i.netPay}`,
    );
    const csv = [header, ...rows].join('\n');
    return new HttpResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="payroll-run.csv"',
      },
    });
  }),
];
