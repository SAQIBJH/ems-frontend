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
  PayslipOneTime,
  PayslipRunItem,
  Payslip,
  PayslipStatus,
  PayslipYtd,
  PayrollInput,
  ReimbursementClaim,
  FnfParams,
  FnfLine,
  FnfSettlement,
  Garnishment,
  PayrollRunDeptSummary,
  PayrollRunWarning,
} from '@/modules/payroll/types/payroll.types';
import type { TaxRegime } from '@/modules/payroll/types/statutory.types';
import type { WorkLocation } from '@/modules/payroll/types/payroll.types';
import { formatMoney, fromMinor, toMinor } from '@/modules/payroll/utils/money.utils';
import {
  applyGarnishments,
  computeBonusTax,
  computeComponentBreakdown,
  computeContribution,
  computeGratuity,
  evaluateLocalTax,
  minimumWageFloor,
  projectPeriodTax,
  registerSlabTables,
  resolveJurisdictions,
} from '@/modules/payroll/utils/formula.utils';
import { prorationFactor } from '@/modules/payroll/utils/proration.utils';
import { getComponentById, getComponentByCode } from '../handlers/payroll-components';
import { getGroupById } from '../handlers/payroll-groups';
import { resolveActivePack } from '../handlers/payroll-statutory';
import { getFiscalYearStartMonth } from '../handlers/payroll-localization';
import { getTaxDeclaration } from '../handlers/payroll-tax-declaration';
import { loanEmiForPeriod, outstandingLoanBalance } from '../handlers/payroll-loans';
import { getActiveGarnishments } from '../handlers/payroll-garnishments';

const CURRENCY = 'INR';
const COMPANY = { name: 'Acme Corp', address: '123 Tech Park, Pune 411001', logoUrl: null };
const STD_WORKING_DAYS = 22;
// Standard paid hours per working day — used to derive an hourly rate for overtime.
// A sensible operational default; moves to the pay calendar in a later step.
const STD_HOURS_PER_DAY = 8;
// Component codes priced from input hours (× hourly rate × multiplier), never as
// flat variable-pay amounts — guards against double-pricing.
const HOURS_PRICED = new Set(['OT', 'SHIFT', 'ONCALL']);

const GARNISHMENT_LABELS: Record<Garnishment['type'], string> = {
  CHILD_SUPPORT: 'Child support',
  SPOUSAL_SUPPORT: 'Spousal support',
  TAX_LEVY: 'Tax levy',
  COURT_ORDER: 'Court attachment',
  DEFAULTED_LOAN: 'Loan recovery order',
};

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
  /** ISO 3166-2 tax-residence jurisdiction. */
  residenceJurisdiction: string;
  /** Work-location jurisdictions (the engine taxes the resolved set). */
  workLocations: WorkLocation[];
}

