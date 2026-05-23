// Components
export { EmployeeTable } from './components/EmployeeTable';
export { EmployeeProfile } from './components/EmployeeProfile';

// Constants
export { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS, KNOWN_DEPARTMENTS } from './constants';

// Types
export type {
  Employee,
  EmployeeDetail,
  EmployeesPage,
  EmployeeListParams,
  EmployeeCreateInput,
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
} from './types/employee.types';

// Schemas
export { employeeCreateSchema, employeeUpdateSchema } from './validations/employee.schema';
export type {
  EmployeeCreateFormValues,
  EmployeeUpdateFormValues,
} from './validations/employee.schema';

// Service
export { employeesApi } from './services/employees.api';

// Hooks
export { useEmployees } from './hooks/useEmployees';
export { useEmployee } from './hooks/useEmployee';
export {
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from './hooks/useEmployeeMutations';
