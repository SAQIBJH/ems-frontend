import { findDepartmentPath, type Department } from '@/modules/departments';
import type { EmployeeDeptRef } from '../types/employee.types';

/**
 * Convert a single (leaf) department id into the ordered path array
 * [rootId, …, leafId] that the API expects for `departmentId`. Returns [] if the id
 * isn't found in the tree (the form requires a department, so a valid submit never
 * sends []).
 */
export function toDepartmentIdPath(tree: Department[], leafId: string): string[] {
  return findDepartmentPath(tree, leafId).map((d) => d.id);
}

/**
 * The employee `department` field may be a single ref (current API) or an ordered
 * path array root → leaf (after sub-department support ships). The employee always
 * belongs to the most-specific (last) department — return that ref, or null.
 *
 * Backward-compatible by design: works whether the backend sends `{id,name}`,
 * `[{id,name}, ...]`, `[]`, or null.
 */
export function resolveDepartmentRef(
  department: EmployeeDeptRef | EmployeeDeptRef[] | null | undefined,
): EmployeeDeptRef | null {
  if (!department) return null;
  if (Array.isArray(department)) return department[department.length - 1] ?? null;
  return department;
}
