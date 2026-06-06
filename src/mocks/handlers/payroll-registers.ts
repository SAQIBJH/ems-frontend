import { http, HttpResponse } from 'msw';
import type {
  Payslip,
  PayrollRegister,
  PayrollRegisterType,
  RegisterColumn,
  RegisterSummaryItem,
} from '@/modules/payroll/types/payroll.types';
import { formatMajor } from '@/modules/payroll/utils/money.utils';
import { computeRun } from '../data/payroll-engine';
import {
  resolveStatutoryReturn,
  isStatutoryReturnType,
  type ReturnEmployeeContext,
} from '../data/statutory-returns';
import { getRunMeta, getRunVariance } from './payroll-runs';
import { getRunInputs } from './payroll-inputs';
import { getClaimsForRun } from './payroll-claims';
import { getComponentByCode } from './payroll-components';
import { resolveActivePack } from './payroll-statutory';

// The demo roster operates under the India legal entity (INR) — mirrors tax-forms.
const REGISTER_COUNTRY = 'IN';
const CURRENCY = 'INR';

const REGISTER_TYPES: PayrollRegisterType[] = ['SALARY', 'STATUTORY', 'BANK_ADVICE', 'VARIANCE'];

function isRegisterType(value: string): value is PayrollRegisterType {
  return (REGISTER_TYPES as string[]).includes(value);
}

function parsePeriod(period: string): { year: number; month: number } {
  const [year, month] = period.split('-').map(Number);
  return { year, month };
}

function periodLabel(period: string): string {
  const { year, month } = parsePeriod(period);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function money(value: number): string {
  return formatMajor(value, CURRENCY, { fractionDigits: 0 });
}

/** Merge a payslip's deductions + employer contributions into a code→amount map. */
function statutoryAmounts(payslip: Payslip): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of [...payslip.deductions, ...(payslip.employerContributions ?? [])]) {
    map[l.code] = (map[l.code] ?? 0) + l.amount;
  }
  return map;
}

/* ── Register builders ──────────────────────────────────────────────────────── */

function buildRegister(runId: string, type: PayrollRegisterType): PayrollRegister | null {
  const meta = getRunMeta(runId);
  if (!meta) return null;
  const status = meta.status === 'PAID' ? ('PAID' as const) : ('PENDING' as const);
  const computed = computeRun(
    runId,
    meta.period,
    status,
    getRunInputs(runId),
    getClaimsForRun(runId),
  );
  const payslips = Object.values(computed.details);

  const base = {
    register: type,
    runId,
    period: meta.period,
    periodLabel: periodLabel(meta.period),
    currency: CURRENCY,
    generatedAt: `${meta.period}-28T10:00:00.000Z`,
  };

  if (type === 'SALARY') {
    const columns: RegisterColumn[] = [
      { key: 'employeeCode', label: 'Code', align: 'left', kind: 'text' },
      { key: 'employeeName', label: 'Employee', align: 'left', kind: 'text' },
      { key: 'department', label: 'Department', align: 'left', kind: 'text' },
      { key: 'gross', label: 'Gross', align: 'right', kind: 'money' },
      { key: 'deductions', label: 'Deductions', align: 'right', kind: 'money' },
      { key: 'employerCost', label: 'Employer cost', align: 'right', kind: 'money' },
      { key: 'net', label: 'Net pay', align: 'right', kind: 'money' },
    ];
    const rows = payslips.map((p) => ({
      employeeCode: p.employee.employeeCode,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      department: p.employee.departmentName,
      gross: p.grossEarnings,
      deductions: p.totalDeductions,
      employerCost: p.employerCost ?? 0,
      net: p.netPay,
    }));
    const sum = (k: 'grossEarnings' | 'totalDeductions' | 'employerCost' | 'netPay') =>
      payslips.reduce((s, p) => s + (p[k] ?? 0), 0);
    const summary: RegisterSummaryItem[] = [
      { label: 'Employees', value: String(payslips.length) },
      { label: 'Total gross', value: money(sum('grossEarnings')) },
      { label: 'Total deductions', value: money(sum('totalDeductions')) },
      { label: 'Total employer cost', value: money(sum('employerCost')) },
      { label: 'Total net', value: money(sum('netPay')) },
    ];
    return { ...base, columns, rows, summary };
  }

  if (type === 'STATUTORY') {
    const pack = resolveActivePack(REGISTER_COUNTRY, meta.period);
    const perEmployee = payslips.map((p) => ({ payslip: p, amounts: statutoryAmounts(p) }));
    // Columns come from the pack's statutory component codes that actually appear in
    // the run — derived from config, never a hardcoded country column set.
    const present = (pack?.statutoryComponents ?? []).filter((code) =>
      perEmployee.some((e) => (e.amounts[code] ?? 0) !== 0),
    );
    const columns: RegisterColumn[] = [
      { key: 'employeeCode', label: 'Code', align: 'left', kind: 'text' },
      { key: 'employeeName', label: 'Employee', align: 'left', kind: 'text' },
      ...present.map<RegisterColumn>((code) => ({
        key: `c_${code}`,
        label: getComponentByCode(code)?.name ?? code,
        align: 'right',
        kind: 'money',
      })),
      { key: 'total', label: 'Total statutory', align: 'right', kind: 'money' },
    ];
    const rows = perEmployee.map(({ payslip, amounts }) => {
      const row: Record<string, string | number> = {
        employeeCode: payslip.employee.employeeCode,
        employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
      };
      let total = 0;
      for (const code of present) {
        const amt = amounts[code] ?? 0;
        row[`c_${code}`] = amt;
        total += amt;
      }
      row.total = total;
      return row;
    });
    const summary: RegisterSummaryItem[] = [
      { label: 'Employees', value: String(payslips.length) },
      ...present.map((code) => ({
        label: getComponentByCode(code)?.name ?? code,
        value: money(perEmployee.reduce((s, e) => s + (e.amounts[code] ?? 0), 0)),
      })),
    ];
    return { ...base, columns, rows, summary };
  }

  if (type === 'BANK_ADVICE') {
    const columns: RegisterColumn[] = [
      { key: 'employeeCode', label: 'Code', align: 'left', kind: 'text' },
      { key: 'employeeName', label: 'Payee', align: 'left', kind: 'text' },
      { key: 'amount', label: 'Net payable', align: 'right', kind: 'money' },
      { key: 'currency', label: 'Currency', align: 'left', kind: 'text' },
      { key: 'reference', label: 'Reference', align: 'left', kind: 'text' },
    ];
    const rows = payslips.map((p) => ({
      employeeCode: p.employee.employeeCode,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      amount: p.netPay,
      currency: CURRENCY,
      reference: `PAY/${meta.period}/${p.employee.employeeCode}`,
    }));
    const summary: RegisterSummaryItem[] = [
      { label: 'Payees', value: String(payslips.length) },
      { label: 'Total payable', value: money(payslips.reduce((s, p) => s + p.netPay, 0)) },
    ];
    return { ...base, columns, rows, summary };
  }

  // VARIANCE — reuse the run's variance computation.
  const variance = getRunVariance(runId);
  const columns: RegisterColumn[] = [
    { key: 'employeeName', label: 'Employee', align: 'left', kind: 'text' },
    { key: 'currentNet', label: 'Current net', align: 'right', kind: 'money' },
    { key: 'previousNet', label: 'Previous net', align: 'right', kind: 'money' },
    { key: 'deltaPct', label: 'Δ %', align: 'right', kind: 'percent' },
    { key: 'flags', label: 'Flags', align: 'left', kind: 'text' },
  ];
  const rows = (variance?.items ?? []).map((it) => ({
    employeeName: it.employeeName,
    currentNet: it.currentNet,
    previousNet: it.previousNet,
    deltaPct: it.deltaPct,
    flags: it.flags.join(', '),
  }));
  const summary: RegisterSummaryItem[] = [
    { label: 'Compared to', value: variance?.comparedToPeriod ?? 'No prior run' },
    { label: 'Threshold', value: `${variance?.thresholdPct ?? 0}%` },
    { label: 'Flagged', value: String(rows.length) },
  ];
  return { ...base, columns, rows, summary };
}

