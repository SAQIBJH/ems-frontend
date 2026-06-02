'use client';

import { useMemo, useState } from 'react';
import {
  ChevronRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  FolderPlusIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button, buttonVariants } from '@/components/ui/button';
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

/* ── Dept color palette ─────────────────────────────────────────────────── */

const DEPT_COLORS = [
  'var(--dept-engineering)',
  'var(--dept-operations)',
  'var(--dept-sales)',
  'var(--dept-product)',
  'var(--dept-finance)',
  'var(--dept-people)',
  'var(--dept-legal)',
  'var(--dept-marketing)',
  'var(--dept-it)',
];

function buildColorMap(departments: Department[]): Map<string, string> {
  const map = new Map<string, string>();
  function traverse(dept: Department, color: string) {
    map.set(dept.id, color);
    dept.children.forEach((child) => traverse(child, color));
  }
  departments.forEach((root, i) => {
    traverse(root, DEPT_COLORS[i % DEPT_COLORS.length]);
  });
  return map;
}

/* ── Tree item ───────────────────────────────────────────────────────────── */

function DepartmentTreeItem({
  dept,
  depth = 0,
  selectedId,
  expandedIds,
  colorMap,
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
  colorMap: Map<string, string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onEdit: (dept: Department) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (dept: Department) => void;
}) {
  const hasChildren = dept.children.length > 0;
  const isExpanded = expandedIds.has(dept.id);
  const isSelected = selectedId === dept.id;
  const color = colorMap.get(dept.id) ?? DEPT_COLORS[0];

  return (
    <li>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className="group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-[120ms] hover:bg-surface-2"
        style={{
          background: isSelected ? `color-mix(in oklab, ${color} 10%, transparent)` : undefined,
          paddingLeft: depth > 0 ? `${depth * 24 + 12}px` : undefined,
        }}
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
            'flex size-4 shrink-0 items-center justify-center rounded text-fg-muted transition-transform duration-[120ms]',
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

        {/* Color dot */}
        {depth === 0 ? (
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
        ) : (
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: color, opacity: 0.65 }}
            aria-hidden
          />
        )}

        <span
          className={cn(
            'flex-1 truncate text-[13px] leading-[18px]',
            depth === 0 ? 'font-medium text-fg' : 'font-normal text-fg-muted',
          )}
        >
          {dept.name}
        </span>

        <span className="font-mono text-[12px] font-medium leading-[16px] text-fg-muted tabular-nums">
          {dept._count.employees}
        </span>

        {/* Row actions */}
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
              colorMap={colorMap}
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
          className="h-9 animate-pulse rounded-lg bg-surface-2"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

/* ── Detail panel ────────────────────────────────────────────────────────── */

