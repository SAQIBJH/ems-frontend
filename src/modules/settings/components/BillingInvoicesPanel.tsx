'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  DownloadIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

import { useInvoices } from '../hooks/useSettings';
import type { Invoice, InvoiceStatus } from '../types/settings.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function exportCsv(invoices: Invoice[]) {
  const header = ['Invoice #', 'Description', 'Date', 'Due Date', 'Period', 'Amount', 'Status'];
  const rows = invoices.map((inv) => [
    inv.number,
    inv.description,
    format(parseISO(inv.date), 'yyyy-MM-dd'),
    format(parseISO(inv.dueDate), 'yyyy-MM-dd'),
    `${format(parseISO(inv.period.start), 'yyyy-MM-dd')} to ${format(parseISO(inv.period.end), 'yyyy-MM-dd')}`,
    `${inv.amount} ${inv.currency}`,
    inv.status,
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const STATUS_BADGE: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-success/10 text-success border-success/20' },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  failed: { label: 'Failed', className: 'bg-danger/10 text-danger border-danger/20' },
  void: { label: 'Void', className: 'bg-surface-raised text-fg-disabled border-subtle' },
};

// ── Invoice row ───────────────────────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const badge = STATUS_BADGE[invoice.status];
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-subtle last:border-0 hover:bg-surface-raised/40 transition-colors">
      <div className="size-8 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
        <FileTextIcon className="size-4 text-brand" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg truncate">{invoice.description}</p>
        <p className="text-xs text-fg-muted">
          {invoice.number} · Due {format(parseISO(invoice.dueDate), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="text-sm text-fg-muted shrink-0">
        {format(parseISO(invoice.date), 'MMM d, yyyy')}
      </div>

      <div className="text-sm font-medium text-fg w-24 text-right shrink-0">
        {formatAmount(invoice.amount, invoice.currency)}
      </div>

      <div className="w-20 flex justify-center shrink-0">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="shrink-0">
        <a
          href={invoice.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-raised transition-colors"
        >
          <ExternalLinkIcon className="size-3.5" />
          PDF
        </a>
      </div>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function InvoiceRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-subtle last:border-0">
      <Skeleton className="size-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-4 w-24 shrink-0" />
      <Skeleton className="h-4 w-16 shrink-0" />
      <Skeleton className="h-5 w-14 rounded-full shrink-0" />
      <Skeleton className="h-7 w-16 rounded shrink-0" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BillingInvoicesPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useInvoices(page);

  return (
    <div className="space-y-4 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-fg">Invoices</h2>
          <p className="text-sm text-fg-muted mt-0.5">
            Download PDF invoices or export your billing history as CSV.
          </p>
        </div>
        {data && data.invoices.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCsv(data.invoices)}
            className="gap-1.5"
          >
            <DownloadIcon className="size-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-subtle bg-surface-raised/40">
          <div className="size-8 shrink-0" />
          <div className="flex-1 text-xs font-semibold text-fg-muted uppercase tracking-wider">
            Description
          </div>
          <div className="text-xs font-semibold text-fg-muted uppercase tracking-wider shrink-0 w-[7.5rem]">
            Date
          </div>
          <div className="text-xs font-semibold text-fg-muted uppercase tracking-wider w-24 text-right shrink-0">
            Amount
          </div>
          <div className="text-xs font-semibold text-fg-muted uppercase tracking-wider w-20 text-center shrink-0">
            Status
          </div>
          <div className="shrink-0 w-16" />
        </div>

        {isLoading && (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <InvoiceRowSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState message="Failed to load invoices." onRetry={refetch} />
          </div>
        )}

        {!isLoading && !isError && data && data.invoices.length === 0 && (
          <div className="p-8">
            <EmptyState
              title="No invoices yet"
              description="Invoices will appear here after your first billing cycle."
            />
          </div>
        )}

        {!isLoading && !isError && data && data.invoices.length > 0 && (
          <div>
            {data.invoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-fg-muted">
          <span>
            Showing {(page - 1) * data.pagination.limit + 1}–
            {Math.min(page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} invoices
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="px-2 text-fg">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
