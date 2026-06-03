import type { ReviewStatus, RatingValue, GoalStatus } from '../types/performance.types';

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { color: string }> = {
  'Not started': { color: 'var(--text-tertiary)' },
  'Self review': { color: 'var(--info-500)' },
  'Manager review': { color: 'var(--warning-500)' },
  Calibrated: { color: 'var(--success-500)' },
};

export const RATING_CONFIG: Record<RatingValue, { color: string }> = {
  Exceeds: { color: 'var(--success-500)' },
  Strong: { color: 'var(--dept-engineering)' },
  Meets: { color: 'var(--info-500)' },
  Developing: { color: 'var(--warning-500)' },
  Below: { color: 'var(--danger-500)' },
};

export const GOAL_STATUS_CONFIG: Record<
  GoalStatus,
  { color: string; variant: 'success' | 'warning' | 'info' }
> = {
  'On track': { color: 'var(--success-500)', variant: 'success' },
  'At risk': { color: 'var(--warning-500)', variant: 'warning' },
  Done: { color: 'var(--brand-500)', variant: 'info' },
};

export const NOTE_TONE_CONFIG = {
  warning: 'var(--warning-500)',
  success: 'var(--success-500)',
  danger: 'var(--danger-500)',
  info: 'var(--info-500)',
} as const;

export const DEPARTMENTS = [
  'All departments',
  'Engineering',
  'Sales',
  'Product',
  'Finance',
  'People',
  'Operations',
];

export const GOAL_STATUSES: Array<'All statuses' | GoalStatus> = [
  'All statuses',
  'On track',
  'At risk',
  'Done',
];
