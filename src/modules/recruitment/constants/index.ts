import type { RecruitmentStage, OpeningStatus, EmploymentType } from '../types/recruitment.types';

export const RECRUIT_STAGES: {
  key: RecruitmentStage;
  label: string;
  color: string;
}[] = [
  { key: 'applied', label: 'Applied', color: 'var(--dept-engineering)' },
  { key: 'screening', label: 'Screening', color: 'var(--info-500)' },
  { key: 'interview', label: 'Interview', color: 'var(--warning-500)' },
  { key: 'offer', label: 'Offer', color: 'var(--dept-product)' },
  { key: 'hired', label: 'Hired', color: 'var(--success-500)' },
];

export const STAGE_SEQUENCE: RecruitmentStage[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
];

export const OPENING_STATUS_CONFIG: Record<
  OpeningStatus,
  { variant: 'success' | 'warning' | 'secondary' | 'destructive'; dot?: boolean }
> = {
  Open: { variant: 'success', dot: true },
  Closing: { variant: 'warning', dot: true },
  'On hold': { variant: 'secondary', dot: true },
  Closed: { variant: 'secondary' },
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};
