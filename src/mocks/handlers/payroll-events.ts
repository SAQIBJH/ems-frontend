import { http, HttpResponse } from 'msw';
import type { PayrollEvent, PayrollEventType } from '@/modules/payroll/types/payroll.types';
import { PAYROLL_EVENT_CATALOGUE } from '@/modules/payroll/constants';

/* ── In-memory event log ───────────────────────────────────────────────────── */

// Most-recent-first. Lifecycle handlers append via emitPayrollEvent (cross-handler).
const events: PayrollEvent[] = [];
let eventCounter = 0;

/** Append a lifecycle event — the single emission point shared across handlers. */
export function emitPayrollEvent(
  type: PayrollEventType,
  runId: string | null,
  summary: string,
): void {
  events.unshift({
    id: `evt-${++eventCounter}`,
    type,
    runId,
    at: new Date().toISOString(),
    summary,
  });
}

export const payrollEventHandlers = [
  // The subscribable webhook/notification catalogue (static config).
  http.get('/api/payroll/event-catalogue', () => {
    return HttpResponse.json({ success: true, data: PAYROLL_EVENT_CATALOGUE });
  }),

  // Emitted events, optionally scoped to a run, most-recent first.
  http.get('/api/payroll/events', ({ request }) => {
    const runId = new URL(request.url).searchParams.get('runId');
    const data = runId ? events.filter((e) => e.runId === runId) : events;
    return HttpResponse.json({ success: true, data });
  }),
];
