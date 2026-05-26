'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useDepartmentEmployees } from '../hooks/useDepartments';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-success/10 text-success' },
  INACTIVE: { label: 'Inactive', className: 'bg-surface-2 text-fg-muted' },
  TERMINATED: { label: 'Terminated', className: 'bg-danger/10 text-danger' },
  ON_LEAVE: { label: 'On Leave', className: 'bg-warning/10 text-warning' },
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md px-2 py-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DepartmentEmployeesTable({ deptId }: { deptId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useDepartmentEmployees(deptId, {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });

  const employees = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">Employees</p>
        <div className="relative w-48">
          <SearchIcon
            className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search employees…"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState compact message="Failed to load employees" onRetry={() => refetch()} />
      ) : employees.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No results' : 'No employees'}
          description={
            debouncedSearch
              ? `No employees match "${debouncedSearch}".`
              : 'This department has no active employees.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-2">
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                    Name
                  </th>
                  <th className="hidden px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted sm:table-cell">
                    Designation
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {employees.map((emp) => {
                  const status = STATUS_STYLE[emp.employmentStatus] ?? {
                    label: emp.employmentStatus,
                    className: 'bg-surface-2 text-fg-muted',
                  };
                  return (
                    <tr key={emp.id} className="hover:bg-surface-2/50">
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs text-fg-muted">{emp.employeeCode}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="font-medium text-fg hover:text-brand hover:underline"
                        >
                          {emp.firstName} {emp.lastName}
                        </Link>
                      </td>
                      <td className="hidden px-3 py-2.5 text-fg-muted sm:table-cell">
                        {emp.designation}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between text-xs text-fg-muted">
              <span>
                {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
