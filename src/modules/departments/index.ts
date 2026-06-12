// Components
export { DepartmentTree } from './components/DepartmentTree';
export { DepartmentForm } from './components/DepartmentForm';
export { AddMembersDialog } from './components/AddMembersDialog';

// Types
export type {
  Department,
  DepartmentHeadEmployee,
  DepartmentCreateInput,
  DepartmentUpdateInput,
  DepartmentDeleteResult,
  AddMembersInput,
  AddMembersResult,
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
  useAddDepartmentMembers,
} from './hooks/useDepartmentMutations';

// Utils
export {
  flattenDepartmentTree,
  findDepartmentById,
  findDepartmentPath,
} from './utils/department.utils';