function DepartmentDetailPanel({
  dept,
  colorMap,
  flatDepts,
  onEdit,
  onAddChild,
  onDelete,
}: {
  dept: Department;
  colorMap: Map<string, string>;
  flatDepts: Department[];
  onEdit: (dept: Department) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (dept: Department) => void;
}) {
  const color = colorMap.get(dept.id) ?? DEPT_COLORS[0];
  const parentName = dept.parentId
    ? (flatDepts.find((d) => d.id === dept.parentId)?.name ?? null)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero card */}
      <div
        className="rounded-xl border border-subtle bg-surface p-6"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Type badge */}
            <div
              className="mb-2.5 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-medium leading-[16px]"
              style={{
                background: `color-mix(in oklab, ${color} 14%, transparent)`,
                color,
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: 'currentColor' }}
                aria-hidden
              />
              {parentName ? `${parentName} · sub-team` : 'Department'}
            </div>

            <h2 className="text-[22px] font-semibold leading-[30px] tracking-tight text-fg">
              {dept.name}
            </h2>

            <p className="mt-1 text-sm text-fg-muted">
              {dept.headEmployee ? (
                <>
                  Headed by{' '}
                  <strong className="font-medium text-fg">
                    {dept.headEmployee.firstName} {dept.headEmployee.lastName}
                  </strong>{' '}
                  &middot;{' '}
                </>
              ) : (
                'No head assigned · '
              )}
              {dept._count.employees} people
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <PermissionWrapper permission="departments:write">
              <Button variant="outline" size="sm" onClick={() => onEdit(dept)}>
                Reassign head
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-8')}
                  aria-label={`More actions for ${dept.name}`}
                >
                  <MoreHorizontalIcon className="size-4" aria-hidden />
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
      </div>

      {/* Sub-teams grid */}
      {dept.children.length > 0 && (
        <div className="rounded-xl border border-subtle bg-surface">
          <div className="border-b border-subtle px-4 py-3">
            <h3 className="text-sm font-semibold text-fg">
              Sub-teams &middot; {dept.children.length}
            </h3>
          </div>
          <div
            className="grid gap-3 p-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {dept.children.map((child) => (
              <div
                key={child.id}
                className="cursor-pointer rounded-lg border border-subtle bg-surface p-3.5 transition-colors duration-[120ms] hover:bg-surface-2"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <p className="text-[13px] font-medium leading-[18px] text-fg">{child.name}</p>
                {child.headEmployee && (
                  <p className="mt-0.5 text-[12px] leading-[16px] text-fg-muted">
                    {child.headEmployee.firstName} {child.headEmployee.lastName}
                  </p>
                )}
                <p className="mt-2 text-lg font-semibold tabular-nums text-fg">
                  {child._count.employees}{' '}
                  <span className="text-[12px] font-normal text-fg-muted">people</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl border border-subtle bg-surface">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-fg">Members</h3>
        </div>
        <div className="p-4">
          <DepartmentEmployeesTable deptId={dept.id} />
        </div>
      </div>
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
  const flatDepts = flattenDepartmentTree(departments);

  const colorMap = useMemo(() => buildColorMap(departments), [departments]);

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
        description="Org tree and team rosters."
        breadcrumbs={[{ label: 'Departments' }]}
        actions={
          <PermissionWrapper permission="departments:write">
            <Button size="sm" onClick={() => openCreateForm()}>
              <PlusIcon className="mr-1.5 size-4 shrink-0" aria-hidden />
              Add department
            </Button>
          </PermissionWrapper>
        }
      />

      <div className="grid px-6 pb-6" style={{ gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Left: Tree panel */}
        <div className="rounded-xl border border-subtle bg-surface p-3">
          {isLoading ? (
            <TreeSkeleton />
          ) : isError ? (
            <div className="p-2">
              <ErrorState message={errorMessage} onRetry={() => refetch()} />
            </div>
          ) : departments.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center p-4">
              <EmptyState
                title="No departments yet"
                description="Create your first department to get started."
                action={
                  <PermissionWrapper permission="departments:write">
                    <Button size="sm" variant="outline" onClick={() => openCreateForm()}>
                      <PlusIcon className="mr-1.5 size-4" aria-hidden />
                      Add department
                    </Button>
                  </PermissionWrapper>
                }
              />
            </div>
          ) : (
            <ul role="tree" aria-label="Department tree" className="space-y-0.5">
              {departments.map((dept) => (
                <DepartmentTreeItem
                  key={dept.id}
                  dept={dept}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  colorMap={colorMap}
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

        {/* Right: Detail panel */}
        <div className="min-w-0">
          {!selectedDept ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-subtle bg-surface p-8">
              <EmptyState
                title="Select a department"
                description="Click any department in the tree to view its details."
              />
            </div>
          ) : (
            <DepartmentDetailPanel
              dept={selectedDept}
              colorMap={colorMap}
              flatDepts={flatDepts}
              onEdit={openEditForm}
              onAddChild={openCreateForm}
              onDelete={handleDeleteRequest}
            />
          )}
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

      {/* Reassign-and-delete dialog */}
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
