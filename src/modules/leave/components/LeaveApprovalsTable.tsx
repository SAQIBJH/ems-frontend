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
import { cn } from '@/lib/utils';

import { useTeamLeaveRequests, useTeamCoverage } from '../hooks/useLeave';
import {
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useBulkApproveLeave,
  useBulkRejectLeave,
} from '../hooks/useLeaveMutations';
import { LeaveStatusBadge, LeaveTypePill } from './LeaveStatusBadge';
import { denyLeaveSchema, type DenyLeaveFormValues } from '../validations/leave.schema';
import type { LeaveRequest } from '../types/leave.types';

const PAGE_SIZE = 10;

type FilterMode = 'pending' | 'recent';

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

const bulkCommentSchema = z.object({ comment: z.string().optional() });
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
            {action === 'approve' ? 'Approve' : 'Deny'} {count} request{count !== 1 ? 's' : ''}?
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? 'All selected pending requests will be approved.'
              : 'All selected pending requests will be denied.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(({ comment }) => onConfirm(comment || undefined))}
            className="space-y-4"
          >
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

// ── Employee cell ────────────────────────────────────────────────────────────

function EmployeeCell({ name, code }: { name: string | null; code: string | null }) {
  if (!name) return <span className="text-[13px] text-fg-muted">—</span>;
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
      <div>
        <p className="text-[13px] font-medium leading-[18px] text-fg">{name}</p>
        {code && <p className="text-[11px] leading-[14px] text-fg-muted">{code}</p>}
      </div>
    </div>
  );
}

// ── Main table ───────────────────────────────────────────────────────────────

export function LeaveApprovalsTable() {
  const [page, setPage] = useState(1);
  const [filterMode, setFilterMode] = useState<FilterMode>('pending');
  const [denyTarget, setDenyTarget] = useState<LeaveRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading, isError, refetch } = useTeamLeaveRequests({
    page,
    limit: PAGE_SIZE,
    status: filterMode === 'pending' ? 'PENDING' : undefined,
  });

  const approve = useApproveLeaveRequest();
  const bulkApprove = useBulkApproveLeave();
  const bulkReject = useBulkRejectLeave();

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const pagination = data?.pagination;
  const pendingCount = pagination?.total ?? 0;

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
      if (allPageSelected) pendingIds.forEach((id) => next.delete(id));
      else pendingIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allPageSelected, pendingIds]);

  function handleTabChange(mode: FilterMode) {
    setFilterMode(mode);
    setPage(1);
    setSelectedIds(new Set());
  }

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

  const isPending = filterMode === 'pending';

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      ...(isPending
        ? [
            {
              id: 'select',
              header: () => (
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all pending requests on this page"
                />
              ),
              cell: ({ row }: { row: { original: LeaveRequest } }) => (
                <Checkbox
                  checked={selectedIds.has(row.original.id)}
                  onCheckedChange={() => toggleRow(row.original.id)}
                  aria-label={`Select request from ${row.original.employeeName ?? 'employee'}`}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
              ),
              size: 40,
            } as ColumnDef<LeaveRequest>,
          ]
        : []),
      {
        id: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell name={row.original.employeeName} code={row.original.employeeCode} />
        ),
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => <LeaveTypePill name={row.original.leaveTypeName} />,
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
              <p className="text-[13px] text-fg">
                {same ? format(parseISO(startDate), 'MMM d, yyyy') : `${start} – ${end}`}
              </p>
              <p className="text-[11px] text-fg-muted">
                {totalDays} day{totalDays !== 1 ? 's' : ''}
              </p>
            </div>
          );
        },
      },
      ...(isPending
        ? [
            {
              id: 'coverage',
              header: '',
              cell: ({ row }: { row: { original: LeaveRequest } }) => (
                <CoverageWarningChip startDate={row.original.startDate} />
              ),
              size: 140,
            } as ColumnDef<LeaveRequest>,
          ]
        : []),
      {
        id: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span
            className="max-w-[180px] truncate text-[13px] text-fg-muted"
            title={row.original.reason}
          >
            {row.original.reason || '—'}
          </span>
        ),
      },
      ...(isPending
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: LeaveRequest } }) => {
                const request = row.original;
                const isApproving = approve.isPending && approve.variables?.id === request.id;
                return (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
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
            } as ColumnDef<LeaveRequest>,
          ]
        : [
            {
              id: 'status',
              header: 'Status',
              cell: ({ row }: { row: { original: LeaveRequest } }) => (
                <LeaveStatusBadge status={row.original.status} />
              ),
            } as ColumnDef<LeaveRequest>,
          ]),
    ],
    [
      isPending,
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
    <div className="flex flex-col gap-4">
      {/* Pending / Recent tab bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-subtle bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('pending')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              filterMode === 'pending'
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            Pending
            {pendingCount > 0 && filterMode === 'pending' && (
              <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[11px] font-semibold text-warning">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('recent')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              filterMode === 'recent'
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            Recent
          </button>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-fg-muted">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-success/30 text-success hover:bg-success/10 hover:text-success"
              onClick={() => setBulkAction('approve')}
            >
              <CheckIcon className="size-3.5 mr-1" aria-hidden />
              Approve all
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-danger/30 text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => setBulkAction('reject')}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      <DynamicTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load leave requests."
        onRetry={() => refetch()}
        emptyTitle={filterMode === 'pending' ? 'No pending approvals' : 'No recent requests'}
        emptyDescription={
          filterMode === 'pending'
            ? 'There are no pending leave requests from your team.'
            : 'No processed leave requests found.'
        }
        pagination={
          pagination
            ? { page, pages: pagination.pages, total: pagination.total, pageSize: PAGE_SIZE }
            : undefined
        }
        onPageChange={(p) => {
          setPage(p);
          setSelectedIds(new Set());
        }}
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
    </div>
  );
}
