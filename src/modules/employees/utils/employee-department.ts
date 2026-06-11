import type { EmployeeDeptRef } from '../types/employee.types';

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
