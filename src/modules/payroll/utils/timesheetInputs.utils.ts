import type { PayrollInput, TimesheetInputResult } from '../types/payroll.types';

/**
 * Map approved timesheets onto a payroll run's per-employee inputs (Step T6 / §27).
 *
 * The integration model is **one source of truth per signal**:
 * - **Overtime raises pay** — each employee's approved `overtimeHours` for weeks in
 *   the run's period is written to `PayrollInput.otHours` (priced later by the OT
 *   component). It is **set**, not added, so re-importing is idempotent.
 * - **Unpaid leave (LOP) stays leave-driven** — this function never touches the
 *   leave-sourced portion of `lopDays`. It only **adds** a timesheet shortfall when
 *   the tenant has opted in via `unloggedHoursPolicy = DEDUCT`.
 * - A shortfall under any other policy is a flag only and changes nothing here.
 *
 * Pure: it mutates the passed `inputs` objects (the caller owns that store) and
 * returns a summary; no I/O, no dates-from-now. Unit-tested in
 * `src/mocks/handlers/__tests__/from-timesheets.test.ts`.
 */

export interface ApprovedTimesheetForImport {
  employeeId: string;
  employeeName: string;
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  /** Only `APPROVED` timesheets are imported. */
  status: string;
  totalHours: number;
  overtimeHours: number;
  standardHours: number;
}

export interface TimesheetImportConfig {
  unloggedHoursPolicy: 'IGNORE' | 'FLAG' | 'DEDUCT';
  standardWeeklyHours: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function applyTimesheetInputs(
  timesheets: ApprovedTimesheetForImport[],
  inputs: Record<string, PayrollInput>,
  config: TimesheetImportConfig,
  /** Run period, YYYY-MM — only timesheets whose week falls in it are imported. */
  period: string,
  /** True only while the run is DRAFT/REVIEW; a PAID/locked run is never edited. */
  runEditable: boolean,
): TimesheetInputResult {
  if (!runEditable) return { updated: 0, items: [] };

  const relevant = timesheets.filter(
    (t) => t.status === 'APPROVED' && t.weekStart.slice(0, 7) === period,
  );

  // Aggregate overtime and shortfall per employee across all their weeks in period.
  const perEmployee = new Map<string, { name: string; ot: number; shortfall: number }>();
  for (const t of relevant) {
    const agg = perEmployee.get(t.employeeId) ?? { name: t.employeeName, ot: 0, shortfall: 0 };
    agg.ot += t.overtimeHours;
    agg.shortfall += Math.max(0, t.standardHours - t.totalHours);
    perEmployee.set(t.employeeId, agg);
  }

  const perDayHours = config.standardWeeklyHours > 0 ? config.standardWeeklyHours / 5 : 8;
  const items: TimesheetInputResult['items'] = [];

  for (const [employeeId, agg] of perEmployee) {
    const target = inputs[employeeId];
    if (!target) continue; // employee not part of this run → skip

    const otHours = round2(agg.ot);
    target.otHours = otHours; // overtime is SET (idempotent)

    let lopDaysAdded = 0;
    if (config.unloggedHoursPolicy === 'DEDUCT' && agg.shortfall > 0) {
      lopDaysAdded = round2(agg.shortfall / perDayHours);
      target.lopDays = round2(target.lopDays + lopDaysAdded); // ADD — leave LOP preserved
    }

    items.push({ employeeId, employeeName: agg.name, otHours, lopDaysAdded });
  }

  return { updated: items.length, items };
}
