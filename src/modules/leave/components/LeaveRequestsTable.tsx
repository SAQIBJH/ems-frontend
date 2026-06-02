'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { UndoIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { DynamicTable } from '@/shared/engines/DynamicTable';

import { useLeaveRequests } from '../hooks/useLeave';
import { useWithdrawLeaveRequest } from '../hooks/useLeaveMutations';
import { LeaveStatusBadge, LeaveTypePill } from './LeaveStatusBadge';
import { LeaveBalanceRow } from './LeaveBalanceCards';
import type { LeaveRequest, LeaveStatus } from '../types/leave.types';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '_all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

interface LeaveRequestsTableProps {
  onNewRequest: () => void;
}

export function LeaveRequestsTable({ onNewRequest }: LeaveRequestsTableProps) {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault(''));
  const [withdrawTarget, setWithdrawTarget] = useState<LeaveRequest | null>(null);

  const { data, isLoading, isError, refetch } = useLeaveRequests({
    page,
    limit: PAGE_SIZE,
    status: (statusFilter as LeaveStatus) || undefined,
  });

  const withdraw = useWithdrawLeaveRequest();

  const requests = data?.requests ?? [];
  const pagination = data?.pagination;

  async function handleWithdraw() {
    if (!withdrawTarget) return;
    withdraw.mutate(withdrawTarget.id, {
      onSuccess: () => {
        toast.success('Leave request withdrawn');
        setWithdrawTarget(null);
      },
    });
  }

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
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
      {
        id: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span
            className="max-w-[200px] truncate text-[13px] text-fg-muted"
            title={row.original.reason}
          >
            {row.original.reason || '—'}
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
          if (row.original.status !== 'PENDING') return null;
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-fg-muted hover:text-fg"
              onClick={(e) => {
                e.stopPropagation();
                setWithdrawTarget(row.original);
              }}
            >
              <UndoIcon className="size-3.5" aria-hidden />
              Withdraw
            </Button>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Balance row */}
      <LeaveBalanceRow />

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3">
        <Select
          value={statusFilter || '_all'}
          onValueChange={(v) => {
            void setStatusFilter(v === '_all' ? null : v);
            void setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by status">
            <SelectValue>
              {(v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={onNewRequest}>
          New Request
        </Button>
      </div>

      <DynamicTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load leave requests."
        onRetry={() => refetch()}
        emptyTitle="No leave requests"
        emptyDescription={
          statusFilter
            ? 'No requests match the selected status.'
            : "You haven't submitted any leave requests yet."
        }
        emptyAction={
          !statusFilter ? (
            <Button size="sm" onClick={onNewRequest}>
              New Request
            </Button>
          ) : undefined
        }
        pagination={
          pagination
            ? { page, pages: pagination.pages, total: pagination.total, pageSize: PAGE_SIZE }
            : undefined
        }
        onPageChange={(p) => void setPage(p)}
        rowLabel="requests"
      />

      <ConfirmDialog
        open={!!withdrawTarget}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
        title="Withdraw leave request?"
        description="This will cancel your pending leave request. You can submit a new request later."
        confirmLabel="Withdraw"
        variant="danger"
        loading={withdraw.isPending}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
