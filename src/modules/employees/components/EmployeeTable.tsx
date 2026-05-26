'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import {
  ColumnsIcon,
  DownloadIcon,
  LayoutIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button, buttonVariants } from '@/components/ui/button';
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
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { employeesApi } from '../services/employees.api';
import type { Employee, EmploymentStatus, EmploymentType } from '../types/employee.types';
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS } from '../constants';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import type { ApiError } from '@/types/api';

const PAGE_SIZE = 20;

/* ── Column IDs (used for visibility keying) ──────────────────────────────── */

const ALL_COLUMN_IDS = [
  'employee',
  'code',
  'department',
  'designation',
  'type',
  'joinedOn',
  'status',
  'actions',
] as const;

type ColumnId = (typeof ALL_COLUMN_IDS)[number];
type ColumnVisibility = Record<ColumnId, boolean>;

const COLUMN_LABELS: Record<ColumnId, string> = {
  employee: 'Employee',
  code: 'Code',
  department: 'Department',
  designation: 'Designation',
  type: 'Type',
  joinedOn: 'Joined',
  status: 'Status',
  actions: 'Actions',
};

const DEFAULT_VISIBILITY: ColumnVisibility = {
  employee: true,
  code: true,
  department: true,
  designation: true,
  type: true,
  joinedOn: true,
  status: true,
  actions: true,
};

/* ── Density ──────────────────────────────────────────────────────────────── */

type Density = 'comfortable' | 'compact' | 'cozy';

const DENSITY_LABELS: Record<Density, string> = {
  comfortable: 'Comfortable',
  compact: 'Compact',
  cozy: 'Cozy',
};

const DENSITY_CLASS: Record<Density, string> = {
  comfortable: '[&_td]:py-2',
  compact: '[&_td]:py-1',
  cozy: '[&_td]:py-3',
};

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
  const { user, permissions } = useAuth();
  const canExport = permissions.includes('employees:read');

  // Storage keys keyed by user so different users on the same browser retain separate prefs.
  const storageKeyVis = `employees-columns-${user?.id ?? 'default'}`;
  const storageKeyDensity = `employees-density-${user?.id ?? 'default'}`;

  const [departmentId, setDepartmentId] = useQueryState('dept', parseAsString.withDefault(''));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [terminateTarget, setTerminateTarget] = useState<Employee | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Column visibility — lazy-initialised from localStorage; writes happen in effects below.
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBILITY;
    try {
      const raw = localStorage.getItem(storageKeyVis);
      if (raw) return { ...DEFAULT_VISIBILITY, ...(JSON.parse(raw) as Partial<ColumnVisibility>) };
    } catch {
      /* ignore */
    }
    return DEFAULT_VISIBILITY;
  });
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    try {
      const d = localStorage.getItem(storageKeyDensity) as Density | null;
      if (d && d in DENSITY_LABELS) return d;
    } catch {
      /* ignore */
    }
    return 'comfortable';
  });

  // Persist changes to localStorage (write-only effects — no cascading renders)
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyVis, JSON.stringify(columnVisibility));
    } catch {
      /* ignore */
    }
  }, [columnVisibility, storageKeyVis]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyDensity, density);
    } catch {
      /* ignore */
    }
  }, [density, storageKeyDensity]);

  function toggleColumn(id: ColumnId, visible: boolean) {
    setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
  }

  function changeDensity(d: Density) {
    setDensity(d);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await employeesApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

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

  const allColumns = useMemo<ColumnDef<Employee>[]>(
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
                <p className="truncate text-xs text-fg-muted">{emp.workEmail}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-fg-muted">{row.original.employeeCode}</span>
        ),
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
        id: 'joinedOn',
        header: 'Joined',
        cell: ({ row }) => {
          try {
            return (
              <span className="text-sm text-fg-muted">
                {format(parseISO(row.original.joinedOn), 'dd MMM yyyy')}
              </span>
            );
          } catch {
            return <span className="text-sm text-fg-muted">—</span>;
          }
        },
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
    [],
  );

  // Filter by visibility
  const columns = useMemo(
    () => allColumns.filter((col) => columnVisibility[col.id as ColumnId] !== false),
    [allColumns, columnVisibility],
  );

  const errorMessage = (() => {
    if (!isError) return '';
    const axiosErr = error as AxiosError<ApiError>;
    return axiosErr.response?.data?.error?.message ?? 'Failed to load employees.';
  })();

  const hasActiveFilters = !!(searchInput || departmentId || statusFilter);

  function clearFilters() {
    setSearchInput('');
    void setDepartmentId(null);
    void setStatusFilter(null);
    void setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search — no label, spans remaining width */}
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

        {/* Department filter with label */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Department</span>
          <Select value={departmentId || '_all'} onValueChange={handleDeptChange}>
            <SelectTrigger className="w-[180px] cursor-pointer" aria-label="Filter by department">
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
        </div>

        {/* Status filter with label */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Status</span>
          <Select value={statusFilter || '_all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] cursor-pointer" aria-label="Filter by status">
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

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 gap-1.5 text-xs text-fg-muted hover:text-fg"
          >
            <XIcon className="size-3.5" aria-hidden />
            Clear
          </Button>
        )}

        {/* Right-side toolbar */}
        <div className="ml-auto flex items-center gap-2">
          {/* Density menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-9 gap-1.5 text-xs',
              )}
            >
              <LayoutIcon className="size-3.5" aria-hidden />
              {DENSITY_LABELS[density]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs">Row density</DropdownMenuLabel>
                {(Object.keys(DENSITY_LABELS) as Density[]).map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => changeDensity(d)}
                    className={cn(density === d && 'font-medium text-brand')}
                  >
                    {DENSITY_LABELS[d]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-9 gap-1.5 text-xs',
              )}
            >
              <ColumnsIcon className="size-3.5" aria-hidden />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
                {ALL_COLUMN_IDS.filter((id) => id !== 'actions').map((id) => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={columnVisibility[id]}
                    onCheckedChange={(checked) => toggleColumn(id, checked)}
                  >
                    {COLUMN_LABELS[id]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export — HR / admin only */}
          {canExport && (
            <PermissionWrapper permission="employees:read">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={handleExport}
                disabled={isExporting}
              >
                <DownloadIcon className="size-3.5" aria-hidden />
                {isExporting ? 'Exporting…' : 'Export'}
              </Button>
            </PermissionWrapper>
          )}
        </div>
      </div>

      {/* Table with density wrapper */}
      <div className={DENSITY_CLASS[density]}>
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
      </div>

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
