'use client';

import { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { ClockIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useLeaveTypes } from '@/modules/leave';
import { useLeavePendingReport } from '../hooks/useLeaveReports';
import { ReportShell } from './ReportShell';
import type { LeavePendingItem } from '../types/reports.types';

const COLS: ColumnDef<LeavePendingItem>[] = [
  {
    accessorKey: 'referenceNo',
    header: 'Ref',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-fg-muted">{row.original.referenceNo}</span>
    ),
  },
  {
    accessorKey: 'employeeName',
    header: 'Employee',
    cell: ({ row }) => <span className="font-medium text-fg">{row.original.employeeName}</span>,
  },
  {
    accessorKey: 'leaveTypeName',
    header: 'Type',
    cell: ({ row }) => <span className="text-sm text-fg-muted">{row.original.leaveTypeName}</span>,
  },
  {
    accessorKey: 'startDate',
    header: 'Duration',
    cell: ({ row }) => (
      <div>
        <div className="tabular-nums text-sm text-fg">
          {row.original.startDate} → {row.original.endDate}
        </div>
        <div className="text-xs text-fg-muted">{row.original.totalDays} day(s)</div>
      </div>
    ),
  },
  {
    accessorKey: 'daysPending',
    header: 'Days Pending',
    cell: ({ row }) => (
      <span className="tabular-nums text-warning">{row.original.daysPending}</span>
    ),
  },
  {
    id: 'daysInQueue',
    header: 'Days in Queue',
    cell: ({ row }) => {
      const daysInQueue = differenceInDays(new Date(), parseISO(row.original.appliedAt));
      return (
        <span
          className={`tabular-nums font-medium ${daysInQueue >= 7 ? 'text-danger' : daysInQueue >= 3 ? 'text-warning' : 'text-fg-muted'}`}
        >
          {daysInQueue}d
        </span>
      );
    },
  },
];

export default function PendingLeaveReport() {
  const [deptId, setDeptId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);
  const { data: leaveTypes = [] } = useLeaveTypes();

  const params = {
    departmentId: deptId || undefined,
    leaveTypeId: leaveTypeId || undefined,
  };

  const { data, isLoading, isError, refetch } = useLeavePendingReport(params);

  const tableItems = data?.tableData?.items ?? [];
  const tablePagination = data?.tableData?.pagination;

  const totalPendingDays = tableItems.reduce((acc, item) => acc + item.daysPending, 0);

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={deptId || '_all'}
        onValueChange={(v) => setDeptId(v === '_all' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="h-8 w-48 text-sm">
          <SelectValue>
            {(v: string) =>
              v === '_all' ? 'All departments' : (flatDepts.find((d) => d.id === v)?.name ?? v)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All departments</SelectItem>
          {flatDepts.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={leaveTypeId || '_all'}
        onValueChange={(v) => setLeaveTypeId(v === '_all' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue>
            {(v: string) =>
              v === '_all' ? 'All leave types' : (leaveTypes.find((lt) => lt.id === v)?.name ?? v)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All leave types</SelectItem>
          {leaveTypes.map((lt) => (
            <SelectItem key={lt.id} value={lt.id}>
              {lt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const summaryBar =
    !isLoading && !isError && tableItems.length > 0 ? (
      <div className="flex items-center gap-6 rounded-lg border border-subtle bg-surface px-4 py-3 mb-0">
        <div>
          <span className="text-xs text-fg-muted">Pending Requests</span>
          <p className="text-lg font-semibold tabular-nums text-fg">
            {tablePagination?.total ?? tableItems.length}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-xs text-fg-muted">Total Pending Days</span>
          <p className="text-lg font-semibold tabular-nums text-warning">{totalPendingDays}</p>
        </div>
      </div>
    ) : null;

  const table = (
    <>
      {summaryBar}
      <DynamicTable
        columns={COLS}
        data={tableItems}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No pending requests"
        emptyDescription="All leave requests have been actioned."
        emptyIllustration={<ClockIcon className="size-8 text-fg-muted" />}
        pagination={
          tablePagination
            ? {
                page: tablePagination.page,
                pages: tablePagination.totalPages,
                total: tablePagination.total,
                pageSize: tablePagination.limit,
              }
            : undefined
        }
      />
    </>
  );

  return (
    <ReportShell
      title="Pending Leave Requests"
      description="All open leave requests awaiting approval across the organization."
      filterBar={filterBar}
      table={isLoading || isError ? undefined : table}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
