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