// A fixed payroll roster. Variation in CTC flows through the SPECIAL_ALLOW formula
// (CTC − BASIC − HRA − …), so each employee gets a genuinely different payslip. The
// jurisdiction column drives multi-jurisdiction local-tax resolution (Step 106):
// Karnataka employees get KA professional tax, Maharashtra employees get MH.
const ROSTER: RosterEmployee[] = (
  [
    ['emp-001', 'E0001', 'Aman', 'Kumar', 'Engineering', 'Senior Engineer', 2400000, 0, 'IN-MH'],
    [
      'emp-004',
      'E0004',
      'Priya',
      'Sharma',
      'Engineering',
      'Software Engineer',
      1200000,
      1,
      'IN-MH',
    ],
    ['emp-005', 'E0005', 'Rohan', 'Mehta', 'Sales', 'Account Executive', 1080000, 0, 'IN-KA'],
    ['emp-006', 'E0006', 'Nisha', 'Iyer', 'Product', 'Product Manager', 1800000, 0, 'IN-MH'],
    ['emp-007', 'E0007', 'Vikram', 'Singh', 'Engineering', 'Staff Engineer', 3000000, 0, 'IN-KA'],
    ['emp-008', 'E0008', 'Asha', 'Joshi', 'Finance', 'Financial Analyst', 1320000, 0, 'IN-MH'],
    ['emp-009', 'E0009', 'Sneha', 'Rao', 'Operations', 'Ops Lead', 1560000, 2, 'IN-KA'],
    ['emp-010', 'E0010', 'Karan', 'Patel', 'Sales', 'Sales Manager', 1680000, 0, 'IN-MH'],
    ['emp-011', 'E0011', 'Meera', 'Nair', 'Product', 'Designer', 1140000, 0, 'IN-MH'],
    ['emp-012', 'E0012', 'Arjun', 'Reddy', 'Engineering', 'Software Engineer', 1260000, 0, 'IN-KA'],
  ] as const
).map(
  ([
    employeeId,
    employeeCode,
    firstName,
    lastName,
    departmentName,
    designation,
    annualCtc,
    lopDays,
    jurisdiction,
  ]) => ({
    employeeId,
    employeeCode,
    firstName,
    lastName,
    departmentName,
    designation,
    payGroupId: 'pg-001',
    annualCtc,
    country: 'IN',
    lopDays,
    residenceJurisdiction: jurisdiction,
    workLocations: [{ jurisdiction, allocationPct: 100 }],
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
  residenceJurisdiction: 'IN-MH',
  workLocations: [{ jurisdiction: 'IN-MH', allocationPct: 100 }],
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
  oneTimeAdditions: PayslipOneTime[];
  oneTimeDeductions: PayslipOneTime[];
  grossEarnings: number;
  totalDeductions: number;
  employerCost: number;
  netPay: number;
  /** Prorated taxable earnings actually paid this period. */
  taxableEarnings: number;
  taxDeducted: number;
  /** Statutory contribution amounts by component code (employee + employer). */
  contributions: Record<string, number>;
  /** Highest applicable jurisdiction minimum monthly wage floor (0 = none). */
  minWageFloor: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
}

function computeEmployeeMonth(
  emp: RosterEmployee,
  period: string,
  input?: PayrollInput,
  claims?: ReimbursementClaim[],
): EmployeeMonth | null {
  const components = resolveGroupComponents(emp.payGroupId);
  if (!components || components.length === 0) return null;

  // LOP comes from the run inputs (attendance) when present, else the roster default.
  const lopDays = input?.lopDays ?? emp.lopDays;
  const { year, month } = parsePeriod(period);
  const factor = prorationFactor({ basis: 'CALENDAR_DAYS', year, month, lopDays });
  const compByCode = new Map(components.map((c) => [c.code, c]));
  const breakdown = computeComponentBreakdown(components, emp.annualCtc);

  const earnings: PayslipLine[] = [];
  const deductions: PayslipLine[] = [];
  const employerContributions: PayslipLine[] = [];

  for (const line of breakdown) {
    const comp = compByCode.get(line.code);
    // Scheduled components (13th/14th-month, holiday allowance) are emitted only in
    // their configured calendar months; outside those months they pay nothing.
    if (comp?.payInPeriods && !comp.payInPeriods.includes(month)) continue;
    // VARIABLE components are input-driven: take their amount from the run input.
    let raw: number;
    // variablePay is stored in minor units by the inputs UI; the engine works in major.
    if (line.type === 'VARIABLE') raw = fromMinor(input?.variablePay?.[line.code] ?? 0, CURRENCY);
    else raw = comp?.prorate ? line.monthlyAmount * factor : line.monthlyAmount;
    const amount = Math.round(raw);
    const pl: PayslipLine = { code: line.code, name: line.name, amount, taxable: line.taxable };
    if (line.type === 'EARNING') earnings.push(pl);
    else if (line.type === 'VARIABLE') {
      if (amount > 0) earnings.push(pl); // omit zero-value variable lines
    } else if (line.type === 'DEDUCTION') deductions.push(pl);
    else employerContributions.push(pl); // EMPLOYER_CONTRIBUTION | BENEFIT | REIMBURSEMENT
  }

  // Hours-based premiums: overtime, shift differential, and on-call/standby are each
  // priced as hours × hourly rate × the component's configurable multiplier. No
  // premium rate lives in code — the multiplier is the component's `value` (percent).
  const basicMonthly = breakdown.find((l) => l.code === 'BASIC')?.monthlyAmount ?? 0;
  const hourlyRate = basicMonthly / (STD_WORKING_DAYS * STD_HOURS_PER_DAY);
  function pricePremium(code: string, hours: number, fallbackName: string): void {
    if (hours <= 0) return;
    const comp = getComponentByCode(code);
    const multiplier = (comp?.value ?? 100) / 100;
    const pay = Math.round(hours * hourlyRate * multiplier);
    if (pay > 0)
      earnings.push({
        code,
        name: comp?.name ?? fallbackName,
        amount: pay,
        taxable: comp?.taxable ?? true,
      });
  }
  pricePremium('OT', input?.otHours ?? 0, 'Overtime');
  pricePremium('SHIFT', input?.shiftHours ?? 0, 'Shift Differential');
  pricePremium('ONCALL', input?.onCallHours ?? 0, 'On-call Allowance');

  // Structured variable pay (incentive/commission/bonus) entered as run inputs —
  // applied even when the component is not part of the employee's pay group.
  for (const [code, value] of Object.entries(input?.variablePay ?? {})) {
    // OT/SHIFT/ONCALL are hours-priced above — never also pay them as flat variable pay.
    if (HOURS_PRICED.has(code) || value <= 0 || earnings.some((e) => e.code === code)) continue;
    const comp = getComponentByCode(code);
    earnings.push({
      code,
      name: comp?.name ?? code,
      amount: Math.round(fromMinor(value, CURRENCY)),
      taxable: comp?.taxable ?? true,
    });
  }

  const pack = resolveActivePack(emp.country, period);
  // Multi-jurisdiction: the engine taxes the resolved set (residence + work locations).
  const jurisdictions = resolveJurisdictions(emp.residenceJurisdiction, emp.workLocations);
  const minWageFloor = pack?.minimumWages ? minimumWageFloor(jurisdictions, pack.minimumWages) : 0;
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

  // Sub-national local taxes (professional tax, LWF, city tax) for the employee's
  // resolved jurisdiction set — driven entirely by the pack, replacing the old
  // hardcoded PROF_TAX formula. The flat band amount posts to the tax's component.
  if (pack) {
    const jset = new Set(jurisdictions);
    // Pack slabs/amounts are minor units; engine payslip lines are major. Convert the
    // wage base to minor for the band lookup, then the flat amount back to major.
    const grossMinor = toMinor(
      earnings.reduce((s, e) => s + e.amount, 0),
      CURRENCY,
    );
    for (const lt of pack.localTaxes) {
      if (!lt.jurisdiction || !jset.has(lt.jurisdiction)) continue;
      const amount = fromMinor(evaluateLocalTax(grossMinor, lt.slabs), CURRENCY);
      upsertLine(deductions, lt.component, compByCode.get(lt.component)?.name ?? lt.name, amount);
    }
  }

  // Income tax (TDS): progressive regime tax with YTD true-up. The employee's tax
  // declaration (if any) chooses the regime and reduces taxable income by VERIFIED
  // exemptions the regime allows — all data-driven, no per-code logic.
  const { fyLabel, monthIndex, totalMonths } = fiscalInfo(emp.country, period);
  const declaration = getTaxDeclaration(emp.employeeId, fyLabel);
  const regime =
    (declaration && pack?.taxRegimes.find((r) => r.code === declaration.regime)) ??
    pack?.taxRegimes[0] ??
    null;
  let taxDeducted = 0;
  if (regime) {
    registerSlabTables({ [regime.code]: regime.slabs });
    // Annual taxable base: taxable earnings + taxable benefits-in-kind (perquisites,
    // which add to taxable income but never to net pay). Scheduled components count
    // only the periods they are actually paid in (e.g. 13th-month → ×1), regular
    // components ×12 — so the projection matches what the employee really earns.
    const annualStructural = breakdown
      .filter(
        (l) => (l.type === 'EARNING' || l.type === 'VARIABLE' || l.type === 'BENEFIT') && l.taxable,
      )
      .reduce((s, l) => {
        const periods = compByCode.get(l.code)?.payInPeriods?.length ?? 12;
        return s + l.monthlyAmount * periods;
      }, 0);
    const allowed = new Set(regime.allowedExemptions ?? []);
    const exemptions = (declaration?.items ?? [])
      .filter(
        (it) =>
          it.proofStatus === 'VERIFIED' && it.code !== 'STD_DEDUCTION' && allowed.has(it.code),
      )
      .reduce((s, it) => s + it.amount, 0);
    const annualTaxable = Math.max(0, annualStructural - exemptions);
    taxDeducted = withholdingForMonth(annualTaxable, regime, monthIndex, totalMonths);
    // The income-tax line code comes from the regime (e.g. WITHHOLDING_TAX for PH), not "TDS".
    const taxCode = regime.taxCode ?? 'TDS';
    const taxName = regime.taxName ?? 'Income Tax (TDS)';
    const taxLine = deductions.find((d) => d.code === taxCode);
    if (taxLine) taxLine.amount = taxDeducted;
    else if (taxDeducted > 0)
      deductions.push({
        code: taxCode,
        name: taxName,
        amount: taxDeducted,
        taxable: false,
      });
  }

  // Court-ordered garnishments: applied after statutory deductions, before voluntary
  // ones (loans). Disposable = gross − statutory deductions so far. Order money is in
  // minor units, so convert disposable to minor and the withheld amounts back to major.
  const garnishments = getActiveGarnishments(emp.employeeId, period);
  if (garnishments.length > 0) {
    const grossNow = earnings.reduce((s, e) => s + e.amount, 0);
    const statutoryNow = deductions.reduce((s, d) => s + d.amount, 0);
    const disposableMinor = toMinor(grossNow - statutoryNow, CURRENCY);
    const withheld = applyGarnishments(
      disposableMinor,
      garnishments.map((g) => ({
        id: g.id,
        priority: g.priority,
        kind: g.amount.kind,
        value: g.amount.value,
        protectedEarningsFloor: g.protectedEarningsFloor,
        cap: g.cap,
      })),
    );
    for (const w of withheld) {
      const g = garnishments.find((x) => x.id === w.id);
      if (!g) continue;
      deductions.push({
        code: `GARN_${g.id}`,
        name: GARNISHMENT_LABELS[g.type],
        amount: fromMinor(w.amount, CURRENCY),
        taxable: false,
      });
    }
  }

  // Loan / advance EMI recovery — a scheduled deduction for this period.
  // Loan amounts are stored in minor units; the engine works in major.
  for (const line of loanEmiForPeriod(emp.employeeId, period)) {
    deductions.push({
      code: `EMI_${line.loanId}`,
      name: line.type === 'ADVANCE' ? 'Advance recovery' : 'Loan EMI',
      amount: fromMinor(line.emi, CURRENCY),
      taxable: false,
    });
  }

  // One-time, period-only additions/deductions: run inputs + attached reimbursement
  // claims (paid as non-taxable additions).
  const oneTimeAdditions: PayslipOneTime[] = [
    ...(input?.oneTime ?? [])
      .filter((o) => o.kind === 'ADDITION')
      .map((o) => ({ description: o.label, amount: o.amount })),
    ...(claims ?? []).map((c) => ({
      description: `${c.category} reimbursement`,
      // Claim amounts are stored in minor units; the engine works in major.
      amount: fromMinor(c.amount, CURRENCY),
    })),
  ];
  const oneTimeDeductions: PayslipOneTime[] = (input?.oneTime ?? [])
    .filter((o) => o.kind === 'DEDUCTION')
    .map((o) => ({ description: o.label, amount: o.amount }));
  const oneTimeAddTotal = oneTimeAdditions.reduce((s, o) => s + o.amount, 0);
  const oneTimeDedTotal = oneTimeDeductions.reduce((s, o) => s + o.amount, 0);

  const grossEarnings = earnings.reduce((s, l) => s + l.amount, 0);
  const totalDeductions = deductions.reduce((s, l) => s + l.amount, 0);
  const employerCost = employerContributions.reduce((s, l) => s + l.amount, 0);
  const taxableEarnings = earnings.filter((e) => e.taxable).reduce((s, e) => s + e.amount, 0);

  return {
    earnings,
    deductions,
    employerContributions,
    oneTimeAdditions,
    oneTimeDeductions,
    grossEarnings,
    totalDeductions,
    employerCost,
    netPay: grossEarnings - totalDeductions + oneTimeAddTotal - oneTimeDedTotal,
    taxableEarnings,
    taxDeducted,
    contributions,
    minWageFloor,
    workingDays: STD_WORKING_DAYS,
    presentDays: STD_WORKING_DAYS - lopDays,
    lopDays,
  };
}

/* ── Run inputs seed (defaults pulled from attendance LOP) ─────────────────── */

/** Default per-employee inputs for the live roster — LOP seeded from attendance. */
export function getRosterInputSeed(): PayrollInput[] {
  return ROSTER.map((emp) => ({
    employeeId: emp.employeeId,
    employeeCode: emp.employeeCode,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    lopDays: emp.lopDays, // attendance-derived LOP for the demo roster
    leaveDays: 0,
    otHours: 0,
    shiftHours: 0,
    onCallHours: 0,
    variablePay: {},
    oneTime: [],
  }));
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

/* ── Full & final settlement ──────────────────────────────────────────────── */

/**
 * Compute a single employee's full & final settlement: pro-rated salary to the last
 * working day, leave encashment, gratuity (from the pinned pack's policy), notice-period
 * recovery, outstanding-loan recovery, and final tax. All formulas are config/data.
 */
export function computeFnf(
  employeeId: string,
  period: string,
  params: FnfParams,
): FnfSettlement | null {
  const emp = ROSTER.find((e) => e.employeeId === employeeId);
  if (!emp) return null;
  const month = computeEmployeeMonth(emp, period);
  if (!month) return null;

  const basicMonthly = month.earnings.find((l) => l.code === 'BASIC')?.amount ?? 0;
  const dailyWage = basicMonthly / 30;

  // Pro-rate salary to the last working day within the month.
  const { year, month: m } = parsePeriod(period);
  const daysInMonth = new Date(year, m, 0).getDate();
  const lwdDay = Math.min(
    parseInt(params.lastWorkingDay.split('-')[2] ?? '', 10) || daysInMonth,
    daysInMonth,
  );
  const proratedSalary = Math.round(month.grossEarnings * (lwdDay / daysInMonth));
  const leaveEncashment = Math.round(dailyWage * params.leaveBalanceDays);

  const pack = resolveActivePack(emp.country, period);
  const gratuity = pack?.gratuity
    ? computeGratuity(basicMonthly, params.yearsOfService, pack.gratuity)
    : 0;

  const noticeRecovery = Math.round(dailyWage * params.noticeShortfallDays);
  const loanRecovery = outstandingLoanBalance(employeeId);
  const finalTax = month.taxDeducted;
  // Tax line code from the resolved pack's regime (e.g. WITHHOLDING_TAX), not hardcoded TDS.
  const fnfTaxCode = pack?.taxRegimes[0]?.taxCode ?? 'TDS';
  const fnfTaxName = pack?.taxRegimes[0]?.taxName ?? 'Final tax (TDS)';

  const earnings: FnfLine[] = [
    { code: 'FNF_SALARY', label: 'Pro-rated salary', amount: proratedSalary },
    { code: 'FNF_LEAVE_ENCASH', label: 'Leave encashment', amount: leaveEncashment },
    { code: 'FNF_GRATUITY', label: 'Gratuity', amount: gratuity },
  ].filter((l) => l.amount > 0);

  const deductions: FnfLine[] = [
    { code: 'FNF_NOTICE', label: 'Notice-period recovery', amount: noticeRecovery },
    { code: 'FNF_LOAN', label: 'Loan recovery', amount: loanRecovery },
    { code: fnfTaxCode, label: fnfTaxName, amount: finalTax },
  ].filter((l) => l.amount > 0);

  const grossPayable = earnings.reduce((s, l) => s + l.amount, 0);
  const totalRecovery = deductions.reduce((s, l) => s + l.amount, 0);

  return {
    employeeId,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    lastWorkingDay: params.lastWorkingDay,
    currency: CURRENCY,
    earnings,
    deductions,
    grossPayable,
    totalRecovery,
    netSettlement: grossPayable - totalRecovery,
  };
}

/** Roster summary (id/code/name) — for run-subject pickers (FnF). */
export function getRosterSummary(): {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
}[] {
  return ROSTER.map((e) => ({
    employeeId: e.employeeId,
    employeeCode: e.employeeCode,
    employeeName: `${e.firstName} ${e.lastName}`,
  }));
}

export interface RosterCompRow {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  annualCtc: number;
  /** ISO 3166-2 residence jurisdiction (location dimension for pay-equity). */
  jurisdiction: string;
}

/** Roster compensation rows — comp basis for pay-equity / diversity analysis (§21). */
export function getRosterComp(): RosterCompRow[] {
  return ROSTER.map((e) => ({
    employeeId: e.employeeId,
    employeeName: `${e.firstName} ${e.lastName}`,
    departmentName: e.departmentName,
    designation: e.designation,
    annualCtc: e.annualCtc,
    jurisdiction: e.residenceJurisdiction,
  }));
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
  inputs?: Record<string, PayrollInput>,
  claimsByEmployee?: Record<string, ReimbursementClaim[]>,
  /** OFF_CYCLE: restrict the run to this employee subset (empty/absent = full roster). */
  employeeIds?: string[],
): ComputedRun {
  const label = periodLabel(period);
  const generatedAt = `${period}-28T10:00:00.000Z`;
  // Off-cycle runs pay a selected subset; everything else pays the full roster.
  const roster =
    employeeIds && employeeIds.length > 0
      ? FULL_ROSTER.filter((e) => employeeIds.includes(e.employeeId))
      : FULL_ROSTER;

  const items: PayslipRunItem[] = [];
  const details: Record<string, Payslip> = {};
  const warnings: PayrollRunWarning[] = [];
  const deptMap = new Map<string, PayrollRunDeptSummary>();

  let totalGross = 0;
  let totalDeductions = 0;
  let employerCost = 0;
  let totalNet = 0;
  let employeeCount = 0;

  for (const emp of roster) {
    const month = computeEmployeeMonth(
      emp,
      period,
      inputs?.[emp.employeeId],
      claimsByEmployee?.[emp.employeeId],
    );
    if (!month) {
      warnings.push({
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        message: 'No salary config assigned — employee skipped',
      });
      continue;
    }

    // Minimum-wage compliance: a post-compute check that flags (never silently
    // raises) gross pay below the employee's jurisdiction floor. The floor is in
    // minor units (pack), gross is major — compare in minor units.
    const grossMinor = toMinor(month.grossEarnings, CURRENCY);
    if (month.minWageFloor > 0 && grossMinor < month.minWageFloor) {
      warnings.push({
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        message: `Gross ${formatMoney(grossMinor, CURRENCY)} is below the ${formatMoney(
          month.minWageFloor,
          CURRENCY,
        )} minimum wage`,
      });
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
      oneTimeAdditions: month.oneTimeAdditions,
      oneTimeDeductions: month.oneTimeDeductions,
      grossEarnings: month.grossEarnings,
      totalDeductions: month.totalDeductions,
      employerCost: month.employerCost,
      netPay: month.netPay,
      workingDays: month.workingDays,
      presentDays: month.presentDays,
      leaveDays: inputs?.[emp.employeeId]?.leaveDays ?? 0,
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

/* ── Extra-pay runs (bonus / arrears) ──────────────────────────────────────── */

/**
 * Compute a bonus/arrears run: pays **only** the amounts HR entered per employee for the
 * given component codes (run inputs `variablePay`), with **incremental** income tax on
 * that extra — never the regular salary structure. Employees with no entered amount
 * produce no payslip. Config-driven: the regime comes from the pinned pack, never a
 * hardcoded rate. Bonus → BONUS/INCENTIVE/COMMISSION; Arrears → ARREARS.
 */
export function computeExtraPayRun(
  runId: string,
  period: string,
  status: PayslipStatus,
  inputs: Record<string, PayrollInput> | undefined,
  componentCodes: string[],
): ComputedRun {
  const label = periodLabel(period);
  const generatedAt = `${period}-28T10:00:00.000Z`;
  const codeSet = new Set(componentCodes);

  const items: PayslipRunItem[] = [];
  const details: Record<string, Payslip> = {};
  const deptMap = new Map<string, PayrollRunDeptSummary>();
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let employeeCount = 0;

  for (const emp of ROSTER) {
    const input = inputs?.[emp.employeeId];
    if (!input) continue;

    // Earnings = only the entered amounts for this run's components.
    const earnings: PayslipLine[] = [];
    for (const [code, value] of Object.entries(input.variablePay ?? {})) {
      if (!codeSet.has(code) || value <= 0) continue;
      const comp = getComponentByCode(code);
      earnings.push({
        code,
        name: comp?.name ?? code,
        amount: Math.round(fromMinor(value, CURRENCY)),
        taxable: comp?.taxable ?? true,
      });
    }
    const extra = earnings.reduce((s, e) => s + e.amount, 0);
    if (extra <= 0) continue;

    // Marginal rate: project the employee's annual structural taxable income.
    const components = resolveGroupComponents(emp.payGroupId);
    const breakdown = components ? computeComponentBreakdown(components, emp.annualCtc) : [];
    const annualTaxable = breakdown
      .filter((l) => (l.type === 'EARNING' || l.type === 'VARIABLE') && l.taxable)
      .reduce((s, l) => s + l.monthlyAmount * 12, 0);

    const pack = resolveActivePack(emp.country, period);
    const { fyLabel } = fiscalInfo(emp.country, period);
    const declaration = getTaxDeclaration(emp.employeeId, fyLabel);
    const regime =
      (declaration && pack?.taxRegimes.find((r) => r.code === declaration.regime)) ??
      pack?.taxRegimes[0] ??
      null;
    const taxableExtra = earnings.filter((e) => e.taxable).reduce((s, e) => s + e.amount, 0);
    const tax = regime ? Math.round(computeBonusTax(annualTaxable, taxableExtra, regime)) : 0;

    const deductions: PayslipLine[] =
      tax > 0
        ? [
            {
              code: regime?.taxCode ?? 'TDS',
              name: regime?.taxName ?? 'Income Tax (TDS)',
              amount: tax,
              taxable: false,
            },
          ]
        : [];
    const netPay = extra - tax;
    const slipId = `slip-${runId}-${emp.employeeId}`;

    items.push({
      id: slipId,
      employeeId: emp.employeeId,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      departmentName: emp.departmentName,
      designation: emp.designation,
      currency: CURRENCY,
      grossEarnings: extra,
      totalDeductions: tax,
      netPay,
      workingDays: STD_WORKING_DAYS,
      presentDays: STD_WORKING_DAYS,
      lopDays: 0,
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
      employerContributions: [],
      oneTimeAdditions: [],
      oneTimeDeductions: [],
      grossEarnings: extra,
      totalDeductions: tax,
      employerCost: 0,
      netPay,
      workingDays: STD_WORKING_DAYS,
      presentDays: STD_WORKING_DAYS,
      leaveDays: 0,
      lopDays: 0,
      status,
      paymentDate: status === 'PAID' ? `${period}-28` : null,
      paymentReference: status === 'PAID' ? `NEFT/${period}/${emp.employeeCode}` : null,
      payrollRunId: runId,
      generatedAt,
    };

    totalGross += extra;
    totalDeductions += tax;
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
      employerCost: 0,
      totalNet,
      currency: CURRENCY,
    },
    byDepartment: [...deptMap.values()].sort((a, b) => b.totalNet - a.totalNet),
    warnings: [],
  };
}

/** Component codes an extra-pay run pays, by run type. */
export const BONUS_COMPONENT_CODES = ['BONUS', 'INCENTIVE', 'COMMISSION'];
export const ARREARS_COMPONENT_CODES = ['ARREARS'];

/* ── Reversal runs ─────────────────────────────────────────────────────────── */

/**
 * Reverse a prior run: take its computed result and **negate every line** (gross,
 * deductions, employer cost, net) so the reversal exactly offsets the original. The
 * original run is never mutated — this is an offsetting entry (immutability/audit).
 */
export function negateComputedRun(
  reversalRunId: string,
  original: ComputedRun,
  status: PayslipStatus,
): ComputedRun {
  const items: PayslipRunItem[] = original.items.map((it) => ({
    ...it,
    id: `slip-${reversalRunId}-${it.employeeId}`,
    grossEarnings: -it.grossEarnings,
    totalDeductions: -it.totalDeductions,
    netPay: -it.netPay,
    status,
  }));

  const details: Record<string, Payslip> = {};
  for (const d of Object.values(original.details)) {
    const slipId = `slip-${reversalRunId}-${d.employee.id}`;
    details[slipId] = {
      ...d,
      id: slipId,
      payrollRunId: reversalRunId,
      status,
      earnings: d.earnings.map((l) => ({ ...l, amount: -l.amount })),
      deductions: d.deductions.map((l) => ({ ...l, amount: -l.amount })),
      employerContributions: (d.employerContributions ?? []).map((l) => ({
        ...l,
        amount: -l.amount,
      })),
      oneTimeAdditions: (d.oneTimeAdditions ?? []).map((o) => ({ ...o, amount: -o.amount })),
      oneTimeDeductions: (d.oneTimeDeductions ?? []).map((o) => ({ ...o, amount: -o.amount })),
      grossEarnings: -d.grossEarnings,
      totalDeductions: -d.totalDeductions,
      employerCost: -(d.employerCost ?? 0),
      netPay: -d.netPay,
      ytd: undefined,
    };
  }

  return {
    items,
    details,
    totals: {
      employeeCount: original.totals.employeeCount,
      totalGross: -original.totals.totalGross,
      totalDeductions: -original.totals.totalDeductions,
      employerCost: -original.totals.employerCost,
      totalNet: -original.totals.totalNet,
      currency: original.totals.currency,
    },
    byDepartment: original.byDepartment.map((dept) => ({ ...dept, totalNet: -dept.totalNet })),
    warnings: [],
  };
}
