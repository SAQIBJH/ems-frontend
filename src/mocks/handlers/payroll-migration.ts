import { http, HttpResponse } from 'msw';
import type {
  PayCalendar,
  PayCalendarInput,
  OpeningBalance,
  OpeningBalanceInput,
  HistoricalPayslipImportRow,
  HistoricalPayslipImportResult,
  ParallelReconcileInput,
  ParallelReconcileResult,
  ReconcileItem,
  ReconcileStatus,
  MigrationStatus,
  MigrationStatusInput,
} from '@/modules/payroll/types/payroll.types';
import { computeRun, getRosterSummary } from '../data/payroll-engine';
import { getRunMeta } from './payroll-runs';
import { getRunInputs } from './payroll-inputs';
import { getClaimsForRun } from './payroll-claims';

const CURRENCY = 'INR';

/* ── In-memory stores ───────────────────────────────────────────────────────── */

let payCalendars: PayCalendar[] = [
  {
    id: 'cal-in',
    name: 'India Monthly',
    legalEntityId: 'le-in',
    frequency: 'MONTHLY',
    periodAnchor: 1,
    payDateRule: 'LAST_WORKING_DAY',
    payDay: null,
    cutoffDay: 25,
    holidayCalendarId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
let calendarCounter = 100;

// Opening YTD balances keyed by `${employeeId}::${fiscalYear}` (re-post replaces).
const openingBalances = new Map<string, OpeningBalance>();

let historicalPayslips: HistoricalPayslipImportRow[] = [];

const migration = {
  sandboxMode: true,
  goLivePeriod: null as string | null,
  lastReconciledRunId: null as string | null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function migrationStatus(): MigrationStatus {
  return {
    sandboxMode: migration.sandboxMode,
    goLivePeriod: migration.goLivePeriod,
    openingBalancesCount: openingBalances.size,
    historicalPayslipsCount: historicalPayslips.length,
    lastReconciledRunId: migration.lastReconciledRunId,
    updatedAt: migration.updatedAt,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

/* ── Handlers ───────────────────────────────────────────────────────────────── */

export const payrollMigrationHandlers = [
  /* Pay calendars */
  http.get('/api/payroll/pay-calendars', () => {
    return HttpResponse.json({ success: true, data: payCalendars });
  }),

  http.post('/api/payroll/pay-calendars', async ({ request }) => {
    const body = (await request.json()) as PayCalendarInput;
    const created: PayCalendar = {
      ...body,
      id: `cal-${++calendarCounter}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    payCalendars = [...payCalendars, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/pay-calendars/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<PayCalendarInput>;
    const idx = payCalendars.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Pay calendar not found' } },
        { status: 404 },
      );
    }
    const updated: PayCalendar = {
      ...payCalendars[idx],
      ...body,
      id,
      updatedAt: nowIso(),
    };
    payCalendars = [...payCalendars.slice(0, idx), updated, ...payCalendars.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),

  /* Opening YTD balances */
  http.get('/api/payroll/opening-balances', () => {
    return HttpResponse.json({ success: true, data: [...openingBalances.values()] });
  }),

  http.post('/api/payroll/employees/:id/opening-balances', async ({ params, request }) => {
    const { id } = params as { id: string };
    const employee = getRosterSummary().find((e) => e.employeeId === id);
    if (!employee) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not on roster' } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as OpeningBalanceInput;
    const record: OpeningBalance = {
      employeeId: id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      fiscalYear: body.fiscalYear,
      grossEarnings: body.grossEarnings,
      taxableIncome: body.taxableIncome,
      taxDeducted: body.taxDeducted,
      totalDeductions: body.totalDeductions,
      netPay: body.netPay,
      contributions: body.contributions ?? {},
      importedAt: nowIso(),
    };
    openingBalances.set(`${id}::${body.fiscalYear}`, record);
    migration.updatedAt = nowIso();
    return HttpResponse.json({ success: true, data: record }, { status: 201 });
  }),

  /* Historical payslips */
  http.get('/api/payroll/migration/historical-payslips', () => {
    return HttpResponse.json({
      success: true,
      data: { count: historicalPayslips.length, rows: historicalPayslips },
    });
  }),

  http.post('/api/payroll/migration/historical-payslips', async ({ request }) => {
    const body = (await request.json()) as { rows: HistoricalPayslipImportRow[] };
    const rows = body.rows ?? [];
    const codes = new Set(getRosterSummary().map((e) => e.employeeCode));
    const errors: HistoricalPayslipImportResult['errors'] = [];
    let imported = 0;
    rows.forEach((row, i) => {
      if (!row.employeeCode || !codes.has(row.employeeCode)) {
        errors.push({ row: i + 1, message: `Unknown employee code "${row.employeeCode ?? ''}"` });
        return;
      }
      if (!/^\d{4}-\d{2}$/.test(row.period ?? '')) {
        errors.push({ row: i + 1, message: 'Period must be YYYY-MM' });
        return;
      }
      historicalPayslips = [...historicalPayslips, row];
      imported++;
    });
    migration.updatedAt = nowIso();
    const result: HistoricalPayslipImportResult = { imported, failed: errors.length, errors };
    return HttpResponse.json({ success: true, data: result });
  }),

  /* Parallel run reconcile */
  http.post('/api/payroll/runs/:id/parallel-reconcile', async ({ params, request }) => {
    const { id } = params as { id: string };
    const meta = getRunMeta(id);
    if (!meta) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as ParallelReconcileInput;
    const tolerance = Math.max(0, body.tolerance ?? 0);
    const legacyByCode = new Map((body.legacy ?? []).map((l) => [l.employeeCode, l.netPay]));

    const status = meta.status === 'PAID' ? ('PAID' as const) : ('PENDING' as const);
    const computed = computeRun(id, meta.period, status, getRunInputs(id), getClaimsForRun(id));

    let matched = 0;
    let mismatched = 0;
    let missing = 0;
    const items: ReconcileItem[] = computed.items.map((it) => {
      const has = legacyByCode.has(it.employeeCode);
      const legacyNet = has ? legacyByCode.get(it.employeeCode)! : null;
      const diff = legacyNet === null ? 0 : it.netPay - legacyNet;
      let recStatus: ReconcileStatus;
      if (legacyNet === null) {
        recStatus = 'MISSING';
        missing++;
      } else if (Math.abs(diff) <= tolerance) {
        recStatus = 'MATCH';
        matched++;
      } else {
        recStatus = 'MISMATCH';
        mismatched++;
      }
      return {
        employeeId: it.employeeId,
        employeeCode: it.employeeCode,
        employeeName: it.employeeName,
        computedNet: it.netPay,
        legacyNet,
        diff,
        status: recStatus,
      };
    });

    migration.lastReconciledRunId = id;
    migration.updatedAt = nowIso();

    const result: ParallelReconcileResult = {
      runId: id,
      period: meta.period,
      currency: CURRENCY,
      tolerance,
      matched,
      mismatched,
      missing,
      items,
      generatedAt: nowIso(),
    };
    return HttpResponse.json({ success: true, data: result });
  }),

  /* Migration status (sandbox + go-live) */
  http.get('/api/payroll/migration/status', () => {
    return HttpResponse.json({ success: true, data: migrationStatus() });
  }),

  http.patch('/api/payroll/migration/status', async ({ request }) => {
    const body = (await request.json()) as MigrationStatusInput;
    if (typeof body.sandboxMode === 'boolean') migration.sandboxMode = body.sandboxMode;
    if (body.goLivePeriod !== undefined) migration.goLivePeriod = body.goLivePeriod;
    migration.updatedAt = nowIso();
    return HttpResponse.json({ success: true, data: migrationStatus() });
  }),
];
