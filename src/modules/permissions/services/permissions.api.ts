import { apiClient } from '@/lib/api-client';
import type {
  CreateCustomRoleInput,
  CustomRoleInfo,
  RolesPermissionsData,
  UpdateRolePermissionsInput,
} from '../types/permissions.types';

export const permissionsApi = {
  /** GET /settings/roles-permissions — Required role: SUPER_ADMIN */
  getRolesPermissions: async (): Promise<RolesPermissionsData> => {
    const { data } = await apiClient.get<{ data: RolesPermissionsData }>(
      '/settings/roles-permissions',
    );
    return data.data;
  },

  /**
   * PATCH /settings/roles-permissions — Required role: SUPER_ADMIN
   * Replaces the full permission set for a built-in role.
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

  /**
   * POST /settings/roles — LIVE (verified 2026-06-10; 201)
   * KNOWN BACKEND BUG (BE-10): the backend creates the role but DROPS the
   * `permissions` field (the role lands with []). We still send `permissions`
   * so it works once the backend persists them; until then, grant access by
   * editing the role in the matrix + Save (PATCH does persist).
   * Error: DUPLICATE_ROLE_KEY (409)
   */
  createRole: async (
    input: CreateCustomRoleInput,
  ): Promise<CustomRoleInfo & { permissions: string[] }> => {
    const { data } = await apiClient.post<{
      data: CustomRoleInfo & { permissions: string[] };
    }>('/settings/roles', input);
    return data.data;
  },

  /**
   * DELETE /settings/roles/:key — LIVE (verified 2026-06-10; 200 → { key, status:"deleted" })
   * Error: ROLE_IN_USE (409) if users assigned to this role
   */
  deleteRole: async (key: string): Promise<{ key: string; status: string }> => {
    const { data } = await apiClient.delete<{ data: { key: string; status: string } }>(
      `/settings/roles/${key}`,
    );
    return data.data;
  },
};
