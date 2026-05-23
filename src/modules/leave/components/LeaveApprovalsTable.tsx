'use client';

import { useCallback, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { type ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { useTeamLeaveRequests } from '../hooks/useLeave';
import { useApproveLeaveRequest, useRejectLeaveRequest } from '../hooks/useLeaveMutations';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { denyLeaveSchema, type DenyLeaveFormValues } from '../validations/leave.schema';
import type { LeaveRequest } from '../types/leave.types';

const PAGE_SIZE = 10;

function DenyDialog({ target, onClose }: { target: LeaveRequest | null; onClose: () => void }) {
  const reject = useRejectLeaveRequest();
  const form = useForm<DenyLeaveFormValues>({
    resolver: zodResolver(denyLeaveSchema),
    defaultValues: { comment: '' },
  });

  function onSubmit({ comment }: DenyLeaveFormValues) {
    if (!target) return;
    reject.mutate(
      { id: target.id, comment },
      {
        onSuccess: () => {
          toast.success('Leave request denied');
          onClose();
          form.reset();
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
          <DialogTitle>Deny leave request</DialogTitle>
          <DialogDescription>
            Provide a reason for denial. The employee will be notified.
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
                    <Textarea
                      placeholder="e.g. Team at capacity during this period…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
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
                {reject.isPending ? 'Denying…' : 'Deny Request'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaveApprovalsTable() {
  const [page, setPage] = useState(1);
  const [denyTarget, setDenyTarget] = useState<LeaveRequest | null>(null);

  const { data, isLoading, isError, refetch } = useTeamLeaveRequests({
    page,
    limit: PAGE_SIZE,
    status: 'PENDING',
  });

  const approve = useApproveLeaveRequest();

  const requests = data?.requests ?? [];
  const pagination = data?.pagination;

  const handleApprove = useCallback(
    (request: LeaveRequest) => {
      approve.mutate(
        { id: request.id },
        {
          onSuccess: () => toast.success('Leave request approved'),
        },
      );
    },
    [approve],
  );

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      {
        id: 'employee',
        header: 'Employee',
        cell: ({ row }) => {
          const emp = row.original.employeeName;
          if (emp) {
            return (
              <div>
                <p className="text-sm font-medium text-fg">{emp}</p>
                <p className="text-xs text-fg-muted">{row.original.employeeCode}</p>
              </div>
            );
          }
          return <span className="text-sm text-fg-muted">—</span>;
        },
      },
      {
        id: 'type',
        header: 'Leave Type',
        cell: ({ row }) => <span className="text-sm text-fg">{row.original.leaveTypeName}</span>,
      },
      {
        id: 'dates',
        header: 'Dates',
        cell: ({ row }) => {
          const { startDate, endDate, totalDays } = row.original;
          const start = format(parseISO(startDate), 'MMM d');
          const end = format(parseISO(endDate), 'MMM d, yyyy');
          const same = startDate.slice(0, 10) === endDate.slice(0, 10);
          return (
            <div>
              <p className="text-sm text-fg">
                {same ? format(parseISO(startDate), 'MMM d, yyyy') : `${start} – ${end}`}
              </p>
              <p className="text-xs text-fg-muted">
                {totalDays} day{totalDays !== 1 ? 's' : ''}
              </p>
            </div>
          );
        },
      },
      {
        id: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span
            className="max-w-[180px] truncate text-sm text-fg-muted"
            title={row.original.reason}
          >
            {row.original.reason}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <LeaveStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const request = row.original;
          if (request.status !== 'PENDING') return null;
          const isApproving = approve.isPending && approve.variables?.id === request.id;
          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 border-success/30 text-success hover:bg-success/10 hover:text-success text-xs"
                disabled={isApproving}
                onClick={() => handleApprove(request)}
              >
                <CheckIcon className="size-3.5" aria-hidden />
                {isApproving ? '…' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 border-danger/30 text-danger hover:bg-danger/10 hover:text-danger text-xs"
                disabled={isApproving}
                onClick={() => setDenyTarget(request)}
              >
                <XIcon className="size-3.5" aria-hidden />
                Deny
              </Button>
            </div>
          );
        },
      },
    ],
    [approve.isPending, approve.variables?.id, handleApprove],
  );

  return (
    <>
      <DynamicTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load pending approvals."
        onRetry={() => refetch()}
        emptyTitle="No pending approvals"
        emptyDescription="There are no pending leave requests from your team."
        pagination={
          pagination
            ? { page, pages: pagination.pages, total: pagination.total, pageSize: PAGE_SIZE }
            : undefined
        }
        onPageChange={setPage}
        rowLabel="requests"
      />

      <DenyDialog target={denyTarget} onClose={() => setDenyTarget(null)} />
    </>
  );
}
