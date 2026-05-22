'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers';

/**
 * Wraps dashboard routes. While /auth/me is resolving, shows a spinner.
 * If the session is invalid after resolution, redirects to /login?next=<path>.
 * Children only render when the user is confirmed authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-5 w-5 animate-spin text-fg-muted" aria-label="Checking session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect is in-flight; render nothing to avoid a flash of dashboard UI.
    return null;
  }

  return <>{children}</>;
}
