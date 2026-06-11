import type { Department } from '../types/department.types';

/** Flatten a server-returned nested tree into a single sorted array for use in selects. */
export function flattenDepartmentTree(departments: Department[]): Department[] {
  const result: Department[] = [];
  for (const dept of departments) {
    result.push(dept);
    if (dept.children.length > 0) {
      result.push(...flattenDepartmentTree(dept.children));
    }
  }
  return result;
}

/**
 * Return the path of departments from a root down to the node with `id` (inclusive),
 * e.g. [Engineering, Frontend, Web] for a deeply nested id. Empty array if not found.
 * Used to drive the cascading department → sub-department selects.
 */
export function findDepartmentPath(departments: Department[], id: string | null): Department[] {
  if (!id) return [];
  for (const dept of departments) {
    if (dept.id === id) return [dept];
    const childPath = findDepartmentPath(dept.children, id);
    if (childPath.length > 0) return [dept, ...childPath];
  }
  return [];
}

/** Recursively find a department by id in the nested tree. */
export function findDepartmentById(
  departments: Department[],
  id: string | null,
): Department | undefined {
  if (!id) return undefined;
  for (const dept of departments) {
    if (dept.id === id) return dept;
    const found = findDepartmentById(dept.children, id);
    if (found) return found;
  }
  return undefined;
}
