import { http, HttpResponse } from 'msw';
import type {
  PayEquityGroupBy,
  PayEquityGroup,
  PayEquityReport,
  DataPolicy,
  DataPolicyInput,
  AuditPack,
} from '@/modules/payroll/types/payroll.types';
import { getRosterComp } from '../data/payroll-engine';
import { getRunRecord, getRunAuditEntries } from './payroll-runs';

const CURRENCY = 'INR';

const GROUP_BYS: PayEquityGroupBy[] = ['gender', 'level', 'location'];
function isGroupBy(value: string): value is PayEquityGroupBy {
  return (GROUP_BYS as string[]).includes(value);
}

/**
 * Demographic overlay for the demo roster — gender + seniority level. Location is the
 * employee's jurisdiction (from the roster). This is seed data, not logic: pay-equity
 * joins it with compensation; no rule is derived in code.
 */
const DEMOGRAPHICS: Record<string, { gender: string; level: string }> = {
  'emp-001': { gender: 'Male', level: 'Senior' },
  'emp-004': { gender: 'Female', level: 'IC' },
  'emp-005': { gender: 'Male', level: 'IC' },
  'emp-006': { gender: 'Female', level: 'Lead' },
  'emp-007': { gender: 'Male', level: 'Senior' },
  'emp-008': { gender: 'Female', level: 'IC' },
  'emp-009': { gender: 'Female', level: 'Lead' },
  'emp-010': { gender: 'Male', level: 'Lead' },
  'emp-011': { gender: 'Female', level: 'IC' },
  'emp-012': { gender: 'Male', level: 'IC' },
};

const LOCATION_LABELS: Record<string, string> = {
  'IN-MH': 'Maharashtra',
  'IN-KA': 'Karnataka',
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildPayEquity(groupBy: PayEquityGroupBy): PayEquityReport {
  const roster = getRosterComp();
  const buckets = new Map<string, number[]>();
  for (const r of roster) {
    let key: string;
    if (groupBy === 'gender') key = DEMOGRAPHICS[r.employeeId]?.gender ?? 'Undisclosed';
    else if (groupBy === 'level') key = DEMOGRAPHICS[r.employeeId]?.level ?? 'Unbanded';
    else key = LOCATION_LABELS[r.jurisdiction] ?? r.jurisdiction;
    const arr = buckets.get(key) ?? [];
    arr.push(r.annualCtc);
    buckets.set(key, arr);
  }

  const raw = [...buckets.entries()].map(([group, pays]) => ({
    group,
    headcount: pays.length,
    meanPay: Math.round(pays.reduce((s, p) => s + p, 0) / pays.length),
    medianPay: Math.round(median(pays)),
  }));

  // Reference = highest mean group; gaps are relative to it.
  const refMean = Math.max(...raw.map((g) => g.meanPay), 0);
  const refMedian = Math.max(...raw.map((g) => g.medianPay), 0);
  const reference = raw.find((g) => g.meanPay === refMean);

  const groups: PayEquityGroup[] = raw
    .map((g) => ({
      ...g,
      meanGapPct: refMean > 0 ? round1(((refMean - g.meanPay) / refMean) * 100) : 0,
      medianGapPct: refMedian > 0 ? round1(((refMedian - g.medianPay) / refMedian) * 100) : 0,
    }))
    .sort((a, b) => b.meanPay - a.meanPay);

  return {
    groupBy,
    currency: CURRENCY,
    referenceGroup: reference?.group ?? '',
    overallMeanGapPct: Math.max(0, ...groups.map((g) => g.meanGapPct)),
    overallMedianGapPct: Math.max(0, ...groups.map((g) => g.medianGapPct)),
    groups,
    generatedAt: new Date().toISOString(),
  };
}

/* ── Data residency & retention policy ──────────────────────────────────────── */

let dataPolicy: DataPolicy = {
  defaultRetentionYears: 7,
  policies: [
    { country: 'IN', residencyRegion: 'ap-south-1', retentionYears: 8, statutoryHold: true },
    { country: 'US', residencyRegion: 'us-east-1', retentionYears: 7, statutoryHold: false },
    { country: 'GB', residencyRegion: 'eu-west-2', retentionYears: 6, statutoryHold: false },
  ],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const payrollComplianceHandlers = [
  http.get('/api/payroll/reports/pay-equity', ({ request }) => {
    const groupBy = new URL(request.url).searchParams.get('groupBy') ?? 'gender';
    if (!isGroupBy(groupBy)) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNKNOWN_GROUP_BY', message: 'Unknown groupBy' } },
        { status: 422 },
      );
    }
    return HttpResponse.json({ success: true, data: buildPayEquity(groupBy) });
  }),

  http.get('/api/payroll/reports/audit-pack', ({ request }) => {
    const runId = new URL(request.url).searchParams.get('runId') ?? '';
    const run = getRunRecord(runId);
    if (!run) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    const pack: AuditPack = {
      run: {
        id: run.id,
        period: run.period,
        periodLabel: run.periodLabel,
        status: run.status,
        employeeCount: run.employeeCount,
        totalGross: run.totalGross,
        totalNet: run.totalNet,
        currency: run.currency,
      },
      configPin: run.configSnapshotRef ?? null,
      approvalChain: run.approvals ?? [],
      auditLog: getRunAuditEntries(runId),
      generatedAt: new Date().toISOString(),
    };
    return new HttpResponse(JSON.stringify(pack, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="audit-pack-${run.period}-${run.id}.json"`,
      },
    });
  }),

  http.get('/api/payroll/settings/data-policy', () => {
    return HttpResponse.json({ success: true, data: dataPolicy });
  }),

  http.patch('/api/payroll/settings/data-policy', async ({ request }) => {
    const body = (await request.json()) as DataPolicyInput;
    dataPolicy = {
      defaultRetentionYears: body.defaultRetentionYears ?? dataPolicy.defaultRetentionYears,
      policies: body.policies ?? dataPolicy.policies,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: dataPolicy });
  }),
];
