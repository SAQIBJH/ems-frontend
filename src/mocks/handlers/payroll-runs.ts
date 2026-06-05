import { http, HttpResponse } from 'msw';
import type {
  PayrollRun,
  PayrollRunType,
  FnfParams,
  RunApprovalLevel,
  PayrollRunAuditEntry,
  RunVariance,
  RunVarianceItem,
  RunVarianceFlag,
} from '@/modules/payroll/types/payroll.types';
import type { RunConfigSnapshotRef } from '@/modules/payroll/types/statutory.types';
import { computeRun, computeFnf, type ComputedRun } from '../data/payroll-engine';
import { resolveActivePack } from './payroll-statutory';
import { getRunInputs } from './payroll-inputs';
import { getClaimsForRun, attachApprovedClaimsToRun, markRunClaimsPaid } from './payroll-claims';

// The demo tenant's payroll roster operates under the India legal entity.
const RUN_COUNTRY = 'IN';

// Runs whose net exceeds this threshold need a second approval level (HR → Finance).
const SECOND_LEVEL_THRESHOLD = 5_000_000; // engine major units (₹50,00,000)
// Per-employee net moving more than this vs last period is flagged in variance review.
const VARIANCE_THRESHOLD_PCT = 20;

/** Build the configurable approval chain for a run from its net total. */
function buildApprovalChain(totalNet: number): RunApprovalLevel[] {
  const chain: RunApprovalLevel[] = [
    { level: 1, label: 'HR review', status: 'PENDING', approver: null, approvedAt: null },
  ];
  if (totalNet > SECOND_LEVEL_THRESHOLD) {
    chain.push({
      level: 2,
      label: 'Finance approval',
      status: 'PENDING',
      approver: null,
      approvedAt: null,
    });
  }
  return chain;
}

/* ── Payroll audit trail (every transition / override / approval) ──────────── */

const runAudit: Record<string, PayrollRunAuditEntry[]> = {};
let auditCounter = 0;

function appendAudit(runId: string, action: string, actor: string, detail?: string): void {
  const entry: PayrollRunAuditEntry = {
    id: `audit-${++auditCounter}`,
    runId,
    action,
    actor,
    at: new Date().toISOString(),
    detail,
  };
  runAudit[runId] = [...(runAudit[runId] ?? []), entry];
}

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
    type: 'REGULAR',
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
    type: 'REGULAR',
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
    type: 'REGULAR',
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
    type: 'REGULAR',
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

/** Recompute a run's payslips deterministically (idempotent — same inputs, same numbers). */
function computeRunFor(run: PayrollRun): ComputedRun {
  return computeRun(
    run.id,
    run.period,
    payslipStatusFor(run),
    getRunInputs(run.id),
    getClaimsForRun(run.id),
  );
}

/** The most recent prior REGULAR run, for period-over-period variance. */
function previousRegularRun(run: PayrollRun): PayrollRun | null {
  return (
    runs
      .filter(
        (r) =>
          r.id !== run.id &&
          r.type === 'REGULAR' &&
          r.status !== 'CANCELLED' &&
          r.period < run.period,
      )
      .sort((a, b) => (a.period < b.period ? 1 : -1))[0] ?? null
  );
}

