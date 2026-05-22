export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface UserEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string;
  departmentId: string;
  workEmail: string;
  phone: string;
  employmentType: string;
  employmentStatus: string;
  location: string;
}

/** Shape returned by GET /auth/me (verified against API_MAPPING.md). */
export interface User {
  id: string;
  email: string;
  /** Role identifier — called `memberType` by the API. */
  memberType: UserRole;
  /** null for SUPER_ADMIN — they have no employee profile. */
  employeeId: string | null;
  status: string;
  /** null for SUPER_ADMIN. */
  employee: UserEmployee | null;
  permissions: string[];
}
