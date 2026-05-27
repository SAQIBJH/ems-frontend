'use client';

import type { ReactNode } from 'react';
import { DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';

interface ReportShellProps {
  title: string;
  description?: string;
  filterBar?: ReactNode;
  chart?: ReactNode;
  table?: ReactNode;
  onExport?: () => void;
  isExporting?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ReportShell({
  title,
  description,
  filterBar,
  chart,
  table,
  onExport,
  isExporting = false,
  isLoading = false,
  isError = false,
  onRetry,
}: ReportShellProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting || isLoading}
            className="shrink-0"
          >
            <DownloadIcon className="size-3.5" aria-hidden />
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        )}
      </div>

      {filterBar && <div>{filterBar}</div>}

      {isError ? (
        <ErrorState
          message="Failed to load report data."
          onRetry={onRetry}
          className="rounded-lg border border-subtle bg-surface"
        />
      ) : isLoading ? (
        <ReportSkeleton />
      ) : (
        <div className="space-y-4">
          {chart && <div className="rounded-lg border border-subtle bg-surface p-4">{chart}</div>}
          {table && <div className="rounded-lg border border-subtle bg-surface">{table}</div>}
        </div>
      )}
    </div>
  );
}
