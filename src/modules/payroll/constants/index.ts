import type { ComponentType, CalculationType, PayrollRunStatus } from '../types/payroll.types';

export const COMPONENT_TYPE_CONFIG: Record<
  ComponentType,
  { label: string; color: string; icon: string }
> = {
  EARNING: { label: 'Earning', color: 'text-success bg-success/10', icon: '+' },
  DEDUCTION: { label: 'Deduction', color: 'text-danger bg-danger/10', icon: '−' },
  BENEFIT: { label: 'Benefit', color: 'text-info bg-info/10', icon: '◇' },
  REIMBURSEMENT: { label: 'Reimbursement', color: 'text-warning bg-warning/10', icon: '↩' },
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
