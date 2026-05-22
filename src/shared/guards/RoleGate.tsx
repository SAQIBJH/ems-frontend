'use client';

import type { ReactNode } from 'react';
import type { UserRole } from '@/types/user';
import { useAuth } from '@/providers';

interface Props {
  /** Roles allowed to see children. */
  roles: UserRole[];
  children: ReactNode;
  /** Rendered when the user's role is not in the allowed list. Defaults to null. */
  fallback?: ReactNode;
}

/**
 * UI-level role gate. Hides children when the authenticated user's role
 * is not in the allowed list. Prefer PermissionWrapper for fine-grained
 * gates; use RoleGate only for coarse role-level separation (e.g. hiding
 * the Permissions matrix from non-admins entirely).
 */
export function RoleGate({ roles, children, fallback = null }: Props) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.memberType)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
