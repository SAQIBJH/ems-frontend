export type RoleName = 'EMPLOYEE' | 'HR_ADMIN' | 'AUDITOR' | 'MANAGER' | 'SUPER_ADMIN';

export type PermissionKey =
  | 'analytics:read'
  | 'attendance:read'
  | 'attendance:write'
  | 'audit:read'
  | 'departments:read'
  | 'departments:write'
  | 'employees:delete'
  | 'employees:export'
  | 'employees:read'
  | 'employees:write'
  | 'leave:approve'
  | 'leave:read'
  | 'leave:request'
  | 'permissions:manage';

export interface RolesPermissionsData {
  roles: RoleName[];
  permissions: PermissionKey[];
  matrix: Record<RoleName, PermissionKey[]>;
}

export interface UpdateRolePermissionsInput {
  role: RoleName;
  permissions: PermissionKey[];
}
