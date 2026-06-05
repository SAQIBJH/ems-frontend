/**
 * Payroll calculation engine (mock-server side).
 *
 * Given a fixed roster of employees with a CTC and a pay group, this computes
 * **real** payslips by running the component dependency graph (`computeComponentBreakdown`)
 * per employee, applying proration, and splitting lines into earnings / deductions /
 * employer contributions. Run totals and the department summary are derived from
 * these payslips — nothing is hardcoded. Same inputs → same numbers (reproducible).
 */
import type {
  SalaryComponent,
  PayslipLine,
  PayslipRunItem,
  Payslip,
  PayslipStatus,
  PayslipYtd,
  PayrollRunDeptSummary,
  PayrollRunWarning,
} from '@/modules/payroll/types/payroll.types';
import type { TaxRegime } from '@/modules/payroll/types/statutory.types';
import {
  computeComponentBreakdown,
  computeContribution,
  projectPeriodTax,
  registerSlabTables,
} from '@/modules/payroll/utils/formula.utils';
import { prorationFactor } from '@/modules/payroll/utils/proration.utils';
import { getComponentById } from '../handlers/payroll-components';
import { getGroupById } from '../handlers/payroll-groups';
import { resolveActivePack } from '../handlers/payroll-statutory';
import { getFiscalYearStartMonth } from '../handlers/payroll-localization';

const CURRENCY = 'INR';
const COMPANY = { name: 'Acme Corp', address: '123 Tech Park, Pune 411001', logoUrl: null };
const STD_WORKING_DAYS = 22;

interface RosterEmployee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  designation: string;
  payGroupId: string;
  annualCtc: number;
  country: string;
  lopDays: number;
}

// A fixed payroll roster. Variation in CTC flows through the SPECIAL_ALLOW formula
// (CTC − BASIC − HRA − …), so each employee gets a genuinely different payslip.
const ROSTER: RosterEmployee[] = [
  ['emp-001', 'E0001', 'Aman', 'Kumar', 'Engineering', 'Senior Engineer', 2400000, 0],
  ['emp-004', 'E0004', 'Priya', 'Sharma', 'Engineering', 'Software Engineer', 1200000, 1],
  ['emp-005', 'E0005', 'Rohan', 'Mehta', 'Sales', 'Account Executive', 1080000, 0],
  ['emp-006', 'E0006', 'Nisha', 'Iyer', 'Product', 'Product Manager', 1800000, 0],
  ['emp-007', 'E0007', 'Vikram', 'Singh', 'Engineering', 'Staff Engineer', 3000000, 0],
  ['emp-008', 'E0008', 'Asha', 'Joshi', 'Finance', 'Financial Analyst', 1320000, 0],
  ['emp-009', 'E0009', 'Sneha', 'Rao', 'Operations', 'Ops Lead', 1560000, 2],
  ['emp-010', 'E0010', 'Karan', 'Patel', 'Sales', 'Sales Manager', 1680000, 0],
  ['emp-011', 'E0011', 'Meera', 'Nair', 'Product', 'Designer', 1140000, 0],
  ['emp-012', 'E0012', 'Arjun', 'Reddy', 'Engineering', 'Software Engineer', 1260000, 0],
].map(
  ([
    employeeId,
    employeeCode,
    firstName,
    lastName,
    departmentName,
    designation,
    annualCtc,
    lopDays,
  ]) => ({
    employeeId: employeeId as string,
    employeeCode: employeeCode as string,
    firstName: firstName as string,
    lastName: lastName as string,
    departmentName: departmentName as string,
    designation: designation as string,
    payGroupId: 'pg-001',
    annualCtc: annualCtc as number,
    country: 'IN',
    lopDays: lopDays as number,
  }),
);

// One intentionally unconfigured employee → produces a "no salary config" warning.
const UNCONFIGURED: RosterEmployee = {
  employeeId: 'emp-099',
  employeeCode: 'E0099',
  firstName: 'Ravi',
  lastName: 'Verma',
  departmentName: 'Engineering',
  designation: 'Intern',
  payGroupId: 'pg-missing',
  annualCtc: 0,
  country: 'IN',
  lopDays: 0,
};

const FULL_ROSTER = [...ROSTER, UNCONFIGURED];

