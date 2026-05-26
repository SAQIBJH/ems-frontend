'use client';

import { useCallback, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { type ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangleIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

import { useTeamLeaveRequests, useTeamCoverage } from '../hooks/useLeave';
import {
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useBulkApproveLeave,
  useBulkRejectLeave,
} from '../hooks/useLeaveMutations';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { denyLeaveSchema, type DenyLeaveFormValues } from '../validations/leave.schema';
import type { LeaveRequest } from '../types/leave.types';

const PAGE_SIZE = 10;

// ── Coverage warning chip ────────────────────────────────────────────────────

function CoverageWarningChip({ startDate }: { startDate: string }) {
  const dateStr = startDate.slice(0, 10);
  const { data } = useTeamCoverage(dateStr);
  if (!data?.isBelowThreshold) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium bg-warning/10 text-warning border border-warning/20 whitespace-nowrap">
      <AlertTriangleIcon className="size-3 shrink-0" aria-hidden />
      {data.coveragePercent}% coverage
    </span>
  );
}

// ── Deny single request dialog ───────────────────────────────────────────────

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

// ── Bulk action modal ────────────────────────────────────────────────────────

const bulkCommentSchema = z.object({
  comment: z.string().optional(),
});
type BulkCommentValues = z.infer<typeof bulkCommentSchema>;

function BulkActionModal({
  action,
  count,
  isPending,
  onConfirm,
  onClose,
}: {
  action: 'approve' | 'reject' | null;
  count: number;
  isPending: boolean;
  onConfirm: (comment?: string) => void;
  onClose: () => void;
}) {
  const form = useForm<BulkCommentValues>({
    resolver: zodResolver(bulkCommentSchema),
    defaultValues: { comment: '' },
  });

  function onSubmit({ comment }: BulkCommentValues) {
    onConfirm(comment || undefined);
  }

  return (
    <Dialog
      open={!!action}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approve' : 'Deny'} {count} request
            {count !== 1 ? 's' : ''}?
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? 'All selected pending requests will be approved.'
              : 'All selected pending requests will be denied.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        action === 'approve'
                          ? 'e.g. Approved for the event'
                          : 'e.g. Team at capacity'
                      }
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  onClose();
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={action === 'approve' ? 'default' : 'destructive'}
                disabled={isPending}
              >
                {isPending
                  ? action === 'approve'
                    ? 'Approving…'
                    : 'Denying…'
                  : action === 'approve'
                    ? `Approve ${count}`
                    : `Deny ${count}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main table ───────────────────────────────────────────────────────────────

export function LeaveApprovalsTable() {
  const [page, setPage] = useState(1);
  const [denyTarget, setDenyTarget] = useState<LeaveRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading, isError, refetch } = useTeamLeaveRequests({
    page,
    limit: PAGE_SIZE,
    status: 'PENDING',
  });

  const approve = useApproveLeaveRequest();
  const bulkApprove = useBulkApproveLeave();
  const bulkReject = useBulkRejectLeave();

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const pagination = data?.pagination;

  const pendingIds = useMemo(
    () => requests.filter((r) => r.status === 'PENDING').map((r) => r.id),
    [requests],
  );
  const allPageSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedIds.has(id));

  const handleApprove = useCallback(
    (request: LeaveRequest) => {
      approve.mutate(
        { id: request.id },
        { onSuccess: () => toast.success('Leave request approved') },
      );
    },
    [approve],
  );

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pendingIds.forEach((id) => next.delete(id));
      } else {
        pendingIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageSelected, pendingIds]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
  }, []);

  function handleBulkConfirm(comment?: string) {
    const ids = Array.from(selectedIds);
    if (bulkAction === 'approve') {
      bulkApprove.mutate(
        { ids, comment },
        {
          onSuccess: (result) => {
            const s = result.succeeded.length;
            const f = result.failed.length;
            if (f === 0) toast.success(`${s} request${s !== 1 ? 's' : ''} approved`);
            else toast.warning(`${s} approved, ${f} failed`);
            setSelectedIds(new Set());
            setBulkAction(null);
          },
        },
      );
    } else {
      bulkReject.mutate(
        { ids, comment },
        {
          onSuccess: (result) => {
            const s = result.succeeded.length;
            const f = result.failed.length;
            if (f === 0) toast.success(`${s} request${s !== 1 ? 's' : ''} denied`);
            else toast.warning(`${s} denied, ${f} failed`);
            setSelectedIds(new Set());
            setBulkAction(null);
          },
        },
      );
    }
  }

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allPageSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all pending requests on this page"
          />
        ),
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') return null;
          return (
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => toggleRow(row.original.id)}
              aria-label={`Select request from ${row.original.employeeName ?? 'employee'}`}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
        size: 40,
      },
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
        id: 'coverage',
        header: '',
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') return null;
          return <CoverageWarningChip startDate={row.original.startDate} />;
        },
        size: 140,
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
    [
      allPageSelected,
      toggleAll,
      selectedIds,
      toggleRow,
      approve.isPending,
      approve.variables?.id,
      handleApprove,
    ],
  );

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-subtle bg-surface px-4 py-2.5 mb-3 shadow-sm">
          <span className="text-sm font-medium text-fg">
            {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-fg-muted"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-success/30 text-success hover:bg-success/10 hover:text-success"
              onClick={() => setBulkAction('approve')}
            >
              <CheckIcon className="size-3.5 mr-1" aria-hidden />
              Approve {selectedIds.size}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-danger/30 text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => setBulkAction('reject')}
            >
              <XIcon className="size-3.5 mr-1" aria-hidden />
              Deny {selectedIds.size}
            </Button>
          </div>
        </div>
      )}

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
        onPageChange={handlePageChange}
        rowLabel="requests"
      />

      <DenyDialog target={denyTarget} onClose={() => setDenyTarget(null)} />

      <BulkActionModal
        action={bulkAction}
        count={selectedIds.size}
        isPending={bulkApprove.isPending || bulkReject.isPending}
        onConfirm={handleBulkConfirm}
        onClose={() => setBulkAction(null)}
      />
    </>
  );
}
