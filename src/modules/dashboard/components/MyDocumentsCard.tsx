'use client';

import { format, parseISO } from 'date-fns';
import { FileIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';
import { useEmployeeDocuments } from '../hooks/useDashboard';
import type { EmployeeDocument } from '../types/dashboard.types';

const STATUS_BADGE: Record<
  EmployeeDocument['status'],
  { label: string; textClass: string; bgClass: string }
> = {
  VERIFIED: {
    label: 'Verified',
    textClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  PENDING: {
    label: 'Pending',
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  REJECTED: {
    label: 'Rejected',
    textClass: 'text-danger',
    bgClass: 'bg-danger/10',
  },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocRow({ doc }: { doc: EmployeeDocument }) {
  const badge = STATUS_BADGE[doc.status];
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2">
        <FileIcon className="size-4 text-fg-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{doc.filename}</p>
        <p className="text-xs text-fg-subtle">
          {formatBytes(doc.sizeBytes)} · {format(parseISO(doc.uploadedAt), 'dd MMM yyyy')}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
          badge.bgClass,
          badge.textClass,
        )}
      >
        {badge.label}
      </span>
    </li>
  );
}

export function MyDocumentsCard() {
  const { data: docs, isLoading, isError, refetch } = useEmployeeDocuments();

  return (
    <div className="rounded-xl border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">My Documents</h2>
      </div>
      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Skeleton className="size-8 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-4">
            <ErrorState compact message="Failed to load documents" onRetry={() => refetch()} />
          </div>
        ) : !docs || docs.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-subtle">
            {docs.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
