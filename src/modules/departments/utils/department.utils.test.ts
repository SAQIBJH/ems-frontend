import { describe, it, expect } from 'vitest';
import { findDepartmentPath } from './department.utils';
import type { Department } from '../types/department.types';

function dept(id: string, children: Department[] = []): Department {
  return {
    id,
    parentId: null,
    name: id,
    departmentCode: id,
    headEmployeeId: null,
    depth: 0,
    headEmployee: null,
    _count: { employees: 0 },
    children,
  };
}

// eng ─ fe ─ web
//     └ be
// sales
const tree: Department[] = [dept('eng', [dept('fe', [dept('web')]), dept('be')]), dept('sales')];

describe('findDepartmentPath', () => {
  it('returns [] for a null or unknown id', () => {
    expect(findDepartmentPath(tree, null)).toEqual([]);
    expect(findDepartmentPath(tree, 'nope')).toEqual([]);
  });

  it('finds a root department', () => {
    expect(findDepartmentPath(tree, 'eng').map((d) => d.id)).toEqual(['eng']);
    expect(findDepartmentPath(tree, 'sales').map((d) => d.id)).toEqual(['sales']);
  });

  it('finds a mid-level child', () => {
    expect(findDepartmentPath(tree, 'be').map((d) => d.id)).toEqual(['eng', 'be']);
  });

  it('finds a deeply nested leaf, root → leaf', () => {
    expect(findDepartmentPath(tree, 'web').map((d) => d.id)).toEqual(['eng', 'fe', 'web']);
  });
});
