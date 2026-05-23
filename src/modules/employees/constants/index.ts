import type { EmploymentType, EmploymentStatus } from '../types/employee.types';

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  ACTIVE: 'Active',
  TERMINATED: 'Terminated',
};

// Known departments from seed data.
// Replaced by a live useDepartments query in Step 11 when departments module is built.
export const KNOWN_DEPARTMENTS = [
  { id: 'dept-001', name: 'Engineering' },
  { id: 'dept-002', name: 'HR' },
  { id: 'dept-003', name: 'Sales' },
  { id: 'dept-004', name: 'Finance' },
  { id: 'dept-005', name: 'Customer Success' },
  { id: 'dept-006', name: 'Marketing' },
  { id: 'dept-007', name: 'Operations' },
] as const;
