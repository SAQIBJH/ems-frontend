import type { ProjectStatus, TimesheetStatus } from '../types/timesheet.types';

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'text-success bg-success/10' },
  ARCHIVED: { label: 'Archived', color: 'text-fg-muted bg-surface-raised' },
};

export const TIMESHEET_STATUS_CONFIG: Record<TimesheetStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'text-fg-muted bg-surface-raised' },
  SUBMITTED: { label: 'Submitted', color: 'text-info bg-info/10' },
  APPROVED: { label: 'Approved', color: 'text-success bg-success/10' },
  REJECTED: { label: 'Rejected', color: 'text-danger bg-danger/10' },
};

/** Tint for the billable / non-billable pill. */
export const BILLABLE_CONFIG = {
  billable: { label: 'Billable', color: 'text-brand bg-brand/10' },
  nonBillable: { label: 'Non-billable', color: 'text-fg-muted bg-surface-raised' },
} as const;
