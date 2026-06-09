'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { useAuth } from '@/providers';
import { EmptyState } from '@/components/feedback/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  /** Permission required to view the page, e.g. "employees:write". */
  permission: string;
  children: ReactNode;
  /** Where "Go back" links to when access is denied. */
  backHref?: string;
  backLabel?: string;
}

/**
 * Route-level permission guard. Unlike {@link PermissionWrapper} (which silently
 * hides children), this renders a full access-denied state when the user lacks the
 * permission — for guarding whole pages (create/edit routes) reachable by direct
 * URL navigation. Real enforcement is still server-side; this is the UX gate so a
 * user without the permission doesn't fill out a form only to hit a 403 on submit.
 */
export function RequirePermission({
  permission,
  children,
  backHref = '/',
  backLabel = 'Go back',
}: Props) {
  const { permissions, isLoading } = useAuth();

  // Wait for /auth/me so we don't flash the form (or the denial) before we know.
  if (isLoading) return null;

  if (!permissions.includes(permission)) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access restricted"
          description="You don't have permission to access this page."
          action={
            <Link href={backHref} className={cn(buttonVariants({ variant: 'outline' }))}>
              {backLabel}
            </Link>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
