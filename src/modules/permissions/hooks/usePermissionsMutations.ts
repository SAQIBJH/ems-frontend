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
    // The backend `POST /settings/roles` creates the role but DROPS the
    // `permissions` field (the role lands with []), so persist them with a
    // follow-up PATCH — which the backend honours for custom role keys.
    mutationFn: async (input: CreateCustomRoleInput) => {
      const created = await permissionsApi.createRole(input);
      if (input.permissions.length > 0) {
        await permissionsApi.updateRolePermissions({
          role: input.key,
          permissions: input.permissions,
        });
      }
      // Surface the permissions the user actually selected (the create
      // response omits them) so the optimistic cache reflects reality.
      return { ...created, key: input.key, name: input.name, permissions: input.permissions };
    },
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
