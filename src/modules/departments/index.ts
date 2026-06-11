// Components
export { DepartmentTree } from './components/DepartmentTree';
export { DepartmentForm } from './components/DepartmentForm';

// Types
export type {
  Department,
  DepartmentHeadEmployee,
  DepartmentCreateInput,
  DepartmentUpdateInput,
  DepartmentDeleteResult,
} from './types/department.types';

// Schemas
export { departmentCreateSchema, departmentUpdateSchema } from './validations/department.schema';
export type {
  DepartmentCreateFormValues,
  DepartmentUpdateFormValues,
} from './validations/department.schema';

// Service
export { departmentsApi } from './services/departments.api';

// Hooks
export { useDepartments } from './hooks/useDepartments';
export {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from './hooks/useDepartmentMutations';

// Utils
export {
  flattenDepartmentTree,
  findDepartmentById,
  findDepartmentPath,
} from './utils/department.utils';
