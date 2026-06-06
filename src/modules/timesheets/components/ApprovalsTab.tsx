'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { CheckIcon, ClipboardCheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import type { ApiError } from '@/types/api';

import {
  useTimesheetApprovals,
  useApproveTimesheet,
  useRejectTimesheet,
} from '../hooks/useTimesheets';
import {
  rejectTimesheetSchema,
  type RejectTimesheetFormValues,
} from '../validations/approval.schema';
import type { Timesheet } from '../types/timesheet.types';

function fmtHours(h: number): string {
  return String(h);
}

function EmployeeCell({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-semibold text-brand">
        {initials}
      </div>
      <span className="text-[13px] font-medium text-fg">{name}</span>
    </div>
  );
}

// ── Reject reason dialog ─────────────────────────────────────────────────────

function RejectDialog({ target, onClose }: { target: Timesheet | null; onClose: () => void }) {
  const reject = useRejectTimesheet();
  const form = useForm<RejectTimesheetFormValues>({
    resolver: zodResolver(rejectTimesheetSchema),
    defaultValues: { comment: '' },
  });

  function onSubmit({ comment }: RejectTimesheetFormValues) {
    if (!target) return;
    reject.mutate(
      { id: target.id, comment },
      {
        onSuccess: () => {
          toast.success('Timesheet returned for changes');
          onClose();
          form.reset();
        },
        onError: (err: unknown) => {
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          toast.error(apiErr?.message ?? 'Failed to reject timesheet');
        },
      },
    );
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Return timesheet</DialogTitle>
          <DialogDescription>
            {target ? `${target.employeeName}'s week will be returned for changes.` : ''} They can
            edit and resubmit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Hours on Wednesday look off…" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={reject.isPending}
                onClick={() => {
                  onClose();
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={reject.isPending}>
                {reject.isPending ? 'Returning…' : 'Return week'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export function ApprovalsTab() {
  const { data: timesheets = [], isLoading, isError, refetch } = useTimesheetApprovals('SUBMITTED');
  const approve = useApproveTimesheet();
  const [rejectTarget, setRejectTarget] = useState<Timesheet | null>(null);

  function handleApprove(ts: Timesheet) {
    approve.mutate(
      { id: ts.id },
      {
        onSuccess: () => toast.success(`${ts.employeeName}'s week approved`),
        onError: (err: unknown) => {
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          toast.error(apiErr?.message ?? 'Failed to approve timesheet');
        },
      },
    );
  }

  const columns: ColumnDef<Timesheet>[] = [
    {
      id: 'employee',
      header: 'Employee',
      cell: ({ row }) => <EmployeeCell name={row.original.employeeName} />,
    },
    {
      id: 'week',
      header: 'Week',
      cell: ({ row }) => (
        <span className="text-[13px] text-fg">
          {format(parseISO(row.original.weekStart), 'MMM d')} –{' '}
          {format(parseISO(row.original.weekEnd), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      id: 'hours',
      header: 'Hours',
      cell: ({ row }) => {
        const ts = row.original;
        return (
          <div>
            <p className="text-[13px] font-medium text-fg">{fmtHours(ts.totalHours)}h</p>
            <p className="text-[11px] text-fg-muted">
              {fmtHours(ts.billableHours)}h billable
              {ts.overtimeHours > 0 ? ` · ${fmtHours(ts.overtimeHours)}h OT` : ''}
            </p>
          </div>
        );
      },
    },
    {
      id: 'submitted',
      header: 'Submitted',
      cell: ({ row }) => (
        <span className="text-[13px] text-fg-muted">
          {row.original.submittedAt
            ? format(parseISO(row.original.submittedAt), 'MMM d, yyyy')
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const ts = row.original;
        const isApproving = approve.isPending && approve.variables?.id === ts.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-success/30 text-xs text-success hover:bg-success/10 hover:text-success"
              disabled={isApproving}
              onClick={() => handleApprove(ts)}
            >
              <CheckIcon className="size-3.5" aria-hidden />
              {isApproving ? '…' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-danger/30 text-xs text-danger hover:bg-danger/10 hover:text-danger"
              disabled={isApproving}
              onClick={() => setRejectTarget(ts)}
            >
              <XIcon className="size-3.5" aria-hidden />
              Return
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-fg">Pending approvals</h2>
        <p className="text-xs text-fg-muted">
          Review submitted weeks. Approve to lock them, or return with a note for changes.
        </p>
      </div>

      <DynamicTable
        columns={columns}
        data={timesheets}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load timesheets for approval."
        onRetry={() => refetch()}
        emptyTitle="No pending approvals"
        emptyDescription="Submitted timesheets from your team will appear here for review."
        emptyIllustration={<ClipboardCheckIcon className="size-8 text-fg-muted" />}
        rowLabel="timesheets"
      />

      <RejectDialog target={rejectTarget} onClose={() => setRejectTarget(null)} />
    </section>
  );
}
