import type { RunConfigSnapshotRef } from './statutory.types';

export type ComponentType =
  | 'EARNING'
  | 'DEDUCTION'
  | 'EMPLOYER_CONTRIBUTION'
  | 'BENEFIT'
  | 'REIMBURSEMENT'
  | 'VARIABLE';
export type CalculationType = 'FLAT' | 'PERCENTAGE' | 'FORMULA';
export type PaySchedule = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
export type PayrollRunStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'REVIEW'
  | 'APPROVED'
  | 'PAID'
  | 'CANCELLED';
export type PayslipStatus = 'PENDING' | 'PAID' | 'HELD';

/* ── Salary Components ─────────────────────────────────────────────────────── */

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: ComponentType;
  calculationType: CalculationType;
  value: number | null;
  basisCode: string | null;
  formula: string | null;
  taxable: boolean;
  active: boolean;
  displayOrder: number;
  description: string | null;
  /** Wage-base tag a statutory contribution scheme keys off (e.g. PF_WAGE). null = none. */
  statutoryTag: string | null;
  /** Whether this component is reduced by loss-of-pay proration. */
  prorate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryComponentInput {
  name: string;
  code: string;
  type: ComponentType;
  calculationType: CalculationType;
  value: number | null;
  basisCode: string | null;
  formula: string | null;
  taxable: boolean;
  active: boolean;
  displayOrder: number;
  statutoryTag?: string | null;
  prorate?: boolean;
  description?: string | null;
}

/* ── Pay Groups ───────────────────────────────────────────────────────────── */

export interface PayGroupComponent {
  componentId: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  overrideCalculationType: CalculationType | null;
  overrideValue: number | null;
  overrideFormula: string | null;
}

export interface PayGroup {
  id: string;
  name: string;
  code: string;
  currency: string;
  paySchedule: PaySchedule;
  description: string | null;
  active: boolean;
  employeeCount: number;
  components: PayGroupComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface PayGroupComponentInput {
  componentId: string;
  overrideCalculationType: CalculationType | null;
  overrideValue: number | null;
  overrideFormula: string | null;
}

export interface PayGroupInput {
  name: string;
  code: string;
  currency: string;
  paySchedule: PaySchedule;
  description?: string | null;
  active: boolean;
  components: PayGroupComponentInput[];
}

/* ── Pay Schedules ─────────────────────────────────────────────────────────── */

export interface PayScheduleRecord {
  id: string;
  name: string;
  frequency: PaySchedule;
  startDate: string;
  timezone: string;
  nextRunDate: string;
  active: boolean;
}

/* ── Employee Salary Config ────────────────────────────────────────────────── */

export interface CalculatedComponent {
  code: string;
  name: string;
  type: ComponentType;
  monthlyAmount: number;
  taxable: boolean;
}

export interface SalaryHistory {
  id: string;
  annualCtc: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  payGroupCode: string;
}

export interface EmployeeSalaryPayGroup {
  id: string;
  name: string;
  code: string;
  currency: string;
  paySchedule: PaySchedule;
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  payGroupId: string;
  payGroup: EmployeeSalaryPayGroup;
  annualCtc: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  /** ISO 3166-1 alpha-2 — determines the bank-account field schema. */
  country: string;
  /** Bank account fields keyed per the country's bank schema (§3.4). */
  bankAccount: Record<string, string>;
  calculatedComponents: CalculatedComponent[];
  monthlyGross: number;
  monthlyDeductions: number;
  monthlyNet: number;
  history: SalaryHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryInput {
  payGroupId: string;
  annualCtc: number;
  effectiveFrom: string;
  country: string;
  bankAccount: Record<string, string>;
}

/* ── Payslips ─────────────────────────────────────────────────────────────── */

export interface PayslipLine {
  code: string;
  name: string;
  amount: number;
  taxable?: boolean;
}

export interface PayslipOneTime {
  description: string;
  amount: number;
}

export interface PayslipEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  departmentName: string;
  panNumber?: string;
}

export interface PayslipCompany {
  name: string;
  address: string;
  logoUrl: string | null;
}

/** Per-employee, per-fiscal-year cumulative ledger (§5.5). */
export interface PayslipYtd {
  fiscalYear: string;
  /** Number of periods accumulated in the fiscal year so far. */
  monthsElapsed: number;
  grossEarnings: number;
  taxableIncome: number;
  taxDeducted: number;
  totalDeductions: number;
  netPay: number;
  /** Cumulative statutory contributions by component code (e.g. PF, PF_ER). */
  contributions: Record<string, number>;
}

export interface Payslip {
  id: string;
  period: string;
  periodLabel: string;
  currency: string;
  employee: PayslipEmployee;
  company: PayslipCompany;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  /** Employer-side contributions (employer cost) — never reduce net pay. */
  employerContributions?: PayslipLine[];
  /** Year-to-date ledger through this period (§5.5). */
  ytd?: PayslipYtd;
  oneTimeAdditions: PayslipOneTime[];
  oneTimeDeductions: PayslipOneTime[];
  grossEarnings: number;
  totalDeductions: number;
  /** Total employer cost (employer contributions + benefits). */
  employerCost?: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;
  status: PayslipStatus;
  paymentDate: string | null;
  paymentReference: string | null;
  payrollRunId: string;
  generatedAt: string;
}

export interface PayslipSummary {
  id: string;
  period: string;
  periodLabel: string;
  currency: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: PayslipStatus;
  paymentDate: string | null;
  payrollRunId: string;
}

export interface PayslipRunItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  currency: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  status: PayslipStatus;
  hasAdjustments: boolean;
}

