import { describe, it, expect } from 'vitest';
import { resolveDepartmentRef } from './employee-department';

const eng = { id: 'eng', name: 'Engineering' };
const backend = { id: 'be', name: 'Backend Engineering' };

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
