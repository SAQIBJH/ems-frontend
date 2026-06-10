'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers';
import { ErrorState } from '@/components/feedback/ErrorState';
import { settingsPanelRoles } from './SettingsNav';

/**
 * Route-level access guard for Settings panels. The Settings nav only *hides*
 * items a role can't use, but the panel routes themselves are reachable by
 * direct URL (and `/settings` redirects here) — so without this guard a lower
 * role lands on an HR/SUPER-only panel whose endpoints 403, producing a wall of
 * error states + console noise (CC-12). This denies access cleanly *before* the
 * panel (and its data queries) mount, using the same role config as the nav.
 */
export function SettingsAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const roles = settingsPanelRoles(pathname);

  if (user && roles && !roles.includes(user.memberType)) {
    return (
      <ErrorState message="You don't have permission to view this setting. Choose one you have access to from the menu." />
    );
  }

  return <>{children}</>;
}