/** Generic CSV serialization of a register — header from labels, raw cell values. */
function registerToCsv(register: PayrollRegister): string {
  const header = register.columns.map((c) => `"${c.label}"`).join(',');
  const rows = register.rows.map((row) =>
    register.columns
      .map((c) => {
        const v = row[c.key];
        if (v === null || v === undefined) return '';
        return typeof v === 'number' ? String(v) : `"${String(v).replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  return [header, ...rows].join('\n');
}

/* ── Statutory-return context ───────────────────────────────────────────────── */

function returnContext(payslip: Payslip): ReturnEmployeeContext {
  const contributions = statutoryAmounts(payslip);
  const taxable = payslip.earnings.filter((e) => e.taxable).reduce((s, e) => s + e.amount, 0);
  return {
    employeeCode: payslip.employee.employeeCode,
    employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
    gross: payslip.grossEarnings,
    taxable,
    taxDeducted: payslip.deductions.find((d) => d.code === 'TDS')?.amount ?? 0,
    net: payslip.netPay,
    lopDays: payslip.lopDays,
    contributions,
  };
}

export const payrollRegisterHandlers = [
  // Self-describing register for a run (columns are config, rows are raw).
  http.get('/api/payroll/runs/:id/register', ({ params, request }) => {
    const { id } = params as { id: string };
    const type = new URL(request.url).searchParams.get('type') ?? 'SALARY';
    if (!isRegisterType(type)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'UNKNOWN_REGISTER_TYPE', message: 'Unknown register type' },
        },
        { status: 422 },
      );
    }
    const register = buildRegister(id, type);
    if (!register) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: register });
  }),

  // CSV export of a register.
  http.get('/api/payroll/runs/:id/register/export', ({ params, request }) => {
    const { id } = params as { id: string };
    const type = new URL(request.url).searchParams.get('type') ?? 'SALARY';
    if (!isRegisterType(type)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'UNKNOWN_REGISTER_TYPE', message: 'Unknown register type' },
        },
        { status: 422 },
      );
    }
    const register = buildRegister(id, type);
    if (!register) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    return new HttpResponse(registerToCsv(register), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="register-${register.period}-${type}.csv"`,
      },
    });
  }),

  // Statutory filing return — exporter driven by the pack + template registry.
  http.get('/api/payroll/runs/:id/statutory-return', ({ params, request }) => {
    const { id } = params as { id: string };
    const type = new URL(request.url).searchParams.get('type') ?? 'ECR';
    if (!isStatutoryReturnType(type)) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNKNOWN_RETURN_TYPE', message: 'Unknown return type' } },
        { status: 422 },
      );
    }
    const meta = getRunMeta(id);
    if (!meta) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    const status = meta.status === 'PAID' ? ('PAID' as const) : ('PENDING' as const);
    const computed = computeRun(id, meta.period, status, getRunInputs(id), getClaimsForRun(id));
    const file = resolveStatutoryReturn({
      type,
      period: meta.period,
      employees: Object.values(computed.details).map(returnContext),
    });
    return new HttpResponse(file.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
      },
    });
  }),
];
