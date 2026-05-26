export interface DepartmentHeadEmployee {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

/** Shape returned by GET /departments (recursive tree, server-built). */
export interface Department {
  id: string;
  parentId: string | null;
  name: string;
  departmentCode: string;
  headEmployeeId: string | null;
  depth: number;
  headEmployee: DepartmentHeadEmployee | null;
  _count: { employees: number };
  children: Department[];
}

export interface DepartmentCreateInput {
  name: string;
  departmentCode: string;
  parentId?: string | null;
}

export type DepartmentUpdateInput = Partial<DepartmentCreateInput>;

export interface DepartmentDeleteResult {
  id: string;
  status: 'archived';
}

/** One row from GET /departments/:id/employees */
export interface DepartmentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  employmentStatus: string;
}

/** GET /departments/:id/employees — data is double-nested */
export interface DepartmentEmployeesResponse {
  data: DepartmentEmployee[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/** POST /departments/:id/reassign-and-delete */
export interface ReassignAndDeleteResult {
  id: string;
  status: 'archived';
  reassignedEmployees: number;
}
