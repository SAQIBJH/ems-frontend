import { describe, it, expect } from 'vitest';
import type { Department } from '@/modules/departments';
import { buildDepartmentLevels } from './DepartmentCascade';

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

// eng ─ be ─ platform
//     └ fe
// sales (no children)
const tree: Department[] = [
  dept('eng', [dept('be', [dept('platform')]), dept('fe')]),
  dept('sales'),
];

describe('buildDepartmentLevels', () => {
  it('shows only the roots when nothing is selected', () => {
    const levels = buildDepartmentLevels(tree, '');
    expect(levels).toHaveLength(1);
    expect(levels[0].value).toBe('');
    expect(levels[0].options.map((d) => d.id)).toEqual(['eng', 'sales']);
  });

  it('shows a single level for a childless root', () => {
    const levels = buildDepartmentLevels(tree, 'sales');
    expect(levels.map((l) => l.value)).toEqual(['sales']);
  });

  it('returns just the filled path for a parent with children (no trailing empty)', () => {
    const levels = buildDepartmentLevels(tree, 'eng');
    expect(levels.map((l) => l.value)).toEqual(['eng']);
    expect(levels[0].options.map((d) => d.id)).toEqual(['eng', 'sales']);
  });

  it('expands the full chain for a deeply nested leaf (edit prefill)', () => {
    const levels = buildDepartmentLevels(tree, 'platform');
    expect(levels.map((l) => l.value)).toEqual(['eng', 'be', 'platform']);
    // Each level's options are the previous level's children.
    expect(levels[1].options.map((d) => d.id)).toEqual(['be', 'fe']);
    expect(levels[2].options.map((d) => d.id)).toEqual(['platform']);
  });

  it('returns the filled path up to a mid-level dept (no trailing empty)', () => {
    const levels = buildDepartmentLevels(tree, 'be');
    expect(levels.map((l) => l.value)).toEqual(['eng', 'be']);
  });
});
