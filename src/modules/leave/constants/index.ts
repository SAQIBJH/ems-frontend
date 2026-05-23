import type { LeaveStatus } from '../types/leave.types';

export const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  PENDING: {
    label: 'Pending',
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30',
  },
  APPROVED: {
    label: 'Approved',
    textClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30',
  },
  DENIED: {
    label: 'Denied',
    textClass: 'text-danger',
    bgClass: 'bg-danger/10',
    borderClass: 'border-danger/30',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    textClass: 'text-fg-muted',
    bgClass: 'bg-surface-2',
    borderClass: 'border-subtle',
  },
};
