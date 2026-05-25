'use client';

import { Fragment, useState, useCallback } from 'react';
import { LockIcon, SaveIcon, RotateCcwIcon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/shared/layouts/PageHeader';
import type { ApiError } from '@/types/api';

import { useRolesPermissions } from '../hooks/usePermissions';
import { useUpdateRolePermissions } from '../hooks/usePermissionsMutations';
import type { PermissionKey, RoleName, RolesPermissionsData } from '../types/permissions.types';

const ROLE_LABELS: Record<RoleName, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  AUDITOR: 'Auditor',
  HR_ADMIN: 'HR Admin',
  SUPER_ADMIN: 'Super Admin',
};

const PERMISSION_GROUPS: Array<{ label: string; permissions: PermissionKey[] }> = [
  {
    label: 'Employees',
    permissions: ['employees:read', 'employees:write', 'employees:delete', 'employees:export'],
  },
  { label: 'Departments', permissions: ['departments:read', 'departments:write'] },
  { label: 'Attendance', permissions: ['attendance:read', 'attendance:write'] },
  { label: 'Leave', permissions: ['leave:read', 'leave:request', 'leave:approve'] },
  { label: 'Analytics', permissions: ['analytics:read'] },
  { label: 'Audit', permissions: ['audit:read'] },
  { label: 'Permissions', permissions: ['permissions:manage'] },
];

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'employees:read': 'View',
  'employees:write': 'Create / Edit',
  'employees:delete': 'Delete',
  'employees:export': 'Export',
  'departments:read': 'View',
  'departments:write': 'Create / Edit',
  'attendance:read': 'View',
  'attendance:write': 'Check-in / Out',
  'leave:read': 'View',
  'leave:request': 'Request',
  'leave:approve': 'Approve / Deny',
  'analytics:read': 'View',
  'audit:read': 'View',
  'permissions:manage': 'Manage',
};

/** Local edits per role — only roles touched by the user appear here. */
type PendingOverrides = Map<RoleName, Set<PermissionKey>>;

function getEffective(
  role: RoleName,
  serverData: RolesPermissionsData,
  overrides: PendingOverrides,
): Set<PermissionKey> {
  return overrides.get(role) ?? new Set(serverData.matrix[role] ?? []);
}

function MatrixSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-lg border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-raised">
                <th className="px-4 py-3 text-left w-56">
                  <Skeleton className="h-4 w-24" />
                </th>
                {Array.from({ length: 5 }).map((_, i) => (
                  <th key={i} className="px-4 py-3 text-center w-32">
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 14 }).map((_, i) => (
                <tr key={i} className="border-b border-subtle last:border-0">
                  <td className="px-4 py-2.5">
                    <Skeleton className="h-4 w-36" />
                  </td>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-2.5 text-center">
                      <Skeleton className="h-4 w-4 mx-auto rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MatrixContentProps {
  data: RolesPermissionsData;
  overrides: PendingOverrides;
  savingRoles: Set<RoleName>;
  onToggle: (role: RoleName, permission: PermissionKey) => void;
}

function MatrixContent({ data, overrides, savingRoles, onToggle }: MatrixContentProps) {
  return (
    <div className="rounded-lg border border-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-surface-raised">
              <th className="px-4 py-3 text-left text-xs font-medium text-fg-subtle w-56">
                Permission
              </th>
              {data.roles.map((role) => (
                <th
                  key={role}
                  className="px-4 py-3 text-center text-xs font-semibold text-fg min-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    {role === 'SUPER_ADMIN' && <ShieldCheckIcon className="size-3.5 text-brand" />}
                    <span>{ROLE_LABELS[role]}</span>
                    {role !== 'SUPER_ADMIN' && overrides.has(role) && (
                      <span className="size-1.5 rounded-full bg-warning" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.label}>
                <tr className="border-b border-subtle bg-surface-raised/60">
                  <td
                    colSpan={data.roles.length + 1}
                    className="px-4 py-1.5 text-xs font-semibold text-fg-subtle uppercase tracking-wide"
                  >
                    {group.label}
                  </td>
                </tr>
                {group.permissions.map((permission) => (
                  <tr
                    key={permission}
                    className="border-b border-subtle last:border-0 hover:bg-surface-raised/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-fg-subtle pl-6">
                      {PERMISSION_LABELS[permission]}
                      <span className="ml-2 text-xs text-fg-muted font-mono">{permission}</span>
                    </td>
                    {data.roles.map((role) => {
                      const effective = getEffective(role, data, overrides);
                      const checked = effective.has(permission);
                      const isLocked = role === 'SUPER_ADMIN';
                      const isSavingRole = savingRoles.has(role);
                      return (
                        <td key={role} className="px-4 py-2.5 text-center">
                          {isLocked ? (
                            <div
                              className="flex items-center justify-center"
                              title="Super Admin always has all permissions"
                            >
                              {checked ? (
                                <Checkbox
                                  checked
                                  disabled
                                  className="cursor-not-allowed opacity-60"
                                />
                              ) : (
                                <LockIcon className="size-3.5 text-fg-muted" />
                              )}
                            </div>
                          ) : (
                            <Checkbox
                              checked={checked}
                              disabled={isSavingRole}
                              onCheckedChange={() => onToggle(role, permission)}
                              className="mx-auto"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PermissionsMatrix() {
  const { data, isLoading, isError, refetch } = useRolesPermissions();
  const updateMutation = useUpdateRolePermissions();

  /** Only roles the user has touched are stored here. */
  const [overrides, setOverrides] = useState<PendingOverrides>(new Map());
  const [savingRoles, setSavingRoles] = useState<Set<RoleName>>(new Set());

  const isDirty = overrides.size > 0;
  const isSaving = savingRoles.size > 0;

  const handleToggle = useCallback(
    (role: RoleName, permission: PermissionKey) => {
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

  const handleSave = useCallback(async () => {
    if (!isDirty || !data) return;

    const rolesToSave = Array.from(overrides.keys()).filter((r) => r !== 'SUPER_ADMIN');
    setSavingRoles(new Set(rolesToSave));

    let failCount = 0;
    for (const role of rolesToSave) {
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
          axiosErr.response?.data?.error?.message ?? `Failed to save ${ROLE_LABELS[role]}`;
        toast.error(message);
      }
    }

    setSavingRoles(new Set());
    if (failCount === 0) {
      toast.success('Permissions saved');
    }
  }, [isDirty, data, overrides, updateMutation]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Permissions"
        description="Manage what each role can access across the system."
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button variant="outline" size="default" onClick={handleReset} disabled={isSaving}>
                <RotateCcwIcon className="size-3.5 mr-1.5" />
                Reset
              </Button>
            )}
            <Button
              size="default"
              onClick={() => void handleSave()}
              disabled={!isDirty || isSaving}
            >
              <SaveIcon className="size-3.5 mr-1.5" />
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="p-6">
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
          <div className="space-y-4">
            {isDirty && (
              <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                <span className="size-1.5 rounded-full bg-warning" />
                You have unsaved changes.
              </div>
            )}

            <MatrixContent
              data={data}
              overrides={overrides}
              savingRoles={savingRoles}
              onToggle={handleToggle}
            />

            <p className="text-xs text-fg-muted">
              <LockIcon className="size-3 inline mr-1 align-middle" />
              Super Admin permissions cannot be modified.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
