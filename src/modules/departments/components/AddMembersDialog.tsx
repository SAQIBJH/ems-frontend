'use client';

import { useMemo, useState } from 'react';
import { SearchIcon, PlusIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { NoTeamIllustration } from '@/components/feedback/illustrations';
import { cn } from '@/lib/utils';
import type { ApiError } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useEmployees, type Employee } from '@/modules/employees';

import { useAddDepartmentMembers } from '../hooks/useDepartmentMutations';
import type { Department } from '../types/department.types';

/** Minimal employee shape kept for selected chips — survives across searches. */
interface SelectedEmployee {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Page size for the server-side employee search. Small enough to never render a
 * huge directory; the visible list is capped to ~5 rows with scroll, and anyone
 * beyond the page is reached by typing (search-driven).
 */
const SEARCH_LIMIT = 20;

/** Deepest (leaf) department id from an employee's department path. */
function currentDeptLeafId(emp: Employee): string | null {
  return emp.departmentId.length > 0 ? emp.departmentId[emp.departmentId.length - 1] : null;
}

/** Human-readable current department name for context. */
function currentDeptName(emp: Employee): string | null {
  if (Array.isArray(emp.department)) {
    return emp.department.at(-1)?.name ?? null;
  }
  return emp.department?.name ?? null;
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

function ListSkeleton() {
  return (
    <div className="space-y-1.5 p-2" aria-busy aria-label="Loading employees">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md px-2 py-2">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function AddMembersDialog({
  open,
  onOpenChange,
  dept,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dept: Department;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Map<string, SelectedEmployee>>(new Map());
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useEmployees({
    search: debouncedSearch || undefined,
    status: 'ACTIVE',
    limit: SEARCH_LIMIT,
  });

  const addMembers = useAddDepartmentMembers();

  // Suggestions = fetched page minus (a) already-members of this dept and
  // (b) employees already picked into chips.
  const suggestions = useMemo(
    () =>
      (data?.data ?? []).filter(
        (emp) => currentDeptLeafId(emp) !== dept.id && !selected.has(emp.id),
      ),
    [data, dept.id, selected],
  );

  const selectedList = [...selected.values()];

  function reset() {
    setSearch('');
    setSelected(new Map());
  }

  function addEmployee(emp: Employee) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(emp.id, { id: emp.id, firstName: emp.firstName, lastName: emp.lastName });
      return next;
    });
  }

  function removeEmployee(id: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    try {
      const result = await addMembers.mutateAsync({
        id: dept.id,
        employeeIds: [...selected.keys()],
      });
      const addedLabel = `${result.added} member${result.added === 1 ? '' : 's'}`;
      toast.success(
        result.skipped > 0
          ? `${addedLabel} added to ${dept.name}. ${result.skipped} already a member.`
          : `${addedLabel} added to ${dept.name}.`,
      );
      handleOpenChange(false);
    } catch (err) {
      const apiError = (err as AxiosError<ApiError>).response?.data?.error;
      toast.error(apiError?.message ?? 'Failed to add members.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add members to {dept.name}</DialogTitle>
          <DialogDescription>
            Search and select existing employees to assign to this{' '}
            {dept.parentId ? 'sub-department' : 'department'}.
          </DialogDescription>
        </DialogHeader>

        {/* Selected chips */}
        {selectedList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 rounded-md border border-subtle bg-surface-2/50 p-2">
            {selectedList.map((emp) => (
              <span
                key={emp.id}
                className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface py-1 pl-2.5 pr-1 text-xs font-medium text-fg"
              >
                {emp.firstName} {emp.lastName}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-4 rounded-full text-fg-muted hover:text-danger"
                  onClick={() => removeEmployee(emp.id)}
                  aria-label={`Remove ${emp.firstName} ${emp.lastName}`}
                >
                  <XIcon className="size-3" aria-hidden />
                </Button>
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <SearchIcon
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="pl-8"
            autoFocus
          />
        </div>

        {/* Suggestions — visible ~5 rows, scroll for the rest of the page */}
        <div className="max-h-[260px] min-h-32 overflow-y-auto rounded-md border border-subtle">
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <div className="p-4">
              <ErrorState compact message="Failed to load employees" onRetry={() => refetch()} />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center p-4">
              <EmptyState
                illustration={<NoTeamIllustration />}
                title={debouncedSearch ? 'No results' : 'No employees to add'}
                description={
                  debouncedSearch
                    ? `No employees match "${debouncedSearch}".`
                    : 'Everyone available is already a member or selected.'
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-subtle">
              {suggestions.map((emp) => {
                const deptName = currentDeptName(emp);
                return (
                  <li key={emp.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => addEmployee(emp)}
                      className={cn(
                        'h-auto w-full justify-start gap-3 rounded-none px-3 py-2.5 text-left',
                        'hover:bg-surface-2',
                      )}
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{initials(emp.firstName, emp.lastName)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">
                          <span className="font-mono">{emp.employeeCode}</span>
                          {emp.designation ? ` · ${emp.designation}` : ''}
                        </span>
                      </span>
                      {deptName && (
                        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
                          {deptName}
                        </span>
                      )}
                      <PlusIcon className="size-4 shrink-0 text-fg-muted" aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={addMembers.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selected.size === 0 || addMembers.isPending}>
            {addMembers.isPending
              ? 'Adding…'
              : `Add ${selected.size > 0 ? selected.size : ''} member${selected.size === 1 ? '' : 's'}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
