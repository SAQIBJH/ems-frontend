export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type EmploymentStatus = 'ACTIVE' | 'TERMINATED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MemberType = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'AUDITOR';

export interface EmployeeDeptRef {
  id: string;
  name: string;
}

export interface EmployeeManagerRef {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

export interface EmployeeUserRef {
  email: string;
  memberType: MemberType;
  status: string;
  mfaEnabled?: boolean;
}

export interface LeaveBalance {
  leaveTypeId: string;
  balance: number;
  used: number;
  pending: number;
  leaveType: { name: string; code: string };
}

export type DocumentType =
  | 'ID_PROOF'
  | 'OFFER_LETTER'
  | 'CONTRACT'
  | 'AADHAAR'
  | 'PAN'
  | 'BANK'
  | 'OTHER';

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface EmployeeDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  verificationStatus: DocumentVerificationStatus;
  createdAt: string;
}

/** Shape returned by GET /employees (list items). All dates are ISO strings from the server. */
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  designation: string;
  departmentId: string;
  managerId: string | null;
  joinedOn: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  location: string | null;
  payCurrency: string | null;
  /** Single ref today; an ordered path array root→leaf once sub-departments ship.
   *  Read via resolveDepartmentRef() (utils/employee-department) to get the deepest. */
  department: EmployeeDeptRef | EmployeeDeptRef[] | null;
  manager: EmployeeManagerRef | null;
  user: EmployeeUserRef | null;
}

/** Shape returned by GET /employees/:id — adds leaveBalances and documents.
 * Both are omitted by the live API for freshly-created employees (verified
 * live), so they are optional — consumers must default to `[]`. */
export interface EmployeeDetail extends Employee {
  leaveBalances?: LeaveBalance[];
  documents?: EmployeeDocument[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * The double-nested payload from GET /employees.
 * Outer envelope: { success, data: EmployeesPage }
 * Inner shape:    { data: Employee[], pagination: Pagination }
 */
export interface EmployeesPage {
  data: Employee[];
  pagination: Pagination;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: EmploymentStatus;
  location?: string;
}

/** Input for POST /employees and PATCH /employees/:id. Dates must be YYYY-MM-DD. */
export interface EmployeeCreateInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeCode: string;
  employmentType: EmploymentType;
  joinedOn: string;
  designation: string;
  departmentId: string;
  managerId?: string;
  phone?: string;
  location?: string;
  gender?: Gender;
  dateOfBirth?: string;
  personalEmail?: string;
  address?: string;
}

export type EmployeeUpdateInput = Partial<EmployeeCreateInput>;

export interface EmployeeDeleteResult {
  id: string;
  status: 'TERMINATED';
}

export interface BulkDeactivateFailure {
  id: string;
  code: string;
  message: string;
}

export interface BulkDeactivateResult {
  succeeded: string[];
  failed: BulkDeactivateFailure[];
}

export interface BulkExportResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
}
