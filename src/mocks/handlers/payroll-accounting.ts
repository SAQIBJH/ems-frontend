import { http, HttpResponse } from 'msw';
import type { JournalDocument, JournalLine } from '@/modules/payroll/types/payroll.types';
import { computeRun } from '../data/payroll-engine';
import { getRunMeta } from './payroll-runs';
import { getRunInputs } from './payroll-inputs';
import { getClaimsForRun } from './payroll-claims';
import { getComponentByCode } from './payroll-components';

const CURRENCY = 'INR';

// Tenant-level control accounts — config, not derived from any country rule.
const NET_PAY_ACCOUNT = '2100 — Net pay payable';
const EMPLOYER_LIABILITY_ACCOUNT = '2400 — Employer statutory payable';
const MISC_EXPENSE_ACCOUNT = '5095 — Other earnings';
const MISC_PAYABLE_ACCOUNT = '2390 — Other payables';

/* ── Journal builder ───────────────────────────────────────────────────────── */

type Side = 'DEBIT' | 'CREDIT';

interface Accumulator {
  account: string;
  costCenter: string | null;
  debit: number;
  credit: number;
}

function keyOf(account: string, costCenter: string | null): string {
  return `${account}||${costCenter ?? ''}`;
}

function add(
  map: Map<string, Accumulator>,
  account: string,
  costCenter: string | null,
  side: Side,
  amount: number,
): void {
  if (amount === 0) return;
  const key = keyOf(account, costCenter);
  const existing = map.get(key) ?? { account, costCenter, debit: 0, credit: 0 };
  if (side === 'DEBIT') existing.debit += amount;
  else existing.credit += amount;
  map.set(key, existing);
}

/**
 * Build the run's balanced double-entry journal generically from its payslips:
 *  - earnings + employer-contribution components → DR their expense account (cost-centred)
 *  - deductions → CR their payable account
 *  - employer contributions → CR the employer-liability control account
 *  - net pay → CR the net-pay control account
 * Every account comes from component `glAccountCode` / `costCenterRule` — never hardcoded.
 */
export function buildJournal(runId: string): JournalDocument | null {
  const meta = getRunMeta(runId);
  if (!meta) return null;
  const computed = computeRun(
    runId,
    meta.period,
    'PENDING',
    getRunInputs(runId),
    getClaimsForRun(runId),
  );

  const map = new Map<string, Accumulator>();
  let totalEmployerContrib = 0;
  let totalNet = 0;

  for (const payslip of Object.values(computed.details)) {
    const dept = payslip.employee.departmentName;

    for (const line of payslip.earnings) {
      const comp = getComponentByCode(line.code);
      const account = comp?.glAccountCode ?? MISC_EXPENSE_ACCOUNT;
      const costCenter = (comp?.costCenterRule ?? 'DEPARTMENT') === 'DEPARTMENT' ? dept : null;
      add(map, account, costCenter, 'DEBIT', line.amount);
    }

    for (const line of payslip.employerContributions ?? []) {
      const comp = getComponentByCode(line.code);
      const account = comp?.glAccountCode ?? EMPLOYER_LIABILITY_ACCOUNT;
      const costCenter = (comp?.costCenterRule ?? 'DEPARTMENT') === 'DEPARTMENT' ? dept : null;
      add(map, account, costCenter, 'DEBIT', line.amount);
      totalEmployerContrib += line.amount;
    }

    for (const line of payslip.deductions) {
      const comp = getComponentByCode(line.code);
      const account = comp?.glAccountCode ?? MISC_PAYABLE_ACCOUNT;
      const costCenter = (comp?.costCenterRule ?? 'NONE') === 'DEPARTMENT' ? dept : null;
      add(map, account, costCenter, 'CREDIT', line.amount);
    }

    for (const ot of payslip.oneTimeAdditions) {
      add(map, MISC_EXPENSE_ACCOUNT, dept, 'DEBIT', ot.amount);
    }
    for (const ot of payslip.oneTimeDeductions) {
      add(map, MISC_PAYABLE_ACCOUNT, null, 'CREDIT', ot.amount);
    }

    totalNet += payslip.netPay;
  }

  // Control-account credits: employer liability + net pay to bank.
  add(map, EMPLOYER_LIABILITY_ACCOUNT, null, 'CREDIT', totalEmployerContrib);
  add(map, NET_PAY_ACCOUNT, null, 'CREDIT', totalNet);

  const lines: JournalLine[] = [...map.values()]
    .map((a) => ({
      account: a.account,
      costCenter: a.costCenter,
      debit: Math.round(a.debit),
      credit: Math.round(a.credit),
      currency: CURRENCY,
    }))
    .sort((x, y) => {
      // Debits first, then credits; within each, by account then cost center.
      const sideX = x.debit > 0 ? 0 : 1;
      const sideY = y.debit > 0 ? 0 : 1;
      if (sideX !== sideY) return sideX - sideY;
      if (x.account !== y.account) return x.account.localeCompare(y.account);
      return (x.costCenter ?? '').localeCompare(y.costCenter ?? '');
    });

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  return {
    runId,
    period: meta.period,
    currency: CURRENCY,
    lines,
    totalDebit,
    totalCredit,
    balanced: totalDebit === totalCredit,
    generatedAt: new Date().toISOString(),
  };
}

