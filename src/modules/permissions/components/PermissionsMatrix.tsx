'use client';

import { Fragment, useState, useCallback } from 'react';
import {
  AlertTriangleIcon,
  BarChart2Icon,
  Building2Icon,
  CalendarDaysIcon,
  ClockIcon,
  FileSearchIcon,
  LockIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/shared/layouts/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ApiError } from '@/types/api';
import { useAuth } from '@/providers/AuthProvider';

import { useRolesPermissions } from '../hooks/usePermissions';
import { useUpdateRolePermissions, useDeleteRole } from '../hooks/usePermissionsMutations';
import { AddRoleDialog } from './AddRoleDialog';
import {
  BUILT_IN_ROLE_LABELS,
  DEMO_USER_COUNTS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from '../constants/permissions.constants';
import type {
  CustomRoleInfo,
  PermissionKey,
  RolesPermissionsData,
} from '../types/permissions.types';

// ── Role color palette ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'var(--dept-product)',
  HR_ADMIN: 'var(--brand-500)',
  MANAGER: 'var(--dept-finance)',
  EMPLOYEE: 'var(--text-tertiary)',
  AUDITOR: 'var(--dept-people)',
};

// ── Permission group icons ────────────────────────────────────────────────────

type IconComponent = React.ComponentType<LucideProps>;

const GROUP_ICONS: Record<string, IconComponent> = {
  Employees: UsersIcon,
  Departments: Building2Icon,
  Attendance: ClockIcon,
  Leave: CalendarDaysIcon,
  Analytics: BarChart2Icon,
  Audit: FileSearchIcon,
  Permissions: ShieldIcon,
};

// ── Level metadata ────────────────────────────────────────────────────────────

