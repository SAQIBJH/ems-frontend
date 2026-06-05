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
  };
}
