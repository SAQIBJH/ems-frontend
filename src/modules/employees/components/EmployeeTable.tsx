'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useAuth } from '@/providers';

import { useEmployees } from '../hooks/useEmployees';
import { useDeleteEmployee } from '../hooks/useEmployeeMutations';
import { useDebounce } from '@/hooks/useDebounce';
import type { Employee, EmploymentStatus, EmploymentType } from '../types/employee.types';
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS } from '../constants';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import type { ApiError } from '@/types/api';

const PAGE_SIZE = 20;

/* ── Status badge ─────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: EmploymentStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge
        variant="outline"
        className="border-success/40 bg-success/10 text-success text-[11px] font-medium"
      >
        {EMPLOYMENT_STATUS_LABELS.ACTIVE}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-fg-disabled/40 bg-surface-2 text-fg-muted text-[11px] font-medium"
    >
      {EMPLOYMENT_STATUS_LABELS.TERMINATED}
    </Badge>
  );
}

/* ── Row actions ──────────────────────────────────────────────────────────── */

function RowActions({
  employee,
  onTerminate,
}: {
  employee: Employee;
  onTerminate: (emp: Employee) => void;
}) {
  const { permissions } = useAuth();
  const router = useRouter();
  const canEdit = permissions.includes('employees:write');
  const canTerminate = permissions.includes('employees:delete');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
        aria-label={`Actions for ${employee.firstName} ${employee.lastName}`}
      >
        <MoreHorizontalIcon className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
          View profile
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}/edit`)}>
            Edit
          </DropdownMenuItem>
        )}
        {canTerminate && employee.employmentStatus !== 'TERMINATED' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onClick={() => onTerminate(employee)}
            >
              Terminate
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function EmployeeTable() {
  const router = useRouter();

  const [departmentId, setDepartmentId] = useQueryState('dept', parseAsString.withDefault(''));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [terminateTarget, setTerminateTarget] = useState<Employee | null>(null);

  const { data: deptList } = useDepartments();
  const flatDepts = useMemo(() => flattenDepartmentTree(deptList ?? []), [deptList]);

  const { data, isLoading, isError, error, refetch } = useEmployees({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    status: (statusFilter as EmploymentStatus) || undefined,
  });

  const deleteMutation = useDeleteEmployee();

  const employees = data?.data ?? [];
  const pagination = data?.pagination;

  function handleDeptChange(val: string | null) {
    void setDepartmentId(!val || val === '_all' ? null : val);
    void setPage(1);
  }

  function handleStatusChange(val: string | null) {
    void setStatusFilter(!val || val === '_all' ? null : val);
    void setPage(1);
  }

  async function handleTerminate() {
    if (!terminateTarget) return;
    try {
      await deleteMutation.mutateAsync(terminateTarget.id);
      toast.success(
        `${terminateTarget.firstName} ${terminateTarget.lastName} has been terminated.`,
      );
      setTerminateTarget(null);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to terminate employee.');
    }
  }

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: 'employee',
        header: 'Employee',
        cell: ({ row }) => {
          const emp = row.original;
          const initials = `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href={`/employees/${emp.id}`}
                  className="block truncate text-sm font-medium text-fg hover:text-brand transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {emp.firstName} {emp.lastName}
                </Link>
                <p className="truncate text-xs text-fg-muted">
                  {emp.employeeCode} · {emp.workEmail}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'department',
        header: 'Department',
        cell: ({ row }) => (
          <span className="text-sm text-fg-muted">{row.original.department?.name ?? '—'}</span>
        ),
      },
      {
        id: 'designation',
        header: 'Designation',
        cell: ({ row }) => <span className="text-sm text-fg">{row.original.designation}</span>,
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-sm text-fg-muted">
            {EMPLOYMENT_TYPE_LABELS[row.original.employmentType as EmploymentType]}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.employmentStatus} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <RowActions employee={row.original} onTerminate={setTerminateTarget} />
          </div>
        ),
      },
    ],
    [setTerminateTarget],
  );

  const errorMessage = (() => {
    if (!isError) return '';
    const axiosErr = error as AxiosError<ApiError>;
    return axiosErr.response?.data?.error?.message ?? 'Failed to load employees.';
  })();

  const hasActiveFilters = !!(debouncedSearch || departmentId || statusFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search by name, code, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Search employees"
          />
        </div>

        <Select value={departmentId || '_all'} onValueChange={handleDeptChange}>
          <SelectTrigger className="w-[180px]" aria-label="Filter by department">
            <SelectValue placeholder="All departments">
              {(v) =>
                v === '_all' ? 'All departments' : (flatDepts.find((d) => d.id === v)?.name ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All departments</SelectItem>
            {flatDepts.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.depth > 0 ? `${'—'.repeat(dept.depth)} ` : ''}
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter || '_all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses">
              {(v) => (v === '_all' ? 'All statuses' : v === 'ACTIVE' ? 'Active' : 'Terminated')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DynamicTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={() => refetch()}
        emptyTitle="No employees found"
        emptyDescription={
          hasActiveFilters
            ? 'No employees match your current filters. Try adjusting your search.'
            : 'Add your first employee to get started.'
        }
        emptyAction={
          !hasActiveFilters ? (
            <PermissionWrapper permission="employees:write">
              <Link href="/employees/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}>
                <PlusIcon className="size-4 shrink-0" aria-hidden />
                Add employee
              </Link>
            </PermissionWrapper>
          ) : undefined
        }
        onRowClick={(emp) => router.push(`/employees/${emp.id}`)}
        pagination={
          pagination
            ? { page, pages: pagination.pages, total: pagination.total, pageSize: PAGE_SIZE }
            : undefined
        }
        onPageChange={(p) => void setPage(p)}
        rowLabel="employees"
      />

      <ConfirmDialog
        open={!!terminateTarget}
        onOpenChange={(open) => {
          if (!open) setTerminateTarget(null);
        }}
        title="Terminate employee?"
        description={
          terminateTarget
            ? `${terminateTarget.firstName} ${terminateTarget.lastName}'s employment will be marked as terminated. This can be reversed by an administrator.`
            : ''
        }
        confirmLabel="Terminate"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleTerminate}
      />
    </div>
  );
}
