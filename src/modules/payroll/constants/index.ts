import type {
  ComponentType,
  CalculationType,
  PayrollRunStatus,
  BankFileFormatOption,
  PaymentBatchStatus,
  PayoutStatus,
  PayslipTemplate,
  PayrollEventCatalogEntry,
} from '../types/payroll.types';

export const COMPONENT_TYPE_CONFIG: Record<
  ComponentType,
  { label: string; color: string; icon: string }
> = {
  EARNING: { label: 'Earning', color: 'text-success bg-success/10', icon: '+' },
  DEDUCTION: { label: 'Deduction', color: 'text-danger bg-danger/10', icon: '−' },
  EMPLOYER_CONTRIBUTION: {
    label: 'Employer Contribution',
    color: 'text-brand bg-brand/10',
    icon: '⊕',
  },
  BENEFIT: { label: 'Benefit', color: 'text-info bg-info/10', icon: '◇' },
  REIMBURSEMENT: { label: 'Reimbursement', color: 'text-warning bg-warning/10', icon: '↩' },
  VARIABLE: { label: 'Variable', color: 'text-fg-muted bg-surface-raised', icon: '~' },
};

export const CALCULATION_TYPE_CONFIG: Record<
  CalculationType,
  { label: string; description: string }
> = {
  FLAT: { label: 'Flat amount', description: 'Fixed monthly amount' },
  PERCENTAGE: {
    label: 'Percentage',
    description: 'Percentage of another component',
  },
  FORMULA: {
    label: 'Formula',
    description: 'Expression using component codes (e.g. BASIC * 0.4)',
  },
};

export const RUN_STATUS_CONFIG: Record<PayrollRunStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'text-fg-subtle bg-surface-raised' },
  CALCULATING: { label: 'Calculating', color: 'text-info bg-info/10' },
  REVIEW: { label: 'Review', color: 'text-warning bg-warning/10' },
  APPROVED: { label: 'Approved', color: 'text-success bg-success/10' },
  PAID: { label: 'Paid', color: 'text-success bg-success/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-danger bg-danger/10' },
};

/* ── Disbursement (§9) ─────────────────────────────────────────────────────── */

/** Selectable bank-file formats (labels mirror the server-side format registry). */
export const BANK_FILE_FORMATS: BankFileFormatOption[] = [
  { code: 'NACH', label: 'NACH / H2H', description: 'India — NACH host-to-host' },
  { code: 'ACH', label: 'ACH (NACHA)', description: 'United States — ACH / NACHA' },
  { code: 'SEPA', label: 'SEPA pain.001', description: 'Eurozone — SEPA credit transfer' },
  { code: 'BACS', label: 'Bacs', description: 'United Kingdom — Bacs' },
];

export const PAYOUT_STATUS_CONFIG: Record<PayoutStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-fg-muted bg-surface-raised' },
  PROCESSING: { label: 'Processing', color: 'text-info bg-info/10' },
  PAID: { label: 'Paid', color: 'text-success bg-success/10' },
  FAILED: { label: 'Failed', color: 'text-danger bg-danger/10' },
  RETURNED: { label: 'Returned', color: 'text-warning bg-warning/10' },
};

export const PAYMENT_BATCH_STATUS_CONFIG: Record<
  PaymentBatchStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Not started', color: 'text-fg-muted bg-surface-raised' },
  PROCESSING: { label: 'Processing', color: 'text-info bg-info/10' },
  COMPLETED: { label: 'Completed', color: 'text-success bg-success/10' },
};

/* ── Payslip template & events (§10, §20) ──────────────────────────────────── */

/**
 * The built-in payslip template. Doubles as the MSW seed and the drawer's fallback
 * when the tenant template hasn't loaded. Layout is data — sections render in `order`
 * when `enabled`, with `label` as the (locale-specific) heading.
 */
export const DEFAULT_PAYSLIP_TEMPLATE: PayslipTemplate = {
  id: 'tpl-default',
  name: 'Standard Payslip',
  locale: 'en-IN',
  logoUrl: null,
  sections: [
    { key: 'earnings', label: 'Earnings', enabled: true, order: 1 },
    { key: 'oneTime', label: 'One-time Items', enabled: true, order: 2 },
    { key: 'deductions', label: 'Deductions', enabled: true, order: 3 },
    { key: 'employerContributions', label: 'Employer Contributions', enabled: false, order: 4 },
    { key: 'ytd', label: 'Year to Date', enabled: true, order: 5 },
    { key: 'attendance', label: 'Attendance', enabled: true, order: 6 },
    { key: 'paymentInfo', label: 'Payment Details', enabled: true, order: 7 },
  ],
  fields: [
    { key: 'employeeCode', label: 'Employee Code', enabled: true },
    { key: 'designation', label: 'Designation', enabled: true },
    { key: 'department', label: 'Department', enabled: true },
    { key: 'pan', label: 'PAN', enabled: true },
    { key: 'payDate', label: 'Pay Date', enabled: true },
    { key: 'paymentRef', label: 'Payment Reference', enabled: false },
  ],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** The subscribable webhook/notification event catalogue (§20). */
export const PAYROLL_EVENT_CATALOGUE: PayrollEventCatalogEntry[] = [
  {
    type: 'payroll.run.created',
    label: 'Run created',
    description: 'A payroll run was initiated for a period.',
    category: 'run',
  },
  {
    type: 'payroll.run.calculated',
    label: 'Run calculated',
    description: 'A run finished calculation and is ready for review.',
    category: 'run',
  },
  {
    type: 'payroll.run.approved',
    label: 'Run approved',
    description: 'A run cleared every approval level.',
    category: 'run',
  },
  {
    type: 'payroll.run.paid',
    label: 'Run paid',
    description: 'A run was marked paid.',
    category: 'run',
  },
  {
    type: 'payslip.published',
    label: 'Payslips published',
    description: 'Payslips for a run became visible to employees.',
    category: 'payslip',
  },
  {
    type: 'payment.failed',
    label: 'Payment failed',
    description: 'A payout failed or was returned by the bank.',
    category: 'payment',
  },
  {
    type: 'salary.revised',
    label: 'Salary revised',
    description: "An employee's compensation was changed.",
    category: 'employee',
  },
  {
    type: 'claim.approved',
    label: 'Claim approved',
    description: 'A reimbursement claim was approved.',
    category: 'employee',
  },
];

export const PAYROLL_EVENT_CONFIG: Record<PayrollEventCatalogEntry['category'], { color: string }> =
  {
    run: { color: 'text-info bg-info/10' },
    payslip: { color: 'text-success bg-success/10' },
    payment: { color: 'text-warning bg-warning/10' },
    employee: { color: 'text-brand bg-brand/10' },
  };
