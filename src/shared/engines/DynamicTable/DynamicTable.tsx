'use client';

import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

import type { DynamicTableProps } from './types';

export function DynamicTable<TData>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load data.',
  onRetry,
  emptyTitle = 'No results',
  emptyDescription = 'Nothing to show here yet.',
  emptyAction,
  emptyIllustration,
  onRowClick,
  pagination,
  onPageChange,
  rowLabel = 'rows',
  loadingRows = 8,
  loadingCols,
  className,
}: DynamicTableProps<TData>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.pages ?? -1,
    state: {
      pagination: {
        pageIndex: (pagination?.page ?? 1) - 1,
        pageSize: pagination?.pageSize ?? 20,
      },
    },
  });

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-subtle bg-surface', className)}>
        <SkeletonTable rows={loadingRows} cols={loadingCols ?? columns.length} className="p-4" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        illustration={emptyIllustration}
      />
    );
  }

  const { page = 1, pages = 1, total = 0, pageSize = 20 } = pagination ?? {};
  const showPagination = !!pagination && pages > 1;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-subtle', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-surface-2 hover:bg-surface-2">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-[11px] font-medium uppercase tracking-wide text-fg-muted"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="bg-surface">
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(onRowClick && 'cursor-pointer hover:bg-surface-2')}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex items-center justify-between border-t border-subtle bg-surface px-5 py-3">
          <span className="text-sm text-fg-muted">
            Showing{' '}
            <span className="font-medium text-fg">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
            </span>{' '}
            of <span className="font-medium text-fg">{total}</span> {rowLabel}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-3.5" aria-hidden />
              Prev
            </Button>
            <span className="min-w-[80px] text-center text-sm font-medium text-fg-muted tabular-nums">
              Page {page} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= pages}
              aria-label="Next page"
            >
              Next
              <ChevronRightIcon className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