/* ── Payroll Runs ─────────────────────────────────────────────────────────── */

export interface PayrollRunWarning {
  employeeId: string;
  employeeName: string;
  message: string;
}

export interface PayrollRunDeptSummary {
  departmentName: string;
  employeeCount: number;
  totalNet: number;
}

export interface PayrollRunSummary {
  byDepartment: PayrollRunDeptSummary[];
  warnings: PayrollRunWarning[];
}

export type PayrollRunType = 'REGULAR' | 'OFF_CYCLE' | 'BONUS' | 'ARREARS' | 'FNF' | 'REVERSAL';

/* ── Full & final settlement (§5.6) ───────────────────────────────────────── */

export interface FnfParams {
  employeeId: string;
  /** YYYY-MM-DD last working day. */
  lastWorkingDay: string;
  yearsOfService: number;
  leaveBalanceDays: number;
  noticeShortfallDays: number;
}

export interface FnfLine {
  code: string;
  label: string;
  /** Minor units. */
  amount: number;
}

export interface FnfSettlement {
  employeeId: string;
  employeeName: string;
  lastWorkingDay: string;
  currency: string;
  earnings: FnfLine[];
  deductions: FnfLine[];
  grossPayable: number;
  totalRecovery: number;
  netSettlement: number;
}

export interface PayrollRun {
  id: string;
  period: string;
  periodLabel: string;
  type: PayrollRunType;
  status: PayrollRunStatus;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  /** Total employer cost across the run (employer contributions + benefits). */
  employerCost?: number;
  totalNet: number;
  currency: string;
  initiatedBy?: string;
  approvedBy?: string | null;
  processedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  summary?: PayrollRunSummary;
  /** Statutory pack version pinned at calculate time; recompute uses this. */
  configSnapshotRef?: RunConfigSnapshotRef | null;
  /** Subject employee for single-employee runs (FnF). */
  employeeId?: string | null;
  /** FnF inputs, present on FNF runs. */
  fnfParams?: FnfParams | null;
  createdAt: string;
}

export interface PayrollRunInput {
  period: string;
  payGroupIds?: string[];
  includeAllActiveEmployees: boolean;
  type?: PayrollRunType;
  fnf?: FnfParams;
}

export interface RosterMember {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
}

/* ── Per-employee, per-run payroll inputs (§6) ────────────────────────────── */

export interface PayrollInputOneTime {
  label: string;
  amount: number;
  kind: 'ADDITION' | 'DEDUCTION';
}

