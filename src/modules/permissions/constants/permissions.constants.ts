import type { PermissionKey } from '../types/permissions.types';

export const PERMISSION_GROUPS: Array<{ label: string; permissions: PermissionKey[] }> = [
  {
    label: 'Employees',
    permissions: ['employees:read', 'employees:write', 'employees:delete', 'employees:export'],
  },
  { label: 'Departments', permissions: ['departments:read', 'departments:write'] },
  { label: 'Attendance', permissions: ['attendance:read', 'attendance:write'] },
  { label: 'Leave', permissions: ['leave:read', 'leave:request', 'leave:approve'] },
  { label: 'Analytics', permissions: ['analytics:read'] },
  { label: 'Audit', permissions: ['audit:read'] },
  { label: 'Permissions', permissions: ['permissions:manage'] },
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'employees:read': 'View',
  'employees:write': 'Create / Edit',
  'employees:delete': 'Delete',
  'employees:export': 'Export',
  'departments:read': 'View',
  'departments:write': 'Create / Edit',
  'attendance:read': 'View',
  'attendance:write': 'Check-in / Out',
  'leave:read': 'View',
  'leave:request': 'Request',
  'leave:approve': 'Approve / Deny',
  'analytics:read': 'View',
  'audit:read': 'View',
  'permissions:manage': 'Manage',
};

export const BUILT_IN_ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  AUDITOR: 'Auditor',
  HR_ADMIN: 'HR Admin',
  SUPER_ADMIN: 'Super Admin',
};

/** Demo user counts per role — used for the impact preview dialog. */
export const DEMO_USER_COUNTS: Record<string, number> = {
  EMPLOYEE: 15,
  MANAGER: 3,
  HR_ADMIN: 2,
  AUDITOR: 1,
  SUPER_ADMIN: 1,
};