const LEVEL_META = {
  full: {
    label: 'Full Access',
    symbol: '●',
    color: 'var(--success-500)',
  },
  none: {
    label: '—',
    symbol: '○',
    color: 'var(--text-disabled)',
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleLabel(role: string, customRoles: CustomRoleInfo[]): string {
  if (role in BUILT_IN_ROLE_LABELS) return BUILT_IN_ROLE_LABELS[role];
  return customRoles.find((r) => r.key === role)?.name ?? role;
}

type PendingOverrides = Map<string, Set<PermissionKey>>;

function getEffective(
  role: string,
  serverData: RolesPermissionsData,
  overrides: PendingOverrides,
): Set<PermissionKey> {
  return overrides.get(role) ?? new Set(serverData.matrix[role] ?? []);
}

interface ImpactDetail {
  role: string;
  roleLabel: string;
  gained: PermissionKey[];
  lost: PermissionKey[];
  userCount: number;
}

function computeImpact(
  overrides: PendingOverrides,
  data: RolesPermissionsData,
): { totalGainUsers: number; totalLoseUsers: number; details: ImpactDetail[] } {
  const customRoles = data.customRoles ?? [];
  let totalGainUsers = 0;
  let totalLoseUsers = 0;
  const details: ImpactDetail[] = [];

  for (const [role, newPerms] of overrides) {
    if (role === 'SUPER_ADMIN') continue;
    const oldPerms = new Set<PermissionKey>(data.matrix[role] ?? []);
    const gained = Array.from(newPerms).filter((p) => !oldPerms.has(p)) as PermissionKey[];
    const lost = Array.from(oldPerms).filter((p) => !newPerms.has(p)) as PermissionKey[];
    if (gained.length === 0 && lost.length === 0) continue;

    const isCustom = customRoles.some((r) => r.key === role);
    const userCount = isCustom ? 0 : (DEMO_USER_COUNTS[role] ?? 0);
    const roleLabel = getRoleLabel(role, customRoles);

    if (gained.length > 0) totalGainUsers += userCount;
    if (lost.length > 0) totalLoseUsers += userCount;
    details.push({ role, roleLabel, gained, lost, userCount });
  }

  return { totalGainUsers, totalLoseUsers, details };
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function MatrixSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-subtle bg-surface p-3.5">
            <Skeleton className="h-[14px] w-20 mb-1" />
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="overflow-hidden rounded-lg border border-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-surface-raised">
              <th className="w-[32%] px-5 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="min-w-[110px] px-3 py-3 text-center">
                  <Skeleton className="mx-auto h-[13px] w-16 mb-1" />
                  <Skeleton className="mx-auto h-[10px] w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-subtle last:border-0">
                <td className="px-5 py-2.5">
                  <Skeleton className="h-[13px] w-28 mb-1" />
                  <Skeleton className="h-[11px] w-24" />
                </td>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-7 w-[88px] rounded-md" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Permission cell ───────────────────────────────────────────────────────────

interface PermCellProps {
  checked: boolean;
  isLocked: boolean;
  isSaving: boolean;
  onClick: () => void;
}

function PermCell({ checked, isLocked, isSaving, onClick }: PermCellProps) {
  const meta = checked ? LEVEL_META.full : LEVEL_META.none;
  const activeColor = meta.color;

  return (
    <button
      type="button"
      onClick={isLocked || isSaving ? undefined : onClick}
      disabled={isLocked || isSaving}
      title={isLocked ? 'Super Admin always has all permissions' : undefined}
      className={[
        'inline-flex items-center justify-center',
        'min-w-[88px] h-7',
        'rounded-md text-[12px] font-medium',
        'border transition-transform duration-[60ms]',
        isLocked
          ? 'cursor-default'
          : isSaving
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:scale-[1.04] active:scale-[0.96]',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: checked
          ? `color-mix(in oklab, ${activeColor} 14%, transparent)`
          : 'transparent',
        color: activeColor,
        borderColor: checked
          ? `color-mix(in oklab, ${activeColor} 26%, transparent)`
          : 'var(--border-subtle)',
      }}
    >
      {checked && (
        <span className="mr-1" style={{ fontSize: 11 }}>
          {meta.symbol}
        </span>
      )}
      {meta.label}
    </button>
  );
}

// ── Matrix table ──────────────────────────────────────────────────────────────

interface MatrixContentProps {
  data: RolesPermissionsData;
  overrides: PendingOverrides;
  savingRoles: Set<string>;
  deletingRole: string | null;
  onToggle: (role: string, permission: PermissionKey) => void;
  onDeleteRole: (key: string) => void;
}

function MatrixContent({
  data,
  overrides,
  savingRoles,
  deletingRole,
  onToggle,
  onDeleteRole,
}: MatrixContentProps) {
  const customRoles = data.customRoles ?? [];

  return (
    <div className="overflow-hidden rounded-lg border border-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-subtle bg-surface-raised">
              <th className="sticky left-0 z-10 bg-surface-raised w-[32%] px-5 py-3 text-left text-xs font-medium text-fg-subtle">
                Permission
              </th>
              {data.roles.map((role) => {
                const isCustom = customRoles.some((r) => r.key === role);
                const roleColor = ROLE_COLORS[role] ?? 'var(--brand-500)';
                return (
                  <th key={role} className="min-w-[110px] px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[13px] font-semibold text-fg">
                        {getRoleLabel(role, customRoles)}
                      </span>
                      <span
                        className="font-mono text-[10px] font-medium"
                        style={{ color: roleColor }}
                      >
                        {role}
                      </span>
                      {isCustom && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            Custom
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteRole(role)}
                            disabled={deletingRole === role}
                            className="rounded p-0.5 text-fg-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                            title={`Delete ${getRoleLabel(role, customRoles)} role`}
                          >
                            <Trash2Icon className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => {
              const GroupIcon = GROUP_ICONS[group.label];
              return (
                <Fragment key={group.label}>
                  <tr className="border-b border-subtle bg-surface-raised/60">
                    <td colSpan={data.roles.length + 1} className="px-5 py-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                        {GroupIcon && <GroupIcon size={12} />}
                        {group.label}
                      </div>
                    </td>
                  </tr>
                  {group.permissions.map((permission) => (
                    <tr
                      key={permission}
                      className="border-b border-subtle last:border-0 hover:bg-surface-raised/30 transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-surface px-5 py-2.5">
                        <div className="text-[13px] font-medium text-fg">
                          {PERMISSION_LABELS[permission]}
                        </div>
                        <div className="font-mono text-[11px] text-fg-muted mt-0.5">
                          {permission}
                        </div>
                      </td>
                      {data.roles.map((role) => {
                        const effective = getEffective(role, data, overrides);
                        const checked = effective.has(permission);
                        const isLocked = role === 'SUPER_ADMIN';
                        const isSavingRole = savingRoles.has(role);
                        return (
                          <td key={role} className="px-3 py-2 text-center">
                            <PermCell
                              checked={checked}
                              isLocked={isLocked}
                              isSaving={isSavingRole}
                              onClick={() => onToggle(role, permission)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PermissionsMatrix() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useRolesPermissions();
  const updateMutation = useUpdateRolePermissions();
  const deleteRoleMutation = useDeleteRole();

  const [overrides, setOverrides] = useState<PendingOverrides>(new Map());
  const [savingRoles, setSavingRoles] = useState<Set<string>>(new Set());
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [impactDialog, setImpactDialog] = useState<{
    open: boolean;
    totalGainUsers: number;
    totalLoseUsers: number;
    details: ImpactDetail[];
  }>({ open: false, totalGainUsers: 0, totalLoseUsers: 0, details: [] });

  const isDirty = overrides.size > 0;
  const isSaving = savingRoles.size > 0;
  const isSuperAdmin = user?.memberType === 'SUPER_ADMIN';

  const handleToggle = useCallback(
    (role: string, permission: PermissionKey) => {
      if (role === 'SUPER_ADMIN' || !data) return;
      setOverrides((prev) => {
        const next = new Map(prev);
        const current = getEffective(role, data, prev);
        const updated = new Set(current);
        if (updated.has(permission)) {
          updated.delete(permission);
        } else {
          updated.add(permission);
        }
        next.set(role, updated);
        return next;
      });
    },
    [data],
  );

  const handleReset = useCallback(() => {
    setOverrides(new Map());
  }, []);

  const handleSaveClick = useCallback(() => {
    if (!isDirty || !data) return;
    const impact = computeImpact(overrides, data);
    setImpactDialog({ open: true, ...impact });
  }, [isDirty, data, overrides]);

  const handleConfirmSave = useCallback(async () => {
    if (!data) return;
    setImpactDialog((prev) => ({ ...prev, open: false }));

    const customRoleKeys = new Set((data.customRoles ?? []).map((r) => r.key));
    const rolesToSave = Array.from(overrides.keys()).filter((r) => r !== 'SUPER_ADMIN');
    const builtInRolesToSave = rolesToSave.filter((r) => !customRoleKeys.has(r));
    const customRolesToSave = rolesToSave.filter((r) => customRoleKeys.has(r));

    setSavingRoles(new Set(rolesToSave));

    let failCount = 0;

    for (const role of builtInRolesToSave) {
      try {
        await updateMutation.mutateAsync({
          role,
          permissions: Array.from(overrides.get(role) ?? []) as PermissionKey[],
        });
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(role);
          return next;
        });
      } catch (err) {
        failCount++;
        const axiosErr = err as AxiosError<ApiError>;
        const message =
          axiosErr.response?.data?.error?.message ??
          `Failed to save ${getRoleLabel(role, data.customRoles ?? [])}`;
        toast.error(message);
      }
    }

    if (customRolesToSave.length > 0) {
      queryClient.setQueryData<RolesPermissionsData>(['settings', 'roles-permissions'], (old) => {
        if (!old) return old;
        const newMatrix = { ...old.matrix };
        customRolesToSave.forEach((role) => {
          newMatrix[role] = Array.from(overrides.get(role) ?? []) as PermissionKey[];
        });
        return { ...old, matrix: newMatrix };
      });
      setOverrides((prev) => {
        const next = new Map(prev);
        customRolesToSave.forEach((r) => next.delete(r));
        return next;
      });
    }

    setSavingRoles(new Set());
    if (failCount === 0) {
      toast.success('Permissions saved');
    }
  }, [data, overrides, updateMutation, queryClient]);

  const handleDeleteRole = useCallback(
    async (key: string) => {
      setDeletingRole(key);
      try {
        await deleteRoleMutation.mutateAsync(key);
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        toast.success('Role deleted');
      } catch (err) {
        const axiosErr = err as AxiosError<ApiError>;
        const message = axiosErr.response?.data?.error?.message ?? 'Failed to delete role';
        toast.error(message);
      } finally {
        setDeletingRole(null);
      }
    },
    [deleteRoleMutation],
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Permissions"
        description="Manage what each role can access across the system."
        breadcrumbs={[{ label: 'Permissions' }]}
        actions={
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="outline" size="default" onClick={() => setAddRoleOpen(true)}>
                <PlusIcon className="size-3.5 mr-1.5" />
                Add Role
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              onClick={handleReset}
              disabled={isSaving || !isDirty}
            >
              <RotateCcwIcon className="size-3.5 mr-1.5" />
              Reset to defaults
            </Button>
            <Button size="default" onClick={handleSaveClick} disabled={!isDirty || isSaving}>
              <SaveIcon className="size-3.5 mr-1.5" />
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {isError ? (
          <ErrorState message="Failed to load permissions." onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <MatrixSkeleton />
        ) : data.roles.length === 0 ? (
          <EmptyState
            title="No roles found"
            description="No roles or permissions have been configured."
          />
        ) : (
          <>
            {/* Role summary cards */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.min(data.roles.length, 5)}, minmax(0, 1fr))`,
              }}
            >
              {data.roles.map((role) => {
                const customRoles = data.customRoles ?? [];
                const isCustom = customRoles.some((r) => r.key === role);
                const roleColor = ROLE_COLORS[role] ?? 'var(--brand-500)';
                const count = isCustom ? 0 : (DEMO_USER_COUNTS[role] ?? 0);
                return (
                  <div
                    key={role}
                    className="rounded-lg border border-subtle bg-surface p-3.5"
                    style={{ borderTop: `3px solid ${roleColor}` }}
                  >
                    <div className="text-[14px] font-semibold leading-5 text-fg">
                      {getRoleLabel(role, customRoles)}
                    </div>
                    <div className="mt-0.5 font-mono text-[12px] font-medium text-fg-muted">
                      {role}
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span
                        className="text-[20px] font-semibold leading-[26px] tabular-nums"
                        style={{ color: roleColor }}
                      >
                        {count}
                      </span>
                      <span className="text-[12px] font-medium text-fg-muted">members</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[12px] font-medium text-fg-subtle">
              <span>Permission levels:</span>
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: LEVEL_META.full.color }}
              >
                <span style={{ fontSize: 14 }}>{LEVEL_META.full.symbol}</span>
                <span>{LEVEL_META.full.label}</span>
              </span>
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: LEVEL_META.none.color }}
              >
                <span style={{ fontSize: 14 }}>{LEVEL_META.none.symbol}</span>
                <span>No Access</span>
              </span>
              <span className="ml-auto text-[12px] italic text-fg-muted">
                Click a cell to toggle access.
              </span>
            </div>

            {isDirty && (
              <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                <span className="size-1.5 shrink-0 rounded-full bg-warning" />
                You have unsaved changes.
              </div>
            )}

            <MatrixContent
              data={data}
              overrides={overrides}
              savingRoles={savingRoles}
              deletingRole={deletingRole}
              onToggle={handleToggle}
              onDeleteRole={(key) => void handleDeleteRole(key)}
            />

            <p className="text-xs text-fg-muted">
              <LockIcon className="mr-1 inline size-3 align-middle" />
              Super Admin permissions cannot be modified.
            </p>
          </>
        )}
      </div>

      <AddRoleDialog open={addRoleOpen} onOpenChange={setAddRoleOpen} />

      <Dialog
        open={impactDialog.open}
        onOpenChange={(isOpen) => setImpactDialog((prev) => ({ ...prev, open: isOpen }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-warning" />
              Confirm Permission Changes
            </DialogTitle>
            <DialogDescription>
              {impactDialog.totalGainUsers + impactDialog.totalLoseUsers > 0 ? (
                <>
                  These changes will affect{' '}
                  <strong>
                    {impactDialog.totalGainUsers + impactDialog.totalLoseUsers} user
                    {impactDialog.totalGainUsers + impactDialog.totalLoseUsers !== 1 ? 's' : ''}
                  </strong>
                  .
                </>
              ) : (
                'These changes affect custom roles with no users assigned yet.'
              )}
            </DialogDescription>
          </DialogHeader>

          {impactDialog.details.length > 0 && (
            <div className="divide-y divide-subtle rounded-md border border-subtle text-sm">
              {impactDialog.details.map((detail) => (
                <div key={detail.role} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-fg">{detail.roleLabel}</span>
                    <span className="text-xs text-fg-muted">
                      {detail.userCount} user{detail.userCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {detail.gained.length > 0 && (
                    <p className="mt-0.5 text-xs text-success">+ {detail.gained.join(', ')}</p>
                  )}
                  {detail.lost.length > 0 && (
                    <p className="mt-0.5 text-xs text-danger">− {detail.lost.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImpactDialog((prev) => ({ ...prev, open: false }))}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmSave()} disabled={isSaving}>
              <SaveIcon className="size-3.5 mr-1.5" />
              {isSaving ? 'Saving…' : 'Confirm & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
