'use client';

import { useState } from 'react';
import {
  ChevronRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  Building2Icon,
  FolderPlusIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { cn } from '@/lib/utils';
import type { ApiError } from '@/types/api';

import { useDepartments } from '../hooks/useDepartments';
import {
  useDeleteDepartment,
  useReassignAndDeleteDepartment,
} from '../hooks/useDepartmentMutations';
import type { Department } from '../types/department.types';
import { findDepartmentById, flattenDepartmentTree } from '../utils/department.utils';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentEmployeesTable } from './DepartmentEmployeesTable';

/* ── Tree item ───────────────────────────────────────────────────────────── */

function DepartmentTreeItem({
  dept,
  depth = 0,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  onEdit,
  onAddChild,
  onDelete,
}: {
  dept: Department;
  depth?: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onEdit: (dept: Department) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (dept: Department) => void;
}) {
  const hasChildren = dept.children.length > 0;
  const isExpanded = expandedIds.has(dept.id);
  const isSelected = selectedId === dept.id;

  return (
    <li>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={cn(
          'group flex cursor-pointer items-center gap-1.5 rounded-md py-1.5 pr-1 text-sm transition-colors',
          isSelected ? 'bg-brand/10 text-brand font-medium' : 'text-fg hover:bg-surface-2',
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={() => onSelect(dept.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(dept.id);
          }
        }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded text-fg-muted transition-transform',
            !hasChildren && 'pointer-events-none text-transparent',
            isExpanded && 'rotate-90',
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(dept.id);
          }}
        >
          <ChevronRightIcon className="size-3.5" />
        </button>

        <Building2Icon className="size-4 shrink-0 text-fg-muted" aria-hidden />

        <span className="flex-1 truncate">{dept.name}</span>

        <Badge
          variant="outline"
          className="ml-1 shrink-0 font-mono text-[10px] font-normal text-fg-muted"
        >
          {dept._count.employees}
        </Badge>

        {/* Row actions — visible on hover/focus */}
        <div
          className="shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <PermissionWrapper permission="departments:write">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-6')}
                aria-label={`Actions for ${dept.name}`}
              >
                <MoreHorizontalIcon className="size-3.5" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(dept)}>
                  <PencilIcon className="mr-2 size-3.5" aria-hidden />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(dept.id)}>
                  <FolderPlusIcon className="mr-2 size-3.5" aria-hidden />
                  Add sub-department
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onClick={() => onDelete(dept)}
                >
                  <Trash2Icon className="mr-2 size-3.5" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionWrapper>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul role="group">
          {dept.children.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              dept={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Loading skeleton ────────────────────────────────────────────────────── */

function TreeSkeleton() {
  return (
    <div className="space-y-1 p-2" aria-busy aria-label="Loading departments">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded-md bg-surface-2"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

/* ── Detail panel ────────────────────────────────────────────────────────── */

function DepartmentDetailPanel({
  dept,
  onEdit,
  onAddChild,
  onDelete,
}: {
  dept: Department;
  onEdit: (dept: Department) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (dept: Department) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-fg">{dept.name}</h2>
            <Badge variant="outline" className="font-mono text-xs">
              {dept.departmentCode}
            </Badge>
          </div>
          {dept.depth > 0 && (
            <p className="mt-1 text-sm text-fg-muted">Level {dept.depth} sub-department</p>
          )}
        </div>

        <PermissionWrapper permission="departments:write">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onAddChild(dept.id)}>
              <FolderPlusIcon className="mr-1.5 size-3.5" aria-hidden />
              Add sub-dept
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(dept)}>
              <PencilIcon className="mr-1.5 size-3.5" aria-hidden />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => onDelete(dept)}
            >
              <Trash2Icon className="mr-1.5 size-3.5" aria-hidden />
              Delete
            </Button>
          </div>
        </PermissionWrapper>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-subtle bg-surface-2 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">Employees</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">
            {dept._count.employees}
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-surface-2 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
            Sub-departments
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{dept.children.length}</p>
        </div>
        {dept.depth > 0 && (
          <div className="rounded-lg border border-subtle bg-surface-2 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">Depth</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{dept.depth}</p>
          </div>
        )}
      </div>

      {/* Department head */}
      {dept.headEmployee && (
        <div className="rounded-lg border border-subtle bg-surface p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
            Department head
          </p>
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand">
              {dept.headEmployee.firstName[0]}
              {dept.headEmployee.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-fg">
                {dept.headEmployee.firstName} {dept.headEmployee.lastName}
              </p>
              <p className="text-xs text-fg-muted">{dept.headEmployee.designation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-departments list */}
      {dept.children.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
            Sub-departments
          </p>
          <ul className="space-y-2">
            {dept.children.map((child) => (
              <li
                key={child.id}
                className="flex items-center justify-between rounded-lg border border-subtle bg-surface p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Building2Icon className="size-4 shrink-0 text-fg-muted" aria-hidden />
                  <span className="font-medium text-fg">{child.name}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {child.departmentCode}
                  </Badge>
                </div>
                <span className="flex items-center gap-1 text-xs text-fg-muted">
                  <UsersIcon className="size-3" aria-hidden />
                  {child._count.employees}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Employee list */}
      <DepartmentEmployeesTable deptId={dept.id} />
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */

export function DepartmentTree() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formParentId, setFormParentId] = useState<string | undefined>(undefined);
  const [formInitialDept, setFormInitialDept] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Department | null>(null);
  const [reassignToDeptId, setReassignToDeptId] = useState('');

  const { data: departments = [], isLoading, isError, error, refetch } = useDepartments();
  const deleteMutation = useDeleteDepartment();
  const reassignMutation = useReassignAndDeleteDepartment();

  const selectedDept = findDepartmentById(departments, selectedId);

  // All departments flattened for use in the reassign target picker
  const flatDepts = flattenDepartmentTree(departments);

  function openCreateForm(parentId?: string) {
    setFormMode('create');
    setFormParentId(parentId);
    setFormInitialDept(null);
    setFormOpen(true);
  }

  function openEditForm(dept: Department) {
    setFormMode('edit');
    setFormParentId(undefined);
    setFormInitialDept(dept);
    setFormOpen(true);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDeleteRequest(dept: Department) {
    if (dept._count.employees > 0) {
      // Has employees — must reassign before deleting
      setReassignToDeptId('');
      setReassignTarget(dept);
    } else {
      setDeleteTarget(dept);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" has been deleted.`);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const apiError = axiosErr.response?.data?.error;
      if (apiError?.code === 'DEPARTMENT_NOT_EMPTY') {
        // Sub-departments exist even though employees = 0 — inform user
        toast.error('Cannot delete: department still has sub-departments. Delete them first.');
      } else {
        toast.error(apiError?.message ?? 'Failed to delete department.');
      }
      setDeleteTarget(null);
    }
  }

  async function handleReassignAndDelete() {
    if (!reassignTarget || !reassignToDeptId) return;
    try {
      const result = await reassignMutation.mutateAsync({
        id: reassignTarget.id,
        reassignEmployeesTo: reassignToDeptId,
      });
      toast.success(
        `"${reassignTarget.name}" deleted. ${result.reassignedEmployees} employee(s) reassigned.`,
      );
      if (selectedId === reassignTarget.id) setSelectedId(null);
      setReassignTarget(null);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const apiError = axiosErr.response?.data?.error;
      toast.error(apiError?.message ?? 'Failed to reassign and delete.');
    }
  }

  const errorMessage = (() => {
    if (!isError) return '';
    const axiosErr = error as AxiosError<ApiError>;
    return axiosErr.response?.data?.error?.message ?? 'Failed to load departments.';
  })();

  return (
    <>
      <PageHeader
        title="Departments"
        description="Manage your organization's department structure."
        breadcrumbs={[{ label: 'Departments' }]}
        actions={
          <PermissionWrapper permission="departments:write">
            <Button size="default" onClick={() => openCreateForm()}>
              <PlusIcon className="mr-1.5 size-4 shrink-0" aria-hidden />
              New department
            </Button>
          </PermissionWrapper>
        }
      />

      <div className="px-6 pb-6">
        <div className="flex min-h-[60vh] gap-0 overflow-hidden rounded-lg border border-subtle">
          {/* Left: Tree panel */}
          <div className="flex w-72 shrink-0 flex-col border-r border-subtle bg-surface">
            <div className="shrink-0 border-b border-subtle px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                All departments
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <TreeSkeleton />
              ) : isError ? (
                <div className="p-2">
                  <ErrorState message={errorMessage} onRetry={() => refetch()} />
                </div>
              ) : departments.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4">
                  <EmptyState
                    title="No departments yet"
                    description="Create your first department to get started."
                    action={
                      <PermissionWrapper permission="departments:write">
                        <Button size="default" variant="outline" onClick={() => openCreateForm()}>
                          <PlusIcon className="mr-1.5 size-4" aria-hidden />
                          New department
                        </Button>
                      </PermissionWrapper>
                    }
                  />
                </div>
              ) : (
                <ul role="tree" aria-label="Department tree">
                  {departments.map((dept) => (
                    <DepartmentTreeItem
                      key={dept.id}
                      dept={dept}
                      selectedId={selectedId}
                      expandedIds={expandedIds}
                      onSelect={setSelectedId}
                      onToggleExpand={toggleExpand}
                      onEdit={openEditForm}
                      onAddChild={openCreateForm}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          <div className="flex flex-1 flex-col overflow-y-auto bg-canvas">
            {!selectedDept ? (
              <div className="flex h-full min-h-[40vh] items-center justify-center p-8">
                <EmptyState
                  title="Select a department"
                  description="Click any department in the list to view its details."
                />
              </div>
            ) : (
              <div className="p-6">
                <DepartmentDetailPanel
                  dept={selectedDept}
                  onEdit={openEditForm}
                  onAddChild={openCreateForm}
                  onDelete={handleDeleteRequest}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <DepartmentForm
        mode={formMode}
        open={formOpen}
        onOpenChange={setFormOpen}
        initialDept={formInitialDept}
        parentId={formParentId}
        departments={departments}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete department?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently deleted. This will fail if the department still has sub-departments.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {/* Reassign-and-delete dialog — shown when dept has active employees */}
      <Dialog
        open={!!reassignTarget}
        onOpenChange={(open) => {
          if (!open) setReassignTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign employees &amp; delete?</DialogTitle>
            <DialogDescription>
              <strong>{reassignTarget?.name}</strong> has{' '}
              <strong>{reassignTarget?._count.employees}</strong> active employee(s). Select a
              department to move them to before deleting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-fg" htmlFor="reassign-target-select">
              Move employees to
            </label>
            <Select value={reassignToDeptId} onValueChange={(v) => setReassignToDeptId(v ?? '')}>
              <SelectTrigger id="reassign-target-select">
                <SelectValue placeholder="Select department…">
                  {(v) => flatDepts.find((d) => d.id === v)?.name ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {flatDepts
                  .filter((d) => d.id !== reassignTarget?.id)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassignTarget(null)}
              disabled={reassignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reassignToDeptId || reassignMutation.isPending}
              onClick={handleReassignAndDelete}
            >
              {reassignMutation.isPending ? 'Processing…' : 'Reassign & delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
