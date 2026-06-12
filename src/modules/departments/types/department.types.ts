export interface DepartmentHeadEmployee {
  id: string;
  firstName: string;
  lastName: string;
  /** Omitted by GET /departments (tree); present on some detail responses. */
  designation?: string;
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
  /** Convenience head-name fields (null when no head set). */
  headEmployeeFirstName?: string | null;
  headEmployeeLastName?: string | null;
  headEmployeeName?: string | null;
  /**
   * INCLUSIVE subtree headcount: this department + all descendants, excluding
   * soft-deleted. This is the value to show on cards, badges, and the tree
   * (fixed on backend 2026-06-13). Use `directEmployeeCount` for direct-only.
   */
  _count: { employees: number };
  /** Direct-only headcount: employees assigned exactly to this department. */
  directEmployeeCount?: number;
  children: Department[];
}

export interface DepartmentCreateInput {
  name: string;
  departmentCode: string;
  parentId?: string | null;
  headEmployeeId?: string | null;
  headEmployeeFirstName?: string | null;
  headEmployeeLastName?: string | null;
}

export type DepartmentUpdateInput = Partial<DepartmentCreateInput>;

export interface DepartmentDeleteResult {
  id: string;
  status: 'archived';
}

/**
 * One row from GET /departments/:id/employees.
 * For a PARENT department this list is subtree-aware — it includes employees
 * from child/grandchild departments too — so each row carries the employee's
 * actual `department` for disambiguation.
 */
export interface DepartmentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  employmentStatus: string;
  department?: { id: string; name: string } | null;
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

/** Body for POST /departments/:id/members */
export interface AddMembersInput {
  employeeIds: string[];
}

/**
 * POST /departments/:id/members → 200
 * Idempotent: employees already in the dept are counted in `skipped`, not `added`.
 * The server sets each employee's departmentId to the full root→leaf path ending at :id.
 */
export interface AddMembersResult {
  id: string;
  added: number;
  skipped: number;
  employeeIds: string[];
  _count: { employees: number };
}
