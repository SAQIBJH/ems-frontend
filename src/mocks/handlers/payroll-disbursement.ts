import { http, HttpResponse } from 'msw';
import type {
  PaymentBatch,
  PaymentBatchLine,
  PayoutStatus,
} from '@/modules/payroll/types/payroll.types';
import { computeRun } from '../data/payroll-engine';
import { buildBankFile, isBankFileFormat, type BankFileRowInput } from '../data/bank-file-formats';
import { getRunMeta, isPayslipHeld } from './payroll-runs';
import { getRunInputs } from './payroll-inputs';
import { getClaimsForRun } from './payroll-claims';
import { emitPayrollEvent } from './payroll-events';

/* ── In-memory payment-batch store ─────────────────────────────────────────── */

// One batch per run id (the latest generated). Reconciliation mutates it in place.
const batchesByRun: Record<string, PaymentBatch> = {};
const batchesById: Record<string, PaymentBatch> = {};
let batchCounter = 0;

/** Recompute the run's payslips → payout lines (deterministic, same inputs same numbers). */
function buildLines(runId: string, period: string): PaymentBatchLine[] {
  const computed = computeRun(
    runId,
    period,
    'PENDING',
    getRunInputs(runId),
    getClaimsForRun(runId),
  );
  return (
    computed.items
      // Held payslips are withheld from disbursement until released.
      .filter((item) => !isPayslipHeld(item.id))
      .map((item) => ({
        payslipId: item.id,
        employeeId: item.employeeId,
        employeeCode: item.employeeCode,
        employeeName: item.employeeName,
        amount: item.netPay,
        currency: item.currency,
        status: 'PENDING' as PayoutStatus,
        failureReason: null,
        payoutRef: null,
      }))
  );
}

/**
 * Advance the payout lifecycle one step, simulating the bank/gateway callback:
 *   PENDING → PROCESSING (all lines)         → batch PROCESSING
 *   PROCESSING → PAID | FAILED | RETURNED    → batch COMPLETED
 * Final statuses are assigned deterministically so the UI exercises every state.
 */
function reconcileBatch(batch: PaymentBatch): void {
  const now = new Date().toISOString();
  if (batch.status === 'PENDING') {
    batch.lines = batch.lines.map((l) => ({ ...l, status: 'PROCESSING' }));
    batch.status = 'PROCESSING';
  } else if (batch.status === 'PROCESSING') {
    batch.lines = batch.lines.map((l, i) => {
      if (i === 1) {
        return { ...l, status: 'FAILED', failureReason: 'Bank account frozen', payoutRef: null };
      }
      if (i === 3) {
        return {
          ...l,
          status: 'RETURNED',
          failureReason: 'Invalid account number',
          payoutRef: null,
        };
      }
      return {
        ...l,
        status: 'PAID',
        failureReason: null,
        payoutRef: `UTR/${batch.id}/${l.employeeCode}`,
      };
    });
    batch.status = 'COMPLETED';
  }
  batch.reconciledAt = now;
}

export const payrollDisbursementHandlers = [
  // Latest payout batch for a run (null before one is generated).
  http.get('/api/payroll/runs/:id/payment-batch', ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json({ success: true, data: batchesByRun[id] ?? null });
  }),

  // Generate a payout batch from an approved/paid run's payslips.
  http.post('/api/payroll/runs/:id/payment-batch', ({ params }) => {
    const { id } = params as { id: string };
    const meta = getRunMeta(id);
    if (!meta) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    if (meta.status !== 'APPROVED' && meta.status !== 'PAID') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'RUN_NOT_PAYABLE',
            message: 'Only an approved run can be disbursed',
          },
        },
        { status: 422 },
      );
    }
    const lines = buildLines(id, meta.period);
    const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
    const batch: PaymentBatch = {
      id: `batch-${++batchCounter}`,
      runId: id,
      count: lines.length,
      totalAmount,
      currency: lines[0]?.currency ?? 'INR',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reconciledAt: null,
      lines,
    };
    batchesByRun[id] = batch;
    batchesById[batch.id] = batch;
    return HttpResponse.json({ success: true, data: batch }, { status: 201 });
  }),

  // Generate the country bank file from a config-driven format spec.
  http.get('/api/payroll/runs/:id/bank-file', ({ params, request }) => {
    const { id } = params as { id: string };
    const format = new URL(request.url).searchParams.get('format') ?? '';
    if (!isBankFileFormat(format)) {
      return HttpResponse.json(
        { success: false, error: { code: 'UNKNOWN_FORMAT', message: 'Unknown bank-file format' } },
        { status: 422 },
      );
    }
    const meta = getRunMeta(id);
    if (!meta) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } },
        { status: 404 },
      );
    }
    // Prefer the generated batch's lines; otherwise derive straight from the run.
    const lines = batchesByRun[id]?.lines ?? buildLines(id, meta.period);
    const rows: BankFileRowInput[] = lines.map((l) => ({
      employeeCode: l.employeeCode,
      employeeName: l.employeeName,
      amount: l.amount,
      currency: l.currency,
      reference: `PAY/${meta.period}/${l.employeeCode}`,
    }));
    const file = buildBankFile(format, rows);
    return new HttpResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="bank-file-${meta.period}-${format}.txt"`,
      },
    });
  }),

  // Per-payslip payout statuses for a batch.
  http.get('/api/payroll/payment-batches/:batchId/status', ({ params }) => {
    const { batchId } = params as { batchId: string };
    const batch = batchesById[batchId];
    if (!batch) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: batch });
  }),

  // Reconcile from the (mock) bank/gateway — advance the lifecycle one step.
  http.post('/api/payroll/payment-batches/:batchId/reconcile', ({ params }) => {
    const { batchId } = params as { batchId: string };
    const batch = batchesById[batchId];
    if (!batch) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } },
        { status: 404 },
      );
    }
    reconcileBatch(batch);
    const failed = batch.lines.filter((l) => l.status === 'FAILED' || l.status === 'RETURNED');
    if (failed.length > 0) {
      emitPayrollEvent(
        'payment.failed',
        batch.runId,
        `${failed.length} payout${failed.length === 1 ? '' : 's'} failed or returned`,
      );
    }
    return HttpResponse.json({ success: true, data: batch });
  }),
];
