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
