import { apiClient } from '@/lib/api-client';
import type { RolesPermissionsData, UpdateRolePermissionsInput } from '../types/permissions.types';

export const permissionsApi = {
  /**
   * GET /settings/roles-permissions
   * Required role: SUPER_ADMIN
   * Returns { roles, permissions, matrix }
   */
  getRolesPermissions: async (): Promise<RolesPermissionsData> => {
    const { data } = await apiClient.get<{ data: RolesPermissionsData }>(
      '/settings/roles-permissions',
    );
    return data.data;
  },

  /**
   * PATCH /settings/roles-permissions
   * Required role: SUPER_ADMIN
   * Body: { role, permissions[] } — replaces the full permission set for that role.
   * Error: CANNOT_LOCK_OUT_SUPER_ADMIN (403) if role === 'SUPER_ADMIN'
   */
  updateRolePermissions: async (
    input: UpdateRolePermissionsInput,
  ): Promise<RolesPermissionsData> => {
    const { data } = await apiClient.patch<{ data: RolesPermissionsData }>(
      '/settings/roles-permissions',
      input,
    );
    return data.data;
  },
};
