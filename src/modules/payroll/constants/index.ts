import type {
  ComponentType,
  CalculationType,
  PayrollRunStatus,
  BankFileFormatOption,
  PaymentBatchStatus,
  PayoutStatus,
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