/** Resolve a pay group's effective components, applying group-level overrides. */
function resolveGroupComponents(payGroupId: string): SalaryComponent[] | null {
  const group = getGroupById(payGroupId);
  if (!group) return null;
  const resolved: SalaryComponent[] = [];
  for (const gc of group.components) {
    const base = getComponentById(gc.componentId);
    if (!base) continue;
    resolved.push({
      ...base,
      calculationType: gc.overrideCalculationType ?? base.calculationType,
      value: gc.overrideValue ?? base.value,
      formula: gc.overrideFormula ?? base.formula,
    });
  }
  return resolved;
}

/** Override a payslip line's amount by code, or append it if absent. */
function upsertLine(lines: PayslipLine[], code: string, name: string, amount: number): void {
  const existing = lines.find((l) => l.code === code);
  if (existing) existing.amount = amount;
  else lines.push({ code, name, amount, taxable: false });
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

/* ── Fiscal-year helpers (drive YTD windows + tax projection periods) ──────── */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function currentPeriodString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

interface FiscalInfo {
  fyLabel: string;
  /** 1-based position of `period` within its fiscal year. */
  monthIndex: number;
  totalMonths: number;
  startYear: number;
  startMonth: number;
}

function fiscalInfo(country: string, period: string): FiscalInfo {
  const startMonth = getFiscalYearStartMonth(country);
  const { year, month } = parsePeriod(period);
  const startYear = month >= startMonth ? year : year - 1;
  const monthIndex = ((month - startMonth + 12) % 12) + 1;
  return {
    fyLabel: `${startYear}-${pad2((startYear + 1) % 100)}`,
    monthIndex,
    totalMonths: 12,
    startYear,
    startMonth,
  };
}

/** All periods (YYYY-MM) from the fiscal-year start up to `period`, inclusive. */
function fiscalPeriodsThrough(country: string, period: string): string[] {
  const { startYear, startMonth, monthIndex } = fiscalInfo(country, period);
  const periods: string[] = [];
  for (let k = 0; k < monthIndex; k++) {
    const offset = startMonth - 1 + k;
    const y = startYear + Math.floor(offset / 12);
    const m = (offset % 12) + 1;
    periods.push(`${y}-${pad2(m)}`);
  }
  return periods;
}

/**
 * Per-period income-tax withholding with YTD true-up. Because the structural
 * taxable base is constant across the year, this walks months 1..K accumulating
 * the tax actually withheld, then withholds the remaining projected tax over the
 * periods that are left — smooth and self-correcting (§5.5).
 */
function withholdingForMonth(
  annualTaxable: number,
  regime: TaxRegime,
  monthIndex: number,
  totalMonths: number,
): number {
  let ytdTax = 0;
  let tax = 0;
  for (let k = 1; k <= monthIndex; k++) {
    tax = Math.round(
      projectPeriodTax({
        annualTaxable,
        regime,
        ytdTaxPaid: ytdTax,
        periodsRemaining: totalMonths - (k - 1),
      }),
    );
    if (k < monthIndex) ytdTax += tax;
  }
  return tax;
}

/* ── Per-employee monthly computation (shared by runs + YTD) ───────────────── */

interface EmployeeMonth {
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  employerContributions: PayslipLine[];
  grossEarnings: number;
  totalDeductions: number;
  employerCost: number;
  netPay: number;
  /** Prorated taxable earnings actually paid this period. */
  taxableEarnings: number;
  taxDeducted: number;
  /** Statutory contribution amounts by component code (employee + employer). */
  contributions: Record<string, number>;
  workingDays: number;
  presentDays: number;
  lopDays: number;
}

function computeEmployeeMonth(emp: RosterEmployee, period: string): EmployeeMonth | null {
  const components = resolveGroupComponents(emp.payGroupId);
  if (!components || components.length === 0) return null;

  const { year, month } = parsePeriod(period);
  const factor = prorationFactor({ basis: 'CALENDAR_DAYS', year, month, lopDays: emp.lopDays });
  const compByCode = new Map(components.map((c) => [c.code, c]));
  const breakdown = computeComponentBreakdown(components, emp.annualCtc);

  const earnings: PayslipLine[] = [];
  const deductions: PayslipLine[] = [];
  const employerContributions: PayslipLine[] = [];

  for (const line of breakdown) {
    const comp = compByCode.get(line.code);
    const raw = comp?.prorate ? line.monthlyAmount * factor : line.monthlyAmount;
    const amount = Math.round(raw);
    const pl: PayslipLine = { code: line.code, name: line.name, amount, taxable: line.taxable };
    if (line.type === 'EARNING' || line.type === 'VARIABLE') earnings.push(pl);
    else if (line.type === 'DEDUCTION') deductions.push(pl);
    else employerContributions.push(pl); // EMPLOYER_CONTRIBUTION | BENEFIT | REIMBURSEMENT
  }

  const pack = resolveActivePack(emp.country, period);
  const contributions: Record<string, number> = {};

  // Statutory contributions: wage base from earnings tagged with each scheme's
  // statutoryTag, capped at the ceiling; rates/ceilings are data, never code.
  if (pack) {
    for (const scheme of pack.contributionSchemes) {
      const rawBase = earnings
        .filter((e) => compByCode.get(e.code)?.statutoryTag === scheme.wageBaseTag)
        .reduce((s, e) => s + e.amount, 0);
      if (rawBase <= 0) continue; // no tagged earnings → scheme not applicable
      const { employee, employer } = computeContribution(rawBase, scheme);
      upsertLine(
        deductions,
        scheme.employee.component,
        compByCode.get(scheme.employee.component)?.name ?? `${scheme.name} (Employee)`,
        employee,
      );
      upsertLine(
        employerContributions,
        scheme.employer.component,
        compByCode.get(scheme.employer.component)?.name ?? `${scheme.name} (Employer)`,
        employer,
      );
      contributions[scheme.employee.component] = employee;
      contributions[scheme.employer.component] = employer;
    }
  }

  // Income tax (TDS): progressive regime tax with YTD true-up.
  const regime = pack?.taxRegimes[0] ?? null;
  let taxDeducted = 0;
  if (regime) {
    registerSlabTables({ [regime.code]: regime.slabs });
    const structuralTaxable = breakdown
      .filter((l) => (l.type === 'EARNING' || l.type === 'VARIABLE') && l.taxable)
      .reduce((s, l) => s + l.monthlyAmount, 0);
    const { monthIndex, totalMonths } = fiscalInfo(emp.country, period);
    taxDeducted = withholdingForMonth(structuralTaxable * 12, regime, monthIndex, totalMonths);
    const tdsLine = deductions.find((d) => d.code === 'TDS');
    if (tdsLine) tdsLine.amount = taxDeducted;
    else if (taxDeducted > 0)
      deductions.push({
        code: 'TDS',
        name: 'Income Tax (TDS)',
        amount: taxDeducted,
        taxable: false,
      });
  }

  const grossEarnings = earnings.reduce((s, l) => s + l.amount, 0);
  const totalDeductions = deductions.reduce((s, l) => s + l.amount, 0);
  const employerCost = employerContributions.reduce((s, l) => s + l.amount, 0);
  const taxableEarnings = earnings.filter((e) => e.taxable).reduce((s, e) => s + e.amount, 0);

  return {
    earnings,
    deductions,
    employerContributions,
    grossEarnings,
    totalDeductions,
    employerCost,
    netPay: grossEarnings - totalDeductions,
    taxableEarnings,
    taxDeducted,
    contributions,
    workingDays: STD_WORKING_DAYS,
    presentDays: STD_WORKING_DAYS - emp.lopDays,
    lopDays: emp.lopDays,
  };
}

/* ── Year-to-date ledger ──────────────────────────────────────────────────── */

/** Cumulative ledger for an employee from the fiscal-year start through `throughPeriod`. */
export function computeEmployeeYtd(employeeId: string, throughPeriod: string): PayslipYtd | null {
  const emp = FULL_ROSTER.find((e) => e.employeeId === employeeId);
  if (!emp) return null;
  const { fyLabel } = fiscalInfo(emp.country, throughPeriod);
  const ytd: PayslipYtd = {
    fiscalYear: fyLabel,
    monthsElapsed: 0,
    grossEarnings: 0,
    taxableIncome: 0,
    taxDeducted: 0,
    totalDeductions: 0,
    netPay: 0,
    contributions: {},
  };
  for (const p of fiscalPeriodsThrough(emp.country, throughPeriod)) {
    const m = computeEmployeeMonth(emp, p);
    if (!m) continue;
    ytd.monthsElapsed += 1;
    ytd.grossEarnings += m.grossEarnings;
    ytd.taxableIncome += m.taxableEarnings;
    ytd.taxDeducted += m.taxDeducted;
    ytd.totalDeductions += m.totalDeductions;
    ytd.netPay += m.netPay;
    for (const [code, amt] of Object.entries(m.contributions)) {
      ytd.contributions[code] = (ytd.contributions[code] ?? 0) + amt;
    }
  }
  return ytd;
}

/** Resolve the "as of" period for a YTD query against a fiscal-year label. */
export function ytdThroughPeriodForFy(country: string, fyLabel: string): string {
  const startMonth = getFiscalYearStartMonth(country);
  const startYear = parseInt(fyLabel.split('-')[0], 10);
  const fyStart = `${startYear}-${pad2(startMonth)}`;
  const endYear = startMonth === 1 ? startYear : startYear + 1;
  const endMonth = startMonth === 1 ? 12 : startMonth - 1;
  const fyEnd = `${endYear}-${pad2(endMonth)}`;
  const now = currentPeriodString();
  if (now < fyStart) return fyStart;
  if (now > fyEnd) return fyEnd;
  return now;
}

export { currentPeriodString };

export interface ComputedRun {
  items: PayslipRunItem[];
  details: Record<string, Payslip>;
  totals: {
    employeeCount: number;
    totalGross: number;
    totalDeductions: number;
    employerCost: number;
    totalNet: number;
    currency: string;
  };
  byDepartment: PayrollRunDeptSummary[];
  warnings: PayrollRunWarning[];
}

export function computeRun(
  runId: string,
  period: string,
  status: PayslipStatus = 'PENDING',
): ComputedRun {
  const label = periodLabel(period);
  const generatedAt = `${period}-28T10:00:00.000Z`;

  const items: PayslipRunItem[] = [];
  const details: Record<string, Payslip> = {};
  const warnings: PayrollRunWarning[] = [];
  const deptMap = new Map<string, PayrollRunDeptSummary>();

  let totalGross = 0;
  let totalDeductions = 0;
  let employerCost = 0;
  let totalNet = 0;
  let employeeCount = 0;

  for (const emp of FULL_ROSTER) {
    const month = computeEmployeeMonth(emp, period);
    if (!month) {
      warnings.push({
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        message: 'No salary config assigned — employee skipped',
      });
      continue;
    }

    const slipId = `slip-${runId}-${emp.employeeId}`;

    items.push({
      id: slipId,
      employeeId: emp.employeeId,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      departmentName: emp.departmentName,
      designation: emp.designation,
      currency: CURRENCY,
      grossEarnings: month.grossEarnings,
      totalDeductions: month.totalDeductions,
      netPay: month.netPay,
      workingDays: month.workingDays,
      presentDays: month.presentDays,
      lopDays: month.lopDays,
      status,
      hasAdjustments: false,
    });

    details[slipId] = {
      id: slipId,
      period,
      periodLabel: label,
      currency: CURRENCY,
      employee: {
        id: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeCode: emp.employeeCode,
        designation: emp.designation,
        departmentName: emp.departmentName,
      },
      company: COMPANY,
      earnings: month.earnings,
      deductions: month.deductions,
      employerContributions: month.employerContributions,
      ytd: computeEmployeeYtd(emp.employeeId, period) ?? undefined,
      oneTimeAdditions: [],
      oneTimeDeductions: [],
      grossEarnings: month.grossEarnings,
      totalDeductions: month.totalDeductions,
      employerCost: month.employerCost,
      netPay: month.netPay,
      workingDays: month.workingDays,
      presentDays: month.presentDays,
      leaveDays: 0,
      lopDays: month.lopDays,
      status,
      paymentDate: status === 'PAID' ? `${period}-28` : null,
      paymentReference: status === 'PAID' ? `NEFT/${period}/${emp.employeeCode}` : null,
      payrollRunId: runId,
      generatedAt,
    };

    totalGross += month.grossEarnings;
    totalDeductions += month.totalDeductions;
    employerCost += month.employerCost;
    totalNet += month.netPay;
    employeeCount += 1;

    const dept = deptMap.get(emp.departmentName) ?? {
      departmentName: emp.departmentName,
      employeeCount: 0,
      totalNet: 0,
    };
    dept.employeeCount += 1;
    dept.totalNet += month.netPay;
    deptMap.set(emp.departmentName, dept);
  }

  return {
    items,
    details,
    totals: {
      employeeCount,
      totalGross,
      totalDeductions,
      employerCost,
      totalNet,
      currency: CURRENCY,
    },
    byDepartment: [...deptMap.values()].sort((a, b) => b.totalNet - a.totalNet),
    warnings,
  };
}
