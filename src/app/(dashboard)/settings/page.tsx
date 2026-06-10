'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { firstAccessibleSettingsPath } from '@/modules/settings/components/SettingsNav';

/**
 * `/settings` has no content of its own — redirect to the first panel the
 * current role can access. (A static redirect to company-profile stranded
 * MANAGER/EMPLOYEE on an HR/SUPER-only panel that 403s — SET-1.)
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(firstAccessibleSettingsPath(user.memberType));
  }, [user, router]);

  return null;
}
