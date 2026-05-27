export const BUILT_IN_ROLES = [
  'EMPLOYEE',
  'HR_ADMIN',
  'AUDITOR',
  'MANAGER',
  'SUPER_ADMIN',
] as const;

export type BuiltInRoleName = (typeof BUILT_IN_ROLES)[number];
/** Kept as an alias for backward compatibility. */
export type RoleName = BuiltInRoleName;

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

export interface CustomRoleInfo {
  key: string;
  name: string;
}

export interface CreateCustomRoleInput {
  name: string;
  key: string;
  permissions: PermissionKey[];
}

export interface RolesPermissionsData {
  /** All role keys — built-in AND any custom roles added in this session. */
  roles: string[];
  permissions: PermissionKey[];
  matrix: Record<string, PermissionKey[]>;
  /** Present only when custom roles have been created (MSW-managed). */
  customRoles?: CustomRoleInfo[];
}

export interface UpdateRolePermissionsInput {
  role: string;
  permissions: PermissionKey[];
}
