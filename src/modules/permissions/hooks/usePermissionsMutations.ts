import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '../services/permissions.api';
import type {
  CreateCustomRoleInput,
  PermissionKey,
  RolesPermissionsData,
  UpdateRolePermissionsInput,
} from '../types/permissions.types';

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRolePermissionsInput) => permissionsApi.updateRolePermissions(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles-permissions'] });
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    // NOTE: the backend `POST /settings/roles` currently DROPS the `permissions`
    // field — the role is created with [] (tracked as BE-10). We still SEND the
    // selected permissions in the body so this starts working the moment the
    // backend persists them; until then the new role honestly shows the
    // backend's stored state (no permissions). To grant access today, set the
    // role's cells in the matrix and Save (that PATCH does persist).
    mutationFn: (input: CreateCustomRoleInput) => permissionsApi.createRole(input),
    onSuccess: (newRole) => {
      queryClient.setQueryData<RolesPermissionsData>(['settings', 'roles-permissions'], (old) => {
        if (!old) return old;
        return {
          ...old,
          roles: [...old.roles, newRole.key],
          matrix: {
            ...old.matrix,
            [newRole.key]: (newRole.permissions as PermissionKey[]) ?? [],
          },
          customRoles: [...(old.customRoles ?? []), { key: newRole.key, name: newRole.name }],
        };
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => permissionsApi.deleteRole(key),
    onSuccess: (_, deletedKey) => {
      queryClient.setQueryData<RolesPermissionsData>(['settings', 'roles-permissions'], (old) => {
        if (!old) return old;
        return {
          ...old,
          roles: old.roles.filter((r) => r !== deletedKey),
          matrix: Object.fromEntries(Object.entries(old.matrix).filter(([k]) => k !== deletedKey)),
          customRoles: (old.customRoles ?? []).filter((r) => r.key !== deletedKey),
        };
      });
    },
  });
}
