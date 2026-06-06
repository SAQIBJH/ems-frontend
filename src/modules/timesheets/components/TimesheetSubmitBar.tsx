'use client';

import { format, parseISO } from 'date-fns';
import { AlertTriangleIcon, CheckCircle2Icon, ClockIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import type { ApiError } from '@/types/api';

import { useSubmitTimesheet } from '../hooks/useTimesheets';
import type { Timesheet } from '../types/timesheet.types';

interface TimesheetSubmitBarProps {
  timesheet: Timesheet;
  week: string;
  employeeId?: string;
  /** Whether the signed-in user may submit this week. */
  canWrite: boolean;
}

function fmtHours(h: number): string {
  return String(h);
}

/**
 * Footer bar for the weekly grid: shows the week total and the submit action when
 * the week is editable, or the decision state (submitted / approved / rejected).
 */
export function TimesheetSubmitBar({
  timesheet,
  week,
  employeeId,
  canWrite,
}: TimesheetSubmitBarProps) {
  const submit = useSubmitTimesheet(week, employeeId);
  const { status, totalHours, billableHours, overtimeHours } = timesheet;
  const editable = status === 'DRAFT' || status === 'REJECTED';
  const empty = totalHours <= 0;
  const synthesized = timesheet.id.startsWith('ts-draft-');

  function handleSubmit() {
    if (empty || synthesized) {
      toast.error('Log some hours before submitting.');
      return;
    }
    submit.mutate(timesheet.id, {
      onSuccess: () => toast.success('Timesheet submitted for approval'),
      onError: (err: unknown) => {
        const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
        toast.error(apiErr?.message ?? 'Failed to submit timesheet');
      },
    });
  }

  return (
    <div className="space-y-3">
      {/* Rejection reason — surfaced so the employee can fix and resubmit. */}
      {status === 'REJECTED' && timesheet.comment && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-danger">Returned for changes</p>
            <p className="text-fg-muted">{timesheet.comment}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="font-medium text-fg">{fmtHours(totalHours)}h total</span>
          <span className="text-fg-muted">{fmtHours(billableHours)}h billable</span>
          {overtimeHours > 0 && (
            <span className="text-warning">{fmtHours(overtimeHours)}h overtime</span>
          )}
        </div>

        {editable ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canWrite || empty || synthesized || submit.isPending}
          >
            <SendIcon className="size-3.5" aria-hidden />
            {submit.isPending ? 'Submitting…' : status === 'REJECTED' ? 'Resubmit' : 'Submit week'}
          </Button>
        ) : status === 'SUBMITTED' ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-info">
            <ClockIcon className="size-4" aria-hidden />
            Awaiting approval
            {timesheet.submittedAt && (
              <span className="text-fg-muted">
                · submitted {format(parseISO(timesheet.submittedAt), 'MMM d')}
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2Icon className="size-4" aria-hidden />
            Approved
            {timesheet.decidedBy && (
              <span className="text-fg-muted">· by {timesheet.decidedBy}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
