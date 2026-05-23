'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { push } = useRouter();

  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertTriangle className="size-12 text-danger" aria-hidden />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-fg">Something went wrong</h2>
        <p className="max-w-sm text-sm text-fg-muted">
          This page encountered an error. Your other pages are not affected.
        </p>
        {error.digest && (
          <p className="text-xs text-fg-disabled font-mono">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => push('/dashboard')}>
          Back to dashboard
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
