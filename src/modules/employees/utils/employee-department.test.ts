import { describe, it, expect } from 'vitest';
import type { Department } from '@/modules/departments';
import { resolveDepartmentRef, toDepartmentIdPath } from './employee-department';

const eng = { id: 'eng', name: 'Engineering' };
const backend = { id: 'be', name: 'Backend Engineering' };

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
const tree: Department[] = [dept('eng', [dept('be', [dept('platform')])]), dept('sales')];

describe('resolveDepartmentRef', () => {
  it('returns null for null/undefined', () => {
    expect(resolveDepartmentRef(null)).toBeNull();
    expect(resolveDepartmentRef(undefined)).toBeNull();
  });

  it('returns the object unchanged when given a single ref (current API)', () => {
    expect(resolveDepartmentRef(backend)).toEqual(backend);
  });

  it('returns the LAST (most-specific) ref when given a path array', () => {
    expect(resolveDepartmentRef([eng, backend])).toEqual(backend);
  });

  it('returns the only element for a single-element array', () => {
    expect(resolveDepartmentRef([backend])).toEqual(backend);
  });

  it('returns null for an empty array', () => {
    expect(resolveDepartmentRef([])).toBeNull();
  });
});

describe('toDepartmentIdPath', () => {
  it('returns a single-element path for a root department', () => {
    expect(toDepartmentIdPath(tree, 'sales')).toEqual(['sales']);
  });

  it('returns the full root → leaf path for a nested department', () => {
    expect(toDepartmentIdPath(tree, 'platform')).toEqual(['eng', 'be', 'platform']);
    expect(toDepartmentIdPath(tree, 'be')).toEqual(['eng', 'be']);
  });

  it('returns [] for an unknown or empty id', () => {
    expect(toDepartmentIdPath(tree, 'nope')).toEqual([]);
    expect(toDepartmentIdPath(tree, '')).toEqual([]);
  });
});