/* ── Export serializers (format registry) ──────────────────────────────────── */

const EXPORT_FORMATS = new Set(['CSV', 'TALLY', 'QUICKBOOKS']);

function money(n: number): string {
  return n.toFixed(2);
}

const serializers: Record<string, (doc: JournalDocument) => string> = {
  CSV: (doc) => {
    const header = 'account,costCenter,debit,credit,currency';
    const rows = doc.lines.map(
      (l) =>
        `"${l.account}","${l.costCenter ?? ''}",${money(l.debit)},${money(l.credit)},${l.currency}`,
    );
    return [header, ...rows].join('\n');
  },
  TALLY: (doc) => {
    // Simplified Tally voucher: Dr/Cr lines for one journal voucher.
    const head = `VOUCHER TYPE: Journal\nDATE: ${doc.period}\nNARRATION: Payroll ${doc.period}`;
    const body = doc.lines.map((l) =>
      l.debit > 0
        ? `Dr\t${l.account}\t${money(l.debit)}${l.costCenter ? `\t[${l.costCenter}]` : ''}`
        : `Cr\t${l.account}\t${money(l.credit)}${l.costCenter ? `\t[${l.costCenter}]` : ''}`,
    );
    return [head, ...body].join('\n');
  },
  QUICKBOOKS: (doc) => {
    // QuickBooks Online journal-import CSV layout.
    const header = 'JournalNo,JournalDate,Account,Debits,Credits,Description,Location';
    const rows = doc.lines.map(
      (l) =>
        `PR-${doc.period},${doc.period}-28,"${l.account}",${l.debit > 0 ? money(l.debit) : ''},${
          l.credit > 0 ? money(l.credit) : ''
        },"Payroll ${doc.period}","${l.costCenter ?? ''}"`,
    );
    return [header, ...rows].join('\n');
  },
};

const EXPORT_EXT: Record<string, string> = { CSV: 'csv', TALLY: 'txt', QUICKBOOKS: 'csv' };

export const payrollAccountingHandlers = [
  http.get('/api/payroll/runs/:id/journal', ({ params }) => {
    const { id } = params as { id: string };
    const doc = buildJournal(id);
    if (!doc) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: doc });
  }),

  http.get('/api/payroll/runs/:id/journal/export', ({ params, request }) => {
    const { id } = params as { id: string };
    const format = (new URL(request.url).searchParams.get('format') ?? 'CSV').toUpperCase();
    if (!EXPORT_FORMATS.has(format)) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNKNOWN_FORMAT', message: 'Unknown export format' } },
        { status: 422 },
      );
    }
    const doc = buildJournal(id);
    if (!doc) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    const file = serializers[format](doc);
    return new HttpResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="journal-${doc.period}-${format}.${EXPORT_EXT[format]}"`,
      },
    });
  }),
];
