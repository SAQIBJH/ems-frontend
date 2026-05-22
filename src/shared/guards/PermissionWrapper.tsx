'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/providers';

interface Props {
  /** The permission string to check, e.g. "employees:write". */
  permission: string;
  children: ReactNode;
  /** Rendered when the user lacks the permission. Defaults to null. */
  fallback?: ReactNode;
}

/**
 * UI-level permission gate. Hides children when the authenticated user
 * does not hold the required permission. This is a UX affordance only —
 * all real enforcement happens server-side.
 */
export function PermissionWrapper({ permission, children, fallback = null }: Props) {
  const { permissions } = useAuth();

  if (!permissions.includes(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
