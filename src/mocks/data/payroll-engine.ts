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
  PayrollRunDeptSummary,
  PayrollRunWarning,
} from '@/modules/payroll/types/payroll.types';
import {
  computeComponentBreakdown,
  projectPeriodTax,
  registerSlabTables,
} from '@/modules/payroll/utils/formula.utils';
import { prorationFactor } from '@/modules/payroll/utils/proration.utils';
import { getComponentById } from '../handlers/payroll-components';
import { getGroupById } from '../handlers/payroll-groups';
import { resolveActivePack } from '../handlers/payroll-statutory';

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
  const { year, month } = parsePeriod(period);
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
    const components = resolveGroupComponents(emp.payGroupId);
    if (!components || components.length === 0) {
      warnings.push({
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        message: 'No salary config assigned — employee skipped',
      });
      continue;
    }

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

    // Income tax (TDS): computed from the pinned pack's regime via progressive
    // slabs — never a flat rate in code. Project full-year taxable income, then
    // spread the regime tax across the year. (YTD true-up arrives in Step 100.)
    const pack = resolveActivePack(emp.country, period);
    const regime = pack?.taxRegimes[0] ?? null;
    if (regime) {
      registerSlabTables({ [regime.code]: regime.slabs });
      const taxableMonthly = breakdown
        .filter((l) => (l.type === 'EARNING' || l.type === 'VARIABLE') && l.taxable)
        .reduce((s, l) => s + l.monthlyAmount, 0);
      const monthlyTax = Math.round(
        projectPeriodTax({ annualTaxable: taxableMonthly * 12, regime }),
      );
      const tdsLine = deductions.find((d) => d.code === 'TDS');
      if (tdsLine) tdsLine.amount = monthlyTax;
      else if (monthlyTax > 0)
        deductions.push({
          code: 'TDS',
          name: 'Income Tax (TDS)',
          amount: monthlyTax,
          taxable: false,
        });
    }

    const grossEarnings = earnings.reduce((s, l) => s + l.amount, 0);
    const slipDeductions = deductions.reduce((s, l) => s + l.amount, 0);
    const slipEmployerCost = employerContributions.reduce((s, l) => s + l.amount, 0);
    const netPay = grossEarnings - slipDeductions;
    const presentDays = STD_WORKING_DAYS - emp.lopDays;
    const slipId = `slip-${runId}-${emp.employeeId}`;

    items.push({
      id: slipId,
      employeeId: emp.employeeId,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      departmentName: emp.departmentName,
      designation: emp.designation,
      currency: CURRENCY,
      grossEarnings,
      totalDeductions: slipDeductions,
      netPay,
      workingDays: STD_WORKING_DAYS,
      presentDays,
      lopDays: emp.lopDays,
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
      earnings,
      deductions,
      employerContributions,
      oneTimeAdditions: [],
      oneTimeDeductions: [],
      grossEarnings,
      totalDeductions: slipDeductions,
      employerCost: slipEmployerCost,
      netPay,
      workingDays: STD_WORKING_DAYS,
      presentDays,
      leaveDays: 0,
      lopDays: emp.lopDays,
      status,
      paymentDate: status === 'PAID' ? `${period}-28` : null,
      paymentReference: status === 'PAID' ? `NEFT/${period}/${emp.employeeCode}` : null,
      payrollRunId: runId,
      generatedAt,
    };

    totalGross += grossEarnings;
    totalDeductions += slipDeductions;
    employerCost += slipEmployerCost;
    totalNet += netPay;
    employeeCount += 1;

    const dept = deptMap.get(emp.departmentName) ?? {
      departmentName: emp.departmentName,
      employeeCount: 0,
      totalNet: 0,
    };
    dept.employeeCount += 1;
    dept.totalNet += netPay;
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