/** Variance / anomaly review: per-employee net Δ% vs last period + outlier flags. */
function buildVariance(run: PayrollRun): RunVariance {
  const current = computeRunFor(run);
  const prev = previousRegularRun(run);
  const prevNet = new Map<string, number>();
  if (prev) for (const it of computeRunFor(prev).items) prevNet.set(it.employeeId, it.netPay);

  const items: RunVarianceItem[] = [];
  for (const it of current.items) {
    const previousNet = prevNet.has(it.employeeId) ? prevNet.get(it.employeeId)! : null;
    const deltaPct =
      previousNet && previousNet !== 0
        ? ((it.netPay - previousNet) / Math.abs(previousNet)) * 100
        : null;
    const flags: RunVarianceFlag[] = [];
    if (it.netPay < 0) flags.push('NEGATIVE_NET');
    if (it.netPay === 0) flags.push('ZERO_PAY');
    if (prev && previousNet === null) flags.push('NEW_JOINER');
    if (deltaPct !== null && Math.abs(deltaPct) > VARIANCE_THRESHOLD_PCT)
      flags.push('HIGH_VARIANCE');
    if (flags.length > 0) {
      items.push({
        employeeId: it.employeeId,
        employeeName: it.employeeName,
        currentNet: it.netPay,
        previousNet,
        deltaPct: deltaPct === null ? null : Math.round(deltaPct * 10) / 10,
        flags,
      });
    }
  }
  return {
    runId: run.id,
    thresholdPct: VARIANCE_THRESHOLD_PCT,
    comparedToPeriod: prev?.period ?? null,
    items,
  };
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
    // Only roster runs that have been calculated have a department summary.
    const computed =
      run.type === 'FNF' || run.status === 'DRAFT' || run.status === 'CANCELLED'
        ? { byDepartment: [], warnings: [] }
        : computeRun(
            run.id,
            run.period,
            payslipStatusFor(run),
            getRunInputs(run.id),
            getClaimsForRun(run.id),
          );
    return HttpResponse.json({
      success: true,
      data: {
        ...run,
        summary: { byDepartment: computed.byDepartment, warnings: computed.warnings },
      },
    });
  }),

  http.get('/api/payroll/runs/:id/fnf', ({ params }) => {
    const { id } = params as { id: string };
    const run = runs.find((r) => r.id === id);
    if (!run || run.type !== 'FNF' || !run.employeeId || !run.fnfParams) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No FnF settlement for this run' } },
        { status: 404 },
      );
    }
    const settlement = computeFnf(run.employeeId, run.period, run.fnfParams);
    if (!settlement) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found in payroll' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: settlement });
  }),

  http.post('/api/payroll/runs', async ({ request }) => {
    const body = (await request.json()) as {
      period: string;
      includeAllActiveEmployees: boolean;
      type?: PayrollRunType;
      fnf?: FnfParams;
    };
    const type: PayrollRunType = body.type ?? 'REGULAR';
    const VALID_TYPES: PayrollRunType[] = [
      'REGULAR',
      'OFF_CYCLE',
      'BONUS',
      'ARREARS',
      'FNF',
      'REVERSAL',
    ];
    if (!VALID_TYPES.includes(type)) {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_RUN_TYPE', message: 'Unknown run type' } },
        { status: 422 },
      );
    }
    // Only one REGULAR run per period; off-cycle/bonus/FnF can coexist.
    if (
      type === 'REGULAR' &&
      runs.some((r) => r.period === body.period && r.type === 'REGULAR' && r.status !== 'CANCELLED')
    ) {
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
      type,
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
      employeeId: type === 'FNF' ? (body.fnf?.employeeId ?? null) : null,
      fnfParams: type === 'FNF' ? (body.fnf ?? null) : null,
      createdAt: now,
    };
    runs = [...runs, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.post('/api/payroll/runs/:id/calculate', ({ params, request }) => {
    const { id } = params as { id: string };
    const dryRun = new URL(request.url).searchParams.get('dryRun') === 'true';
    const run = runs.find((r) => r.id === id);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }

    // Dry run (§7.5): compute numbers + variance in a sandbox — never persist, never
    // change status, never attach claims or move money.
    if (dryRun) {
      const computed = computeRunFor(run);
      return HttpResponse.json({
        success: true,
        data: {
          dryRun: true,
          ...computed.totals,
          warnings: computed.warnings,
          variance: buildVariance(run),
        },
      });
    }

    // Attach approved reimbursement claims to this run as it is processed.
    attachApprovedClaimsToRun(id);
    runs = runs.map((r) =>
      r.id === id ? { ...r, status: 'CALCULATING', processedAt: new Date().toISOString() } : r,
    );
    appendAudit(id, 'CALCULATE', run.initiatedBy ?? 'system', `Run recalculated (${run.period})`);
    // Compute real numbers from the engine, then move to REVIEW after a brief delay.
    setTimeout(() => {
      const r0 = runs.find((r) => r.id === id);
      if (!r0) return;
      // FnF runs settle a single employee — totals come from the settlement.
      if (r0.type === 'FNF' && r0.employeeId && r0.fnfParams) {
        const fnf = computeFnf(r0.employeeId, r0.period, r0.fnfParams);
        const totalNet = fnf?.netSettlement ?? 0;
        runs = runs.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'REVIEW',
                employeeCount: fnf ? 1 : 0,
                totalGross: fnf?.grossPayable ?? 0,
                totalDeductions: fnf?.totalRecovery ?? 0,
                employerCost: 0,
                totalNet,
                approvals: buildApprovalChain(totalNet),
                configSnapshotRef: pinConfig(r0.period),
              }
            : r,
        );
        return;
      }
      const computed = computeRun(
        r0.id,
        r0.period,
        'PENDING',
        getRunInputs(id),
        getClaimsForRun(id),
      );
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
              // Configurable approval chain sized by the run's net total.
              approvals: buildApprovalChain(computed.totals.totalNet),
              // Pin the statutory pack version used — recompute is reproducible.
              configSnapshotRef: pinConfig(r0.period),
            }
          : r,
      );
    }, 2000);

    return HttpResponse.json(
      { success: true, data: { status: 'CALCULATING', estimatedSeconds: 5 } },
      { status: 202 },
    );
  }),

  // Single-shot approve (legacy/simple). Marks the whole chain approved at once.
  http.post('/api/payroll/runs/:id/approve', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json().catch(() => ({}))) as { approver?: string; notes?: string };
    const now = new Date().toISOString();
    const actor = body.approver ?? 'superadmin@acme.test';
    runs = runs.map((r) =>
      r.id === id
        ? {
            ...r,
            status: 'APPROVED',
            approvedBy: actor,
            approvedAt: now,
            approvals: (r.approvals ?? []).map((a) => ({
              ...a,
              status: 'APPROVED' as const,
              approver: a.approver ?? actor,
              approvedAt: a.approvedAt ?? now,
            })),
          }
        : r,
    );
    appendAudit(id, 'APPROVE', actor, body.notes);
    const run = runs.find((r) => r.id === id);
    return HttpResponse.json({ success: true, data: run });
  }),

  // Multi-level approval (§8). Enforces maker ≠ checker, distinct approver per level,
  // and sequential ordering. The run is APPROVED only once every level is signed off.
  http.post('/api/payroll/runs/:id/approvals/:level', async ({ params, request }) => {
    const { id, level } = params as { id: string; level: string };
    const body = (await request.json().catch(() => ({}))) as { approver?: string; notes?: string };
    const approver = body.approver ?? '';
    const run = runs.find((r) => r.id === id);
    if (!run || !run.approvals) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run has no approval chain' } },
        { status: 404 },
      );
    }
    if (run.status !== 'REVIEW') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Run is not in review' } },
        { status: 422 },
      );
    }
    // Maker ≠ checker, and an approver may not sign more than one level.
    if (approver && approver === run.initiatedBy) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'SELF_APPROVAL', message: 'The initiator cannot approve their own run' },
        },
        { status: 403 },
      );
    }
    if (run.approvals.some((a) => a.approver === approver && approver)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'SELF_APPROVAL', message: 'A different approver is required per level' },
        },
        { status: 403 },
      );
    }
    const lvl = Number(level);
    const target = run.approvals.find((a) => a.level === lvl);
    if (!target) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Approval level not found' } },
        { status: 404 },
      );
    }
    // Sequential: every lower level must already be approved.
    if (run.approvals.some((a) => a.level < lvl && a.status !== 'APPROVED')) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'OUT_OF_ORDER', message: 'A prior approval level is still pending' },
        },
        { status: 422 },
      );
    }
    const now = new Date().toISOString();
    const approvals = run.approvals.map((a) =>
      a.level === lvl ? { ...a, status: 'APPROVED' as const, approver, approvedAt: now } : a,
    );
    const allApproved = approvals.every((a) => a.status === 'APPROVED');
    runs = runs.map((r) =>
      r.id === id
        ? {
            ...r,
            approvals,
            status: allApproved ? 'APPROVED' : r.status,
            approvedBy: allApproved ? approver : r.approvedBy,
            approvedAt: allApproved ? now : r.approvedAt,
          }
        : r,
    );
    appendAudit(id, `APPROVE_L${lvl}`, approver || 'unknown', body.notes ?? target.label);
    return HttpResponse.json({ success: true, data: runs.find((r) => r.id === id) });
  }),

  http.get('/api/payroll/runs/:id/variance', ({ params }) => {
    const { id } = params as { id: string };
    const run = runs.find((r) => r.id === id);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: buildVariance(run) });
  }),

  http.get('/api/payroll/runs/:id/audit', ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json({ success: true, data: runAudit[id] ?? [] });
  }),

  // Single-employee reprocess (§7.5): recompute just one payslip, deterministically.
  http.post('/api/payroll/runs/:id/payslips/:slipId/recalculate', async ({ params, request }) => {
    const { id, slipId } = params as { id: string; slipId: string };
    const body = (await request.json().catch(() => ({}))) as { actor?: string };
    const run = runs.find((r) => r.id === id);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    const detail = computeRunFor(run).details[slipId];
    if (!detail) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } },
        { status: 404 },
      );
    }
    appendAudit(
      id,
      'REPROCESS',
      body.actor ?? 'system',
      `Recalculated ${detail.employee.firstName}`,
    );
    return HttpResponse.json({ success: true, data: detail });
  }),

  http.patch('/api/payroll/runs/:id/mark-paid', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as {
      paidAt: string;
      paymentReference: string;
      actor?: string;
    };
    runs = runs.map((r) => (r.id === id ? { ...r, status: 'PAID', paidAt: body.paidAt } : r));
    markRunClaimsPaid(id); // attached reimbursement claims are now paid
    appendAudit(id, 'MARK_PAID', body.actor ?? 'system', body.paymentReference);
    const run = runs.find((r) => r.id === id);
    return HttpResponse.json({ success: true, data: run });
  }),

  http.post('/api/payroll/runs/:id/cancel', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json().catch(() => ({}))) as { reason?: string; actor?: string };
    runs = runs.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r));
    appendAudit(id, 'CANCEL', body.actor ?? 'system', body.reason);
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
    const computed = computeRun(
      run.id,
      run.period,
      payslipStatusFor(run),
      getRunInputs(run.id),
      getClaimsForRun(run.id),
    );
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
    const computed = computeRun(
      run.id,
      run.period,
      payslipStatusFor(run),
      getRunInputs(run.id),
      getClaimsForRun(run.id),
    );
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
      ? computeRun(
          run.id,
          run.period,
          payslipStatusFor(run),
          getRunInputs(run.id),
          getClaimsForRun(run.id),
        )
      : null;
    const detail = computed?.details[payslipId];
    appendAudit(
      runId,
      'ADJUST',
      (body.actor as string) ?? 'system',
      `Adjusted payslip ${payslipId}`,
    );
    return HttpResponse.json({ success: true, data: { ...detail, ...body, hasAdjustments: true } });
  }),

  http.get('/api/payroll/runs/:runId/export', ({ params }) => {
    const { runId } = params as { runId: string };
    const run = runs.find((r) => r.id === runId);
    const computed = run
      ? computeRun(
          run.id,
          run.period,
          payslipStatusFor(run),
          getRunInputs(run.id),
          getClaimsForRun(run.id),
        )
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
