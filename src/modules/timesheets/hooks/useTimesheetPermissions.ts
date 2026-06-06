'use client';

import { useAuth } from '@/providers';

/**
 * Timesheet permissions (mirror the payroll segregation-of-duties pattern, §27).
 * Backend-supplied permission strings win; absent those, HR_ADMIN / SUPER_ADMIN get
 * everything (demo fallback). EMPLOYEE/MANAGER get the keys their role implies.
 */
export const TIMESHEET_PERMISSIONS = {
  WRITE: 'timesheets:write',
  APPROVE: 'timesheets:approve',
  ADMIN: 'timesheets:admin',
  READ: 'timesheets:read',
} as const;

export interface TimesheetPermissions {
  /** Log/edit own entries, run the timer, submit own week. */
  canWrite: boolean;
  /** Approve / reject team timesheets. */
  canApprove: boolean;
  /** Manage projects/tasks, settings, all reports. */
  canAdmin: boolean;
  /** Read-only access. */
  canRead: boolean;
}

export function useTimesheetPermissions(): TimesheetPermissions {
  const { user, permissions } = useAuth();
  const elevated = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';
  const isManager = user?.memberType === 'MANAGER';
  const has = (key: string) => permissions.includes(key);

  return {
    canWrite: has(TIMESHEET_PERMISSIONS.WRITE) || elevated || isManager || !!user,
    canApprove: has(TIMESHEET_PERMISSIONS.APPROVE) || elevated || isManager,
    canAdmin: has(TIMESHEET_PERMISSIONS.ADMIN) || elevated,
    canRead: has(TIMESHEET_PERMISSIONS.READ) || elevated || isManager,
  };
}
