import type { RunConfigSnapshotRef } from './statutory.types';

export type ComponentType =
  | 'EARNING'
  | 'DEDUCTION'
  | 'EMPLOYER_CONTRIBUTION'
  | 'BENEFIT'
  | 'REIMBURSEMENT'
  | 'VARIABLE';
export type CalculationType = 'FLAT' | 'PERCENTAGE' | 'FORMULA';
/** How a component's cost is allocated to cost centers in the GL journal (§11). */
export type CostCenterRule = 'DEPARTMENT' | 'NONE';
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
  /**
   * Calendar months (1–12) this component is paid in; `null` = every period.
   * Models scheduled pay (13th/14th-month, holiday allowance) as config, not code.
   */
  payInPeriods: number[] | null;
  /** GL account this component posts to in the accounting journal (§11). */
  glAccountCode?: string | null;
  /** How this component's cost is allocated to cost centers in the journal (§11). */
  costCenterRule?: CostCenterRule;
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
  payInPeriods?: number[] | null;
  description?: string | null;
  glAccountCode?: string | null;
  costCenterRule?: CostCenterRule;
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

/** A jurisdiction the employee works in, with the share of work allocated to it. */
export interface WorkLocation {
  /** ISO 3166-2 jurisdiction. */
  jurisdiction: string;
  /** Percentage of work allocated to this jurisdiction (0–100). */
  allocationPct: number;
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
  /** ISO 3166-2 tax-residence jurisdiction (drives local-tax resolution). */
  residenceJurisdiction: string;
  /** Work-location jurisdictions; the engine taxes the resolved set (§3.6). */
  workLocations: WorkLocation[];
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
  residenceJurisdiction?: string;
  workLocations?: WorkLocation[];
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

/* ── Approvals, audit, variance (§8, §7.5) ────────────────────────────────── */

export type RunApprovalStatus = 'PENDING' | 'APPROVED';

/** One level in a run's configurable approval chain (maker-checker, multi-level). */
export interface RunApprovalLevel {
  level: number;
  label: string;
  status: RunApprovalStatus;
  approver: string | null;
  approvedAt: string | null;
}

/** Immutable audit entry for a run transition / override / approval. */
export interface PayrollRunAuditEntry {
  id: string;
  runId: string;
  action: string;
  actor: string;
  at: string;
  detail?: string;
}

export type RunVarianceFlag = 'HIGH_VARIANCE' | 'NEGATIVE_NET' | 'ZERO_PAY' | 'NEW_JOINER';

export interface RunVarianceItem {
  employeeId: string;
  employeeName: string;
  currentNet: number;
  previousNet: number | null;
  /** Net change vs last period, percent (null when no prior payslip). */
  deltaPct: number | null;
  flags: RunVarianceFlag[];
}

export interface RunVariance {
  runId: string;
  /** Anomaly threshold for |deltaPct|. */
  thresholdPct: number;
  /** Period compared against, or null if none. */
  comparedToPeriod: string | null;
  items: RunVarianceItem[];
}

/** Result of a sandbox (dry-run) calculation — numbers + variance, nothing persisted. */
export interface RunDryRunResult {
  dryRun: true;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  employerCost: number;
  totalNet: number;
  currency: string;
  warnings: PayrollRunWarning[];
  variance: RunVariance;
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
  /** Configurable multi-level approval chain (maker-checker). Present from REVIEW on. */
  approvals?: RunApprovalLevel[];
  /** Whether payslips for this run are visible to employees (publish workflow, §10). */
  published?: boolean;
  publishedAt?: string | null;
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
  /** Night/shift-differential hours — priced at the SHIFT component's multiplier. */
  shiftHours: number;
  /** On-call / standby hours — priced at the ONCALL component's multiplier. */
  onCallHours: number;
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

/* ── Garnishments / court orders (§5.7) ────────────────────────────────────── */

export type GarnishmentType =
  | 'CHILD_SUPPORT'
  | 'SPOUSAL_SUPPORT'
  | 'TAX_LEVY'
  | 'COURT_ORDER'
  | 'DEFAULTED_LOAN';

export type GarnishmentAmountKind = 'FLAT' | 'PERCENT_OF_DISPOSABLE';

export interface GarnishmentAmount {
  kind: GarnishmentAmountKind;
  /** FLAT: amount in minor units. PERCENT_OF_DISPOSABLE: percent of disposable (0–100). */
  value: number;
}

export interface Garnishment {
  id: string;
  employeeId: string;
  type: GarnishmentType;
  /** Lower number = satisfied first when disposable income can't cover every order. */
  priority: number;
  amount: GarnishmentAmount;
  /** Minimum take-home the employee must retain (minor units). */
  protectedEarningsFloor: number;
  /** Optional per-order maximum deduction (minor units); null = uncapped. */
  cap: number | null;
  /** Court / order reference. */
  reference: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export interface GarnishmentInput {
  type: GarnishmentType;
  priority: number;
  amount: GarnishmentAmount;
  protectedEarningsFloor: number;
  cap?: number | null;
  reference: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

/* ── Global employment models (§18) ────────────────────────────────────────── */

export type WorkerClassification = 'EMPLOYEE' | 'CONTRACTOR' | 'EOR';

export interface Worker {
  id: string;
  name: string;
  classification: WorkerClassification;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** ISO 4217 — the worker's pay/contract currency. */
  currency: string;
  legalEntityId: string;
  legalEntityName: string;
  /** Monthly people cost in the worker's own currency, minor units. */
  monthlyCost: number;
  /** Misclassification / compliance risk flag (e.g. contractor working like staff). */
  riskFlag: string | null;
  active: boolean;
}

export type ContractorInvoiceStatus = 'SUBMITTED' | 'APPROVED' | 'PAID';

export interface ContractorInvoice {
  id: string;
  workerId: string;
  workerName: string;
  /** YYYY-MM. */
  period: string;
  /** Gross invoice amount, minor units. */
  amount: number;
  currency: string;
  /** Optional withholding-tax-at-source, percent. */
  withholdingPct: number;
  /** amount − withholding, minor units. */
  netPayable: number;
  status: ContractorInvoiceStatus;
  payoutRef: string | null;
  submittedAt: string;
  decidedAt: string | null;
}

export interface ContractorInvoiceInput {
  workerId: string;
  period: string;
  amount: number;
  currency?: string;
  withholdingPct?: number;
}

export type CostGroupBy = 'entity' | 'currency' | 'classification';

export interface CostSummaryGroup {
  key: string;
  workerCount: number;
  /** Consolidated cost in the base currency, minor units. */
  baseAmount: number;
}

export interface CostSummary {
  groupBy: CostGroupBy;
  baseCurrency: string;
  totalBaseCost: number;
  totalWorkers: number;
  groups: CostSummaryGroup[];
  /** Currency → rate applied to consolidate into the base currency. */
  fxRates: Record<string, number>;
}

/* ── Payslip template & documents (§10) ────────────────────────────────────── */

/** A renderable payslip section — its presence/order/heading are all config. */
export type PayslipSectionKey =
  | 'earnings'
  | 'deductions'
  | 'employerContributions'
  | 'oneTime'
  | 'ytd'
  | 'attendance'
  | 'paymentInfo';

export interface PayslipTemplateSection {
  key: PayslipSectionKey;
  /** Locale-specific section heading. */
  label: string;
  enabled: boolean;
  order: number;
}

/** A header field shown on the slip — toggled and labelled by config. */
export type PayslipHeaderFieldKey =
  | 'employeeCode'
  | 'designation'
  | 'department'
  | 'pan'
  | 'payDate'
  | 'paymentRef';

export interface PayslipTemplateField {
  key: PayslipHeaderFieldKey;
  label: string;
  enabled: boolean;
}

/** Tenant-level payslip layout — data, not a per-country component. */
export interface PayslipTemplate {
  id: string;
  name: string;
  /** BCP-47 locale: the slip's language + date/number formatting. */
  locale: string;
  logoUrl: string | null;
  sections: PayslipTemplateSection[];
  fields: PayslipTemplateField[];
  updatedAt: string;
}

export interface PayslipTemplateInput {
  name?: string;
  locale?: string;
  logoUrl?: string | null;
  sections?: PayslipTemplateSection[];
  fields?: PayslipTemplateField[];
}

/* ── Annual tax forms (§10) ────────────────────────────────────────────────── */

export type TaxFormType = 'FORM16' | 'W2' | 'P60';

/** A label/value line in a tax-form section (value is server pre-formatted). */
export interface TaxFormRow {
  label: string;
  value: string;
}

export interface TaxFormSection {
  title: string;
  rows: TaxFormRow[];
}

/** Employer or employee block, with template-defined statutory identifiers. */
export interface TaxFormParty {
  name: string;
  subtitle?: string;
  identifiers: { label: string; value: string }[];
}

/** A fully-resolved annual tax form, built generically from a template + YTD + pack. */
export interface TaxFormDocument {
  type: TaxFormType;
  title: string;
  fiscalYear: string;
  /** ISO 3166-1 alpha-2 jurisdiction the form is filed in. */
  jurisdiction: string;
  /** Issuing authority (e.g. Income Tax Department, IRS, HMRC). */
  authority: string;
  currency: string;
  employer: TaxFormParty;
  employee: TaxFormParty;
  sections: TaxFormSection[];
  generatedAt: string;
}

export interface TaxFormOption {
  type: TaxFormType;
  label: string;
  description: string;
}

/* ── Events & webhook catalogue (§20) ──────────────────────────────────────── */

export type PayrollEventType =
  | 'payroll.run.created'
  | 'payroll.run.calculated'
  | 'payroll.run.approved'
  | 'payroll.run.paid'
  | 'payslip.published'
  | 'payment.failed'
  | 'salary.revised'
  | 'claim.approved';

export type PayrollEventCategory = 'run' | 'payslip' | 'payment' | 'employee';

/** One entry in the subscribable webhook/notification catalogue. */
export interface PayrollEventCatalogEntry {
  type: PayrollEventType;
  label: string;
  description: string;
  category: PayrollEventCategory;
}

/** An immutable lifecycle event emitted for downstream systems and notifications. */
export interface PayrollEvent {
  id: string;
  type: PayrollEventType;
  runId: string | null;
  at: string;
  summary: string;
}

/* ── Accounting: GL journal (§11) ──────────────────────────────────────────── */

/** One double-entry journal line — exactly one of debit/credit is non-zero. */
export interface JournalLine {
  account: string;
  costCenter: string | null;
  /** Run-domain major units. */
  debit: number;
  credit: number;
  currency: string;
}

/** A run's full accounting journal — balanced when totalDebit === totalCredit. */
export interface JournalDocument {
  runId: string;
  period: string;
  currency: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  generatedAt: string;
}

export type JournalExportFormat = 'TALLY' | 'QUICKBOOKS' | 'CSV';

export interface JournalExportOption {
  format: JournalExportFormat;
  label: string;
  description: string;
}

/* ── Statutory filing & registers (§12) ────────────────────────────────────── */

/** Statutory return formats — each resolves to a template in the return registry. */
export type StatutoryReturnType = 'ECR' | '24Q' | 'RTI';

export interface StatutoryReturnOption {
  type: StatutoryReturnType;
  label: string;
  description: string;
}

/** The four payroll registers surfaced in the Reports module payroll category. */
export type PayrollRegisterType = 'SALARY' | 'STATUTORY' | 'BANK_ADVICE' | 'VARIANCE';

/** How a register column's raw value is formatted by the consuming UI. */
export type RegisterColumnKind = 'text' | 'money' | 'number' | 'percent';

/** A self-describing register column — config, so the UI renders generically. */
export interface RegisterColumn {
  key: string;
  label: string;
  align: 'left' | 'right';
  kind: RegisterColumnKind;
}

export interface RegisterSummaryItem {
  label: string;
  /** Pre-formatted display value (server formats; UI shows verbatim). */
  value: string;
}

/**
 * A run-scoped register: self-describing columns + raw rows + a summary strip.
 * Money cells are major-unit numbers (engine domain); the UI formats by `kind`.
 */
export interface PayrollRegister {
  register: PayrollRegisterType;
  runId: string;
  period: string;
  periodLabel: string;
  currency: string;
  columns: RegisterColumn[];
  rows: Record<string, string | number | null>[];
  summary: RegisterSummaryItem[];
  generatedAt: string;
}

/* ── Disbursement & payments (§9) ──────────────────────────────────────────── */

/** Per-payslip payout status, reconciled back from the bank/gateway. */
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'RETURNED';

/** Overall lifecycle of a payment batch. */
export type PaymentBatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';

/** Bank-file format codes — each resolves to a config-driven column spec, not code. */
export type BankFileFormat = 'NACH' | 'ACH' | 'SEPA' | 'BACS';

/** One employee's payout within a batch, tracked through the payout lifecycle. */
export interface PaymentBatchLine {
  payslipId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  /** Net payable — run-domain major units (mirrors the payslip net). */
  amount: number;
  currency: string;
  status: PayoutStatus;
  /** Reason set when a payout is FAILED or RETURNED; null otherwise. */
  failureReason: string | null;
  /** Bank/gateway payout reference, set once PAID. */
  payoutRef: string | null;
}

/** A run's payout ledger — one line per payslip, reconciled from the bank/gateway. */
export interface PaymentBatch {
  id: string;
  runId: string;
  count: number;
  /** Sum of line amounts — run-domain major units. */
  totalAmount: number;
  currency: string;
  status: PaymentBatchStatus;
  createdAt: string;
  /** Timestamp of the last reconcile step; null until first reconciled. */
  reconciledAt: string | null;
  lines: PaymentBatchLine[];
}

/** A selectable bank-file format option (label + country description). */
export interface BankFileFormatOption {
  code: BankFileFormat;
  label: string;
  description: string;
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

/* ── Onboarding, migration & parallel run (§19) ────────────────────────────── */

export type PayFrequency = 'MONTHLY' | 'SEMI_MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
export type PayDateRule = 'LAST_WORKING_DAY' | 'FIXED_DAY' | 'NEXT_MONTH_FIXED_DAY';

/** A published pay schedule per legal entity — cutoffs, processing & pay dates. */
export interface PayCalendar {
  id: string;
  name: string;
  legalEntityId: string | null;
  frequency: PayFrequency;
  /** Day-of-month the cycle's period starts (1–28). */
  periodAnchor: number;
  payDateRule: PayDateRule;
  /** Day-of-month for FIXED_DAY rules; null otherwise. */
  payDay: number | null;
  /** Attendance/input cutoff day-of-month. */
  cutoffDay: number;
  holidayCalendarId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayCalendarInput {
  name: string;
  legalEntityId: string | null;
  frequency: PayFrequency;
  periodAnchor: number;
  payDateRule: PayDateRule;
  payDay: number | null;
  cutoffDay: number;
  holidayCalendarId: string | null;
}

/** Imported opening YTD ledger for an employee — seeds mid-year go-live tax. */
export interface OpeningBalance {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  fiscalYear: string;
  grossEarnings: number;
  taxableIncome: number;
  taxDeducted: number;
  totalDeductions: number;
  netPay: number;
  /** Opening statutory contribution totals by component code. */
  contributions: Record<string, number>;
  importedAt: string;
}

export interface OpeningBalanceInput {
  fiscalYear: string;
  grossEarnings: number;
  taxableIncome: number;
  taxDeducted: number;
  totalDeductions: number;
  netPay: number;
  contributions?: Record<string, number>;
}

/** One prior payslip imported for continuity (tax forms, history). */
export interface HistoricalPayslipImportRow {
  employeeCode: string;
  /** YYYY-MM. */
  period: string;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
}

export interface HistoricalPayslipImportResult {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
}

/** Per-employee parallel-run reconciliation status. */
export type ReconcileStatus = 'MATCH' | 'MISMATCH' | 'MISSING';

export interface ReconcileItem {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  /** Run-domain major units. */
  computedNet: number;
  /** Legacy figure; null when no legacy row was supplied. */
  legacyNet: number | null;
  diff: number;
  status: ReconcileStatus;
}

export interface ParallelReconcileResult {
  runId: string;
  period: string;
  currency: string;
  /** Acceptable absolute diff for a MATCH (major units). */
  tolerance: number;
  matched: number;
  mismatched: number;
  missing: number;
  items: ReconcileItem[];
  generatedAt: string;
}

export interface ParallelReconcileInput {
  tolerance?: number;
  legacy: { employeeCode: string; netPay: number }[];
}

/** Tenant migration state — sandbox flag, go-live period & derived progress counts. */
export interface MigrationStatus {
  sandboxMode: boolean;
  goLivePeriod: string | null;
  openingBalancesCount: number;
  historicalPayslipsCount: number;
  lastReconciledRunId: string | null;
  updatedAt: string;
}

export interface MigrationStatusInput {
  sandboxMode?: boolean;
  goLivePeriod?: string | null;
}
