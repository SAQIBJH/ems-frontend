'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import {
  ColumnsIcon,
  DownloadIcon,
  LayoutIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  UserXIcon,
  XIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { NoDataIllustration } from '@/components/feedback/illustrations';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useAuth } from '@/providers';

import { useEmployees } from '../hooks/useEmployees';
import { useDeleteEmployee, useBulkDeactivate, useBulkExport } from '../hooks/useEmployeeMutations';
import { useDebounce } from '@/hooks/useDebounce';
import { employeesApi } from '../services/employees.api';
import type {
  BulkDeactivateResult,
  Employee,
  EmploymentStatus,
  EmploymentType,
} from '../types/employee.types';
import { resolveDepartmentRef } from '../utils/employee-department';
import { EMPLOYMENT_TYPE_LABELS } from '../constants';
import { StatusBadge } from './StatusBadge';
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

/* ── Selection ────────────────────────────────────────────────────────────── */

interface SelectionMeta {
  firstName: string;
  lastName: string;
  employeeCode: string;
}

type SelectionMap = Record<string, SelectionMeta>;

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

/* ── Bulk action bar ──────────────────────────────────────────────────────── */

function BulkActionBar({
  selection,
  onClear,
  onDeactivate,
  onExport,
  canDeactivate,
}: {
  selection: SelectionMap;
  onClear: () => void;
  onDeactivate: () => void;
  onExport: () => void;
  canDeactivate: boolean;
}) {
  const count = Object.keys(selection).length;
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2">
      <span className="text-sm font-medium text-fg">
        {count} {count === 1 ? 'employee' : 'employees'} selected
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-7 gap-1 px-2 text-xs text-fg-muted hover:text-fg"
        aria-label="Clear selection"
      >
        <XIcon className="size-3" aria-hidden />
        Clear
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExport}>
          <DownloadIcon className="size-3.5" aria-hidden />
          Bulk export
        </Button>
        {canDeactivate && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-danger/30 text-xs text-danger hover:border-danger/50 hover:bg-danger/5"
            onClick={onDeactivate}
          >
            <UserXIcon className="size-3.5" aria-hidden />
            Bulk deactivate
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Bulk deactivate confirm dialog ───────────────────────────────────────── */

function BulkDeactivateDialog({
  open,
  onOpenChange,
  selection,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selection: SelectionMap;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const entries = Object.entries(selection);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Deactivate {entries.length} {entries.length === 1 ? 'employee' : 'employees'}?
          </DialogTitle>
          <DialogDescription>
            The following employees will be marked as inactive. This can be reversed by an
            administrator.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-52 overflow-y-auto rounded-md border border-border bg-surface-2 p-3">
          <ul className="space-y-1.5">
            {entries.map(([id, meta]) => (
              <li key={id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-fg-muted">{meta.employeeCode}</span>
                <span className="text-fg">
                  {meta.firstName} {meta.lastName}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Bulk deactivate result dialog ────────────────────────────────────────── */

function BulkDeactivateResultDialog({
  result,
  snapshot,
  onClose,
}: {
  result: BulkDeactivateResult;
  snapshot: SelectionMap;
  onClose: () => void;
}) {
  const total = result.succeeded.length + result.failed.length;

  function resolveName(id: string): string {
    const meta = snapshot[id];
    return meta ? `${meta.firstName} ${meta.lastName}` : id;
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivation complete</DialogTitle>
          <DialogDescription>
            {result.succeeded.length} of {total} {total === 1 ? 'employee was' : 'employees were'}{' '}
            deactivated successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {result.succeeded.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-success">
                Succeeded ({result.succeeded.length})
              </p>
              <ul className="space-y-1 rounded-md border border-success/20 bg-success/5 p-3">
                {result.succeeded.map((id) => (
                  <li key={id} className="text-sm text-fg">
                    {resolveName(id)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.failed.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-danger">
                Failed ({result.failed.length})
              </p>
              <ul className="space-y-1.5 rounded-md border border-danger/20 bg-danger/5 p-3">
                {result.failed.map((f) => (
                  <li key={f.id} className="text-sm">
                    <span className="font-medium text-fg">{resolveName(f.id)}</span>
                    <span className="ml-2 text-xs text-fg-muted">— {f.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function EmployeeTable() {
  const router = useRouter();
  const { user, permissions } = useAuth();
  const canExport = permissions.includes('employees:read');
  const canBulkDeactivate = permissions.includes('employees:delete');

  const storageKeyVis = `employees-columns-${user?.id ?? 'default'}`;
  const storageKeyDensity = `employees-density-${user?.id ?? 'default'}`;

  const [departmentId, setDepartmentId] = useQueryState('dept', parseAsString.withDefault(''));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [terminateTarget, setTerminateTarget] = useState<Employee | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  /* ── Selection state ────────────────────────────────────────────────────── */
  const [selection, setSelection] = useState<SelectionMap>({});
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [bulkDeactivateResult, setBulkDeactivateResult] = useState<{
    result: BulkDeactivateResult;
    snapshot: SelectionMap;
  } | null>(null);

  const bulkDeactivateMutation = useBulkDeactivate();
  const bulkExportMutation = useBulkExport();

  const toggleRow = useCallback((employee: Employee, checked: boolean) => {
    if (checked) {
      setSelection((prev) => ({
        ...prev,
        [employee.id]: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeCode: employee.employeeCode,
        },
      }));
    } else {
      setSelection((prev) => {
        const next = { ...prev };
        delete next[employee.id];
        return next;
      });
    }
  }, []);

  /* ── Column visibility + density ──────────────────────────────────────── */

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

  async function handleBulkDeactivate() {
    const snapshot = { ...selection };
    const ids = Object.keys(snapshot);
    try {
      const result = await bulkDeactivateMutation.mutateAsync(ids);
      setBulkDeactivateOpen(false);
      setSelection({});
      setBulkDeactivateResult({ result, snapshot });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Bulk deactivation failed.');
    }
  }

  async function handleBulkExport() {
    const ids = Object.keys(selection);
    try {
      await bulkExportMutation.mutateAsync(ids);
      setBulkExportOpen(false);
      toast.success('Export queued. Your CSV will be ready shortly.');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Export failed. Please try again.');
    }
  }

  /* ── Data ────────────────────────────────────────────────────────────── */

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

  const employees = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  function handleDeptChange(val: string | null) {
    void setDepartmentId(!val || val === '_all' ? null : val);
    void setPage(1);
    setSelection({});
  }

  function handleStatusChange(val: string | null) {
    void setStatusFilter(!val || val === '_all' ? null : val);
    void setPage(1);
    setSelection({});
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

  /* ── Columns ─────────────────────────────────────────────────────────── */

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
                <p className="truncate text-xs text-fg-muted">{emp.designation}</p>
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
          <span className="text-sm text-fg-muted">
            {resolveDepartmentRef(row.original.department)?.name ?? '—'}
          </span>
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

  // Prepend a non-toggleable checkbox select column
  const columns = useMemo<ColumnDef<Employee>[]>(() => {
    const pageIds = employees.map((e) => e.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => id in selection);

    const selectCol: ColumnDef<Employee> = {
      id: 'select',
      header: () => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={allPageSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelection((prev) => {
                  const next = { ...prev };
                  employees.forEach((e) => {
                    next[e.id] = {
                      firstName: e.firstName,
                      lastName: e.lastName,
                      employeeCode: e.employeeCode,
                    };
                  });
                  return next;
                });
              } else {
                setSelection((prev) => {
                  const next = { ...prev };
                  employees.forEach((e) => delete next[e.id]);
                  return next;
                });
              }
            }}
            aria-label="Select all on this page"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.original.id in selection}
            onCheckedChange={(checked) => toggleRow(row.original, Boolean(checked))}
            aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
          />
        </div>
      ),
    };

    return [
      selectCol,
      ...allColumns.filter((col) => columnVisibility[col.id as ColumnId] !== false),
    ];
  }, [employees, selection, toggleRow, allColumns, columnVisibility]);

  const errorMessage = (() => {
    if (!isError) return '';
    const axiosErr = error as AxiosError<ApiError>;
    return axiosErr.response?.data?.error?.message ?? 'Failed to load employees.';
  })();

  const hasActiveFilters = !!(searchInput || departmentId || statusFilter);
  const selectedCount = Object.keys(selection).length;

  function clearFilters() {
    setSearchInput('');
    void setDepartmentId(null);
    void setStatusFilter(null);
    void setPage(1);
    setSelection({});
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search by name, code, email…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSelection({});
            }}
            className="pl-9 bg-surface-2 border-default-border"
            aria-label="Search employees"
          />
        </div>

        {/* Department filter */}
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

        {/* Status filter */}
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

          {/* CSV export — HR / admin only */}
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

      {/* Bulk action bar — visible when ≥ 1 row selected */}
      {selectedCount > 0 && (
        <BulkActionBar
          selection={selection}
          onClear={() => setSelection({})}
          onDeactivate={() => setBulkDeactivateOpen(true)}
          onExport={() => setBulkExportOpen(true)}
          canDeactivate={canBulkDeactivate}
        />
      )}

      {/* Table with density wrapper */}
      <div className={DENSITY_CLASS[density]}>
        <DynamicTable
          columns={columns}
          data={employees}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          onRetry={() => refetch()}
          emptyIllustration={<NoDataIllustration />}
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

      {/* Single-row terminate dialog */}
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

      {/* Bulk deactivate confirm */}
      <BulkDeactivateDialog
        open={bulkDeactivateOpen}
        onOpenChange={setBulkDeactivateOpen}
        selection={selection}
        onConfirm={handleBulkDeactivate}
        isPending={bulkDeactivateMutation.isPending}
      />

      {/* Bulk export confirm */}
      <ConfirmDialog
        open={bulkExportOpen}
        onOpenChange={setBulkExportOpen}
        title={`Export ${selectedCount} ${selectedCount === 1 ? 'employee' : 'employees'}?`}
        description={`A CSV export of the selected ${selectedCount === 1 ? 'employee' : `${selectedCount} employees`} will be queued and ready to download shortly.`}
        confirmLabel="Export"
        loading={bulkExportMutation.isPending}
        onConfirm={handleBulkExport}
      />

      {/* Bulk deactivate result */}
      {bulkDeactivateResult && (
        <BulkDeactivateResultDialog
          result={bulkDeactivateResult.result}
          snapshot={bulkDeactivateResult.snapshot}
          onClose={() => setBulkDeactivateResult(null)}
        />
      )}
    </div>
  );
}
