// Components
export { EmployeeTable } from './components/EmployeeTable';
export { EmployeeProfile } from './components/EmployeeProfile';
export { EmployeeForm } from './components/EmployeeForm';
export { EmployeeFormStepper } from './components/EmployeeFormStepper';
export { StatusBadge as EmploymentStatusBadge } from './components/StatusBadge';

// Constants
export { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS } from './constants';

// Types
export type {
  Employee,
  EmployeeDetail,
  EmployeesPage,
  EmployeeListParams,
  EmployeeCreateInput,
  EmployeeInviteResult,
  EmployeeUpdateInput,
  EmployeeDeleteResult,
  EmploymentType,
  EmploymentStatus,
  Gender,
  MemberType,
  Pagination,
  LeaveBalance,
  EmployeeDeptRef,
  EmployeeManagerRef,
  EmployeeUserRef,
  EmployeeDocument,
  DocumentType,
  DocumentVerificationStatus,
  PhotoUploadResult,
} from './types/employee.types';

// Schemas
export { employeeCreateSchema, employeeUpdateSchema } from './validations/employee.schema';
export type {
  EmployeeCreateFormValues,
  EmployeeUpdateFormValues,
} from './validations/employee.schema';

// Service
export { employeesApi } from './services/employees.api';
export { documentsApi } from './services/documents.api';
export { photoApi } from './services/photo.api';

// Hooks
export { useEmployees } from './hooks/useEmployees';
export { useEmployee } from './hooks/useEmployee';
export {
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useInviteEmployee,
} from './hooks/useEmployeeMutations';
export { useEmployeeDocuments, useUploadDocument, useRemoveDocument } from './hooks/useDocuments';
export { useUploadPhoto, useDeletePhoto } from './hooks/usePhoto';
