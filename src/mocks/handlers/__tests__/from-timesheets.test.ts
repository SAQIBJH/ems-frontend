import { describe, it, expect } from 'vitest';

import {
  applyTimesheetInputs,
  type ApprovedTimesheetForImport,
  type TimesheetImportConfig,
} from '@/modules/payroll/utils/timesheetInputs.utils';
import type { PayrollInput } from '@/modules/payroll/types/payroll.types';

const PERIOD = '2026-05';

function makeInput(overrides: Partial<PayrollInput> = {}): PayrollInput {
  return {
    employeeId: 'emp-001',
    employeeCode: 'E0001',
    employeeName: 'Aman Kumar',
    lopDays: 0,
    leaveDays: 0,
    otHours: 0,
    shiftHours: 0,
    onCallHours: 0,
    variablePay: {},
    oneTime: [],
    ...overrides,
  };
}

function approvedWeek(over: Partial<ApprovedTimesheetForImport> = {}): ApprovedTimesheetForImport {
  return {
    employeeId: 'emp-001',
    employeeName: 'Aman Kumar',
    weekStart: '2026-05-18',
    status: 'APPROVED',
    totalHours: 46,
    overtimeHours: 6,
    standardHours: 40,
    ...over,
  };
}

const FLAG: TimesheetImportConfig = { unloggedHoursPolicy: 'FLAG', standardWeeklyHours: 40 };
const DEDUCT: TimesheetImportConfig = { unloggedHoursPolicy: 'DEDUCT', standardWeeklyHours: 40 };

describe('applyTimesheetInputs', () => {
  it('maps approved overtime to otHours and leaves LOP untouched (FLAG policy)', () => {
    const inputs = { 'emp-001': makeInput({ lopDays: 2 }) }; // 2 leave-driven LOP days
    const result = applyTimesheetInputs([approvedWeek()], inputs, FLAG, PERIOD, true);

    expect(result.updated).toBe(1);
    expect(inputs['emp-001'].otHours).toBe(6);
    expect(inputs['emp-001'].lopDays).toBe(2); // leave LOP preserved, no shortfall added
    expect(result.items[0]).toMatchObject({ employeeId: 'emp-001', otHours: 6, lopDaysAdded: 0 });
  });

  it('adds the standard-hours shortfall to lopDays only when policy is DEDUCT', () => {
    // 30 of 40 hours → 10h shortfall → 10 / (40/5) = 1.25 days.
    const ts = approvedWeek({ totalHours: 30, overtimeHours: 0 });

    const flagged = { 'emp-001': makeInput({ lopDays: 2 }) };
    applyTimesheetInputs([ts], flagged, FLAG, PERIOD, true);
    expect(flagged['emp-001'].lopDays).toBe(2); // FLAG → shortfall is a flag only

    const deducted = { 'emp-001': makeInput({ lopDays: 2 }) };
    const result = applyTimesheetInputs([ts], deducted, DEDUCT, PERIOD, true);
    expect(deducted['emp-001'].lopDays).toBe(3.25); // 2 leave LOP + 1.25 shortfall
    expect(result.items[0].lopDaysAdded).toBe(1.25);
  });

  it('never edits a run that is not DRAFT/REVIEW (e.g. PAID)', () => {
    const inputs = { 'emp-001': makeInput({ lopDays: 2, otHours: 0 }) };
    const result = applyTimesheetInputs([approvedWeek()], inputs, DEDUCT, PERIOD, false);

    expect(result).toEqual({ updated: 0, items: [] });
    expect(inputs['emp-001'].otHours).toBe(0); // untouched
    expect(inputs['emp-001'].lopDays).toBe(2);
  });

  it('ignores non-approved or out-of-period timesheets', () => {
    const inputs = { 'emp-001': makeInput() };
    const result = applyTimesheetInputs(
      [
        approvedWeek({ status: 'SUBMITTED' }), // not approved
        approvedWeek({ weekStart: '2026-06-15' }), // outside the May period
      ],
      inputs,
      FLAG,
      PERIOD,
      true,
    );

    expect(result.updated).toBe(0);
    expect(inputs['emp-001'].otHours).toBe(0);
  });

  it('skips employees who are not part of the run', () => {
    const inputs = { 'emp-001': makeInput() };
    const result = applyTimesheetInputs(
      [approvedWeek({ employeeId: 'emp-999', employeeName: 'Ghost' })],
      inputs,
      FLAG,
      PERIOD,
      true,
    );

    expect(result.updated).toBe(0);
    expect(inputs['emp-001'].otHours).toBe(0);
  });

  it('aggregates overtime across multiple approved weeks in the period', () => {
    const inputs = { 'emp-001': makeInput() };
    const result = applyTimesheetInputs(
      [
        approvedWeek({ weekStart: '2026-05-04', overtimeHours: 4 }),
        approvedWeek({ weekStart: '2026-05-18', overtimeHours: 6 }),
      ],
      inputs,
      FLAG,
      PERIOD,
      true,
    );

    expect(result.updated).toBe(1);
    expect(inputs['emp-001'].otHours).toBe(10);
  });
});
