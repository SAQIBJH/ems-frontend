import type { AnnouncementCategory } from '../types/announcements.types';

export const CATEGORY_CONFIG: Record<AnnouncementCategory, { color: string; label: string }> = {
  Company: { color: 'var(--brand-500)', label: 'Company' },
  People: { color: 'var(--dept-people)', label: 'People' },
  Product: { color: 'var(--dept-product)', label: 'Product' },
  IT: { color: 'var(--dept-engineering)', label: 'IT' },
  Office: { color: 'var(--dept-operations)', label: 'Office' },
};

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'Company',
  'People',
  'Product',
  'IT',
  'Office',
];

export const AUDIENCE_OPTIONS = [
  'All employees',
  'Managers',
  'HR team',
  'Engineering',
  'Bengaluru',
  'Remote',
];
