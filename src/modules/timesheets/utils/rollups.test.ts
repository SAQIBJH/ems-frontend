import { describe, it, expect } from 'vitest';

import {
  getWeekStart,
  getWeekDays,
  getWeekEnd,
  shiftWeek,
  sumHours,
  sumBillableHours,
  overtimeHours,
  rollupByDay,
  rollupRows,
} from './rollups';
import type { TimeEntry } from '../types/timesheet.types';

function entry(over: Partial<TimeEntry>): TimeEntry {
  return {
    id: 'te-x',
    timesheetId: 'ts-1',
    employeeId: 'emp-001',
    projectId: 'prj-1',
    taskId: 'tsk-1',
    date: '2026-06-08',
    hours: 8,
    billable: true,
    note: '',
    source: 'MANUAL',
    ...over,
  };
}

describe('getWeekStart', () => {
  it('returns the Monday of the week (Wed → Mon)', () => {
    expect(getWeekStart('2026-06-10')).toBe('2026-06-08');
  });
  it('is idempotent when given a Monday', () => {
    expect(getWeekStart('2026-06-08')).toBe('2026-06-08');
  });
  it('treats Sunday as the last day of the week, not the first', () => {
    expect(getWeekStart('2026-06-07')).toBe('2026-06-01');
  });
});

describe('getWeekDays / getWeekEnd / shiftWeek', () => {
  it('lists Mon→Sun', () => {
    expect(getWeekDays('2026-06-08')).toEqual([
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
      '2026-06-13',
      '2026-06-14',
    ]);
  });
  it('weekEnd is the Sunday', () => {
    expect(getWeekEnd('2026-06-08')).toBe('2026-06-14');
  });
  it('shifts whole weeks both directions', () => {
    expect(shiftWeek('2026-06-08', 1)).toBe('2026-06-15');
    expect(shiftWeek('2026-06-08', -1)).toBe('2026-06-01');
    expect(shiftWeek('2026-06-08', 0)).toBe('2026-06-08');
  });
});

describe('sumHours / sumBillableHours', () => {
  it('sums all hours and keeps decimals clean', () => {
    const entries = [entry({ hours: 7.1 }), entry({ hours: 0.2 }), entry({ hours: 1.5 })];
    expect(sumHours(entries)).toBe(8.8);
  });
  it('sums only billable entries', () => {
    const entries = [
      entry({ hours: 6, billable: true }),
      entry({ hours: 2, billable: false }),
      entry({ hours: 1.5, billable: true }),
    ];
    expect(sumBillableHours(entries)).toBe(7.5);
  });
  it('returns 0 for an empty week', () => {
    expect(sumHours([])).toBe(0);
    expect(sumBillableHours([])).toBe(0);
  });
});

describe('overtimeHours', () => {
  it('is the excess over standard hours', () => {
    expect(overtimeHours(45, 40)).toBe(5);
  });
  it('never goes negative when under standard', () => {
    expect(overtimeHours(32, 40)).toBe(0);
  });
  it('is 0 exactly at standard', () => {
    expect(overtimeHours(40, 40)).toBe(0);
  });
});

describe('rollupByDay', () => {
  it('aggregates hours per calendar day', () => {
    const entries = [
      entry({ date: '2026-06-08', hours: 4 }),
      entry({ date: '2026-06-08', hours: 3.5 }),
      entry({ date: '2026-06-09', hours: 8 }),
    ];
    expect(rollupByDay(entries)).toEqual({ '2026-06-08': 7.5, '2026-06-09': 8 });
  });
});

describe('rollupRows', () => {
  it('groups by project+task with per-day hours and totals', () => {
    const entries = [
      entry({ id: 'a', projectId: 'prj-1', taskId: 'tsk-1', date: '2026-06-08', hours: 4 }),
      entry({ id: 'b', projectId: 'prj-1', taskId: 'tsk-1', date: '2026-06-09', hours: 5 }),
      entry({
        id: 'c',
        projectId: 'prj-2',
        taskId: 'tsk-4',
        date: '2026-06-08',
        hours: 2,
        billable: false,
      }),
    ];
    const rows = rollupRows(entries);
    expect(rows).toHaveLength(2);

    const r1 = rows.find((r) => r.projectId === 'prj-1' && r.taskId === 'tsk-1')!;
    expect(r1.total).toBe(9);
    expect(r1.byDay).toEqual({ '2026-06-08': 4, '2026-06-09': 5 });
    expect(r1.billable).toBe(true);
    expect(r1.entryByDay['2026-06-08']?.id).toBe('a');

    const r2 = rows.find((r) => r.projectId === 'prj-2')!;
    expect(r2.total).toBe(2);
    expect(r2.billable).toBe(false);
  });
});
