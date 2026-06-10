'use client';

import { useAuth } from '@/providers';

/**
 * Granular payroll permissions (§8 segregation of duties). The four actions are
 * distinct so that initiating, adjusting, approving, and disbursing can be held by
 * different people. Maker ≠ checker is enforced server-side on approval.
 */
export const PAYROLL_PERMISSIONS = {
  INITIATE: 'payroll:initiate',
  ADJUST: 'payroll:adjust',
  APPROVE: 'payroll:approve',
  DISBURSE: 'payroll:disburse',
} as const;

export interface PayrollPermissions {
  canInitiate: boolean;
  canAdjust: boolean;
  canApprove: boolean;
  canDisburse: boolean;
  /** Cancel a non-PAID run — requires `payroll:initiate` (HR_ADMIN + SUPER_ADMIN). */
  canCancel: boolean;
}

/**
 * Resolve a user's payroll permissions. Backend-supplied permission strings win;
 * absent those, HR_ADMIN / SUPER_ADMIN are granted all (demo fallback — in
 * production each key is assigned per-user). Other roles get none.
 */
export function usePayrollPermissions(): PayrollPermissions {
  const { user, permissions } = useAuth();
  const elevated = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';
  const has = (key: string) => permissions.includes(key) || elevated;
  return {
    canInitiate: has(PAYROLL_PERMISSIONS.INITIATE),
    canAdjust: has(PAYROLL_PERMISSIONS.ADJUST),
    canApprove: has(PAYROLL_PERMISSIONS.APPROVE),
    canDisburse: has(PAYROLL_PERMISSIONS.DISBURSE),
    // Cancel is gated on payroll:initiate (HR_ADMIN + SUPER_ADMIN). The backend now
    // allows HR to cancel non-PAID runs (BE-7 fixed 2026-06-10; PAID runs stay
    // uncancellable server-side) — previously this was SUPER_ADMIN-only to match a 403.
    canCancel: has(PAYROLL_PERMISSIONS.INITIATE),
  };
}