/** Everything that varies per period per employee, fed into the run engine. */
export interface PayrollInput {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  /** Loss-of-pay days (from attendance) — drives proration. */
  lopDays: number;
  /** Paid-leave days (informational; does not reduce pay). */
  leaveDays: number;
  /** Overtime hours — priced at the OT component's configurable multiplier. */
  otHours: number;
  /** Variable-component amounts by component code (incentive, commission, bonus). */
  variablePay: Record<string, number>;
  /** Ad-hoc additions/deductions for this period only. */
  oneTime: PayrollInputOneTime[];
}

export interface PayrollInputsPage {
  runId: string;
  period: string;
  /** Inputs are only editable while the run is DRAFT (before calculation). */
  editable: boolean;
  inputs: PayrollInput[];
}

export interface PayrollInputImportResult {
  updated: number;
  skipped: number;
  errors: string[];
}

/* ── Tax declarations / exemptions / proofs (§5.2) ────────────────────────── */

export type ProofStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface TaxDeclarationItem {
  /** Exemption code from the regime's allowedExemptions (e.g. 80C, HRA). */
  code: string;
  /** Declared amount, minor units. */
  amount: number;
  /** Code-specific extras (e.g. HRA rent paid, metro flag). */
  meta?: Record<string, unknown>;
  proofStatus: ProofStatus;
}

export interface TaxDeclaration {
  employeeId: string;
  fiscalYear: string;
  /** Chosen tax regime code (e.g. IN_NEW_REGIME). */
  regime: string;
  items: TaxDeclarationItem[];
  updatedAt: string;
}

export interface TaxDeclarationInput {
  fiscalYear: string;
  regime: string;
  items: TaxDeclarationItem[];
}

/* ── Loans & advances (§6.2) ──────────────────────────────────────────────── */

export type LoanType = 'LOAN' | 'ADVANCE';
export type LoanInterestMethod = 'REDUCING' | 'FLAT' | 'ZERO';
export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'FORECLOSED';
export type LoanInstallmentStatus = 'PENDING' | 'RECOVERED';

export interface LoanScheduleEntry {
  installmentNo: number;
  /** YYYY-MM the EMI is recovered in. */
  period: string;
  /** All amounts minor units. */
  emi: number;
  principalComponent: number;
  interestComponent: number;
  /** Outstanding balance after this installment. */
  balanceAfter: number;
  status: LoanInstallmentStatus;
}

export interface Loan {
  id: string;
  employeeId: string;
  type: LoanType;
  /** Minor units. */
  principal: number;
  currency: string;
  interestMethod: LoanInterestMethod;
  annualRatePct: number;
  tenureMonths: number;
  /** YYYY-MM of the first EMI. */
  startPeriod: string;
  emiAmount: number;
  schedule: LoanScheduleEntry[];
  outstandingBalance: number;
  status: LoanStatus;
  /** Set when foreclosed — EMIs stop from this period onward. */
  forecloseFromPeriod?: string | null;
  createdAt: string;
}

export interface LoanInput {
  type: LoanType;
  principal: number;
  currency?: string;
  interestMethod: LoanInterestMethod;
  annualRatePct: number;
  tenureMonths: number;
  startPeriod: string;
}

/* ── Reimbursement claims & variable pay (§6, §6.1) ───────────────────────── */

export type ClaimStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface ReimbursementCategory {
  code: string;
  label: string;
  /** Per-period claim cap, minor units. */
  monthlyCap: number;
}

export interface ReimbursementClaim {
  id: string;
  employeeId: string;
  category: string;
  /** Minor units. */
  amount: number;
  currency: string;
  description?: string;
  proofUrl?: string | null;
  status: ClaimStatus;
  /** The run this claim is attached to once approved. */
  runId?: string | null;
  submittedAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
}

export interface ReimbursementClaimInput {
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  proofUrl?: string | null;
}

export interface PayrollRunsPage {
  items: PayrollRun[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayrollRunsParams {
  page?: number;
  limit?: number;
  year?: number;
  status?: PayrollRunStatus;
}

export interface PayslipsPage {
  items: PayslipSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PayslipRunPage {
  items: PayslipRunItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
