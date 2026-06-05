import { http, HttpResponse } from 'msw';
import type { PayrollInput, PayrollInputImportResult } from '@/modules/payroll/types/payroll.types';
import { getRosterInputSeed } from '../data/payroll-engine';
import { getRunMeta } from './payroll-runs';

// Per-run input store: runId → (employeeId → PayrollInput). Lazily seeded from the
// roster defaults, whose LOP comes from attendance. The run engine reads these so
// edits flow through to the calculated payslips.
const inputsByRun: Record<string, Record<string, PayrollInput>> = {};

export function getRunInputs(runId: string): Record<string, PayrollInput> {
  if (!inputsByRun[runId]) {
    const map: Record<string, PayrollInput> = {};
    for (const seed of getRosterInputSeed()) {
      map[seed.employeeId] = {
        ...seed,
        variablePay: { ...seed.variablePay },
        oneTime: [...seed.oneTime],
      };
    }
    inputsByRun[runId] = map;
  }
  return inputsByRun[runId];
}

function parseInputsCsv(
  csv: string,
  inputs: Record<string, PayrollInput>,
): PayrollInputImportResult {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const errors: string[] = [];
  if (lines.length < 2) return { updated: 0, skipped: 0, errors: ['No data rows found'] };

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const codeIdx = header.indexOf('employeecode');
  const lopIdx = header.indexOf('lopdays');
  const otIdx = header.indexOf('othours');
  const leaveIdx = header.indexOf('leavedays');
  if (codeIdx === -1) return { updated: 0, skipped: 0, errors: ['Missing employeeCode column'] };

  const byCode = new Map(Object.values(inputs).map((i) => [i.employeeCode, i]));
  let updated = 0;
  let skipped = 0;
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(',').map((c) => c.trim());
    const target = byCode.get(cols[codeIdx]);
    if (!target) {
      skipped++;
      errors.push(`Row ${r}: unknown employee code "${cols[codeIdx]}"`);
      continue;
    }
    if (lopIdx !== -1 && cols[lopIdx] !== '') target.lopDays = Number(cols[lopIdx]) || 0;
    if (otIdx !== -1 && cols[otIdx] !== '') target.otHours = Number(cols[otIdx]) || 0;
    if (leaveIdx !== -1 && cols[leaveIdx] !== '') target.leaveDays = Number(cols[leaveIdx]) || 0;
    updated++;
  }
  return { updated, skipped, errors };
}

export const payrollInputHandlers = [
  http.get('/api/payroll/runs/:runId/inputs', ({ params }) => {
    const { runId } = params as { runId: string };
    const meta = getRunMeta(runId);
    const inputs = getRunInputs(runId);
    return HttpResponse.json({
      success: true,
      data: {
        runId,
        period: meta?.period ?? null,
        editable: meta?.status === 'DRAFT',
        inputs: Object.values(inputs),
      },
    });
  }),

  http.patch('/api/payroll/runs/:runId/inputs/:employeeId', async ({ params, request }) => {
    const { runId, employeeId } = params as { runId: string; employeeId: string };
    const body = (await request.json()) as Partial<PayrollInput>;
    const inputs = getRunInputs(runId);
    const existing = inputs[employeeId];
    if (!existing) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not in this run' } },
        { status: 404 },
      );
    }
    const updated: PayrollInput = {
      ...existing,
      ...body,
      employeeId: existing.employeeId,
      employeeCode: existing.employeeCode,
      employeeName: existing.employeeName,
    };
    inputs[employeeId] = updated;
    return HttpResponse.json({ success: true, data: updated });
  }),

  // Bulk import of per-period inputs (CSV: employeeCode,lopDays,otHours,leaveDays).
  http.post('/api/payroll/runs/:runId/inputs/import', async ({ params, request }) => {
    const { runId } = params as { runId: string };
    const body = (await request.json()) as { csv?: string };
    const result = parseInputsCsv(body.csv ?? '', getRunInputs(runId));
    return HttpResponse.json({ success: true, data: result });
  }),
];
