import { http, HttpResponse } from 'msw';
import { EMPLOYEE_FIXTURES } from '../data/employees';
import type { SearchResult } from '@/modules/search/types/search.types';

const DEPT_FIXTURES = [
  { id: 'dept-001', name: 'Engineering', headCount: 12 },
  { id: 'dept-002', name: 'HR', headCount: 5 },
  { id: 'dept-003', name: 'Sales', headCount: 8 },
  { id: 'dept-004', name: 'Finance', headCount: 6 },
  { id: 'dept-005', name: 'Customer Success', headCount: 4 },
  { id: 'dept-006', name: 'Marketing', headCount: 7 },
  { id: 'dept-007', name: 'Operations', headCount: 3 },
];

export const searchHandlers = [
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit')) || 8));

    if (!q || q.length < 2) {
      return HttpResponse.json({
        success: true,
        data: { results: [], groupedCounts: {} },
        meta: {},
      });
    }

    const results: SearchResult[] = [];

    // Employee matches
    const empMatches = EMPLOYEE_FIXTURES.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.workEmail.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q),
    );
    for (const e of empMatches) {
      results.push({
        type: 'employee',
        id: e.id,
        label: `${e.firstName} ${e.lastName}`,
        sublabel: `${e.designation} · ${e.department?.name ?? ''}`,
        url: `/employees/${e.id}`,
      });
    }

    // Department matches
    const deptMatches = DEPT_FIXTURES.filter((d) => d.name.toLowerCase().includes(q));
    for (const d of deptMatches) {
      results.push({
        type: 'department',
        id: d.id,
        label: d.name,
        sublabel: `${d.headCount} employees`,
        url: `/departments?id=${d.id}`,
      });
    }

    const sliced = results.slice(0, limit);

    const groupedCounts = sliced.reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return HttpResponse.json({
      success: true,
      data: { results: sliced, groupedCounts },
      meta: {},
    });
  }),
];
