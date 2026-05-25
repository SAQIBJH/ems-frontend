export interface Employee {
  id: string;
  tenantId: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  designation: string;
  departmentId: string;
  managerId: string | null;
  joinedOn: string;
  employmentType: string;
  employmentStatus: string;
  location: string;
  payCurrency: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LoginUser {
  id: string;
  email: string;
  memberType: 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  /** null for SUPER_ADMIN — they have no employee profile */
  employeeId: string | null;
  /** null for SUPER_ADMIN */
  employee: Employee | null;
}

/** Shape of POST /auth/login data payload (verified against API_MAPPING.md). */
export interface LoginResponse {
  /** httpOnly cookie — present in body for Postman/Swagger only; browser ignores it. */
  accessToken: string;
  sessionId: string;
  user: LoginUser;
  permissions: string[];
}

/** Alternate login response when MFA is required (no cookies issued yet). */
export interface MfaRequiredResponse {
  mfaRequired: true;
  challengeId: string;
  deliveryMethod: 'EMAIL' | 'SMS' | 'TOTP';
}

/** Response from POST /auth/otp/initiate */
export interface OtpInitiateResponse {
  challengeId: string;
  deliveryMethod: 'EMAIL' | 'SMS' | 'TOTP';
  expiresAt: string;
  resendAvailableAt: string;
}

export interface Session {
  id: string;
  userAgent: string;
  ip: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}
