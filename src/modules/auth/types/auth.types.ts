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

/** Tenant block returned by POST /auth/register. country/currency/timezone are
 *  captured later in Settings → Company Profile, so they come back null at signup. */
export interface Tenant {
  id: string;
  name: string;
  country: string | null;
  currency: string | null;
  timezone: string | null;
}

/** Shape of POST /auth/register data payload — mirrors LoginResponse + the new tenant.
 *  See docs/BACKEND_API_REQUESTS.md §3. */
export interface RegisterResponse extends LoginResponse {
  tenant: Tenant;
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

/** Shape from GET /auth/sessions — all camelCase per auth domain (API_MAPPING.md). */
export interface Session {
  id: string;
  deviceName: string | null;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isRevoked: boolean;
}
