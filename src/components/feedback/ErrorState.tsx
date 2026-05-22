'use client';

import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  requestId?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  requestId,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10">
        <AlertCircleIcon className="size-6 text-danger" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="text-sm text-fg-muted">{message}</p>
        {requestId && <p className="font-mono text-xs text-fg-subtle">Request ID: {requestId}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon className="size-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
