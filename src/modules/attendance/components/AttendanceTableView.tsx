'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { useAttendanceRecords, useAttendanceTeamRecords } from '../hooks/useAttendance';
import { STATUS_CONFIG, WORK_MODE_LABELS } from '../constants';
import type { AttendanceRecord, AttendanceRecordsParams } from '../types/attendance.types';
import type { AttendanceStatus, WorkMode } from '../types/attendance.types';

function formatDuration(minutes: number | null) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const columns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: 'attendanceDate',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-sm text-fg">
        {format(parseISO(getValue() as string), 'EEE, dd MMM yyyy')}
      </span>
    ),
  },
  {
    accessorKey: 'checkInAt',
    header: 'Check In',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return (
        <span className="tabular-nums text-sm text-fg">
          {v ? format(parseISO(v), 'hh:mm a') : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'checkOutAt',
    header: 'Check Out',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return (
        <span className="tabular-nums text-sm text-fg">
          {v ? format(parseISO(v), 'hh:mm a') : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'totalMinutes',
    header: 'Duration',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-sm text-fg-muted">
        {formatDuration(getValue() as number | null)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as AttendanceStatus;
      const cfg = STATUS_CONFIG[status];
      if (!cfg) return <span className="text-sm text-fg-muted">{status}</span>;
      return (
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            cfg.bgClass,
            cfg.textClass,
          )}
        >
          {cfg.label}
        </span>
      );
    },
  },
  {
    accessorKey: 'workMode',
    header: 'Work Mode',
    cell: ({ getValue }) => {
      const mode = getValue() as WorkMode | null;
      return (
        <span className="text-sm text-fg-muted">
          {mode ? (WORK_MODE_LABELS[mode] ?? mode) : '—'}
        </span>
      );
    },
  },
];

interface AttendanceTableViewProps {
  params: AttendanceRecordsParams;
  /** When true, calls the team/records endpoint instead of own records. */
  useTeam?: boolean;
  onPageChange?: (page: number) => void;
}

export function AttendanceTableView({
  params,
  useTeam = false,
  onPageChange,
}: AttendanceTableViewProps) {
  const selfQuery = useAttendanceRecords(params, !useTeam);
  const teamQuery = useAttendanceTeamRecords(params, useTeam);

  const { data, isLoading, isError, refetch } = useTeam ? teamQuery : selfQuery;

  const records = data?.records ?? [];
  const pagination = data?.pagination;

  return (
    <DynamicTable<AttendanceRecord>
      columns={columns}
      data={records}
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load attendance records."
      onRetry={() => refetch()}
      emptyTitle="No records"
      emptyDescription="No attendance records found for the selected period."
      rowLabel="records"
      loadingRows={10}
      pagination={
        pagination
          ? {
              page: pagination.page,
              pages: pagination.pages,
              total: pagination.total,
              pageSize: pagination.limit,
            }
          : undefined
      }
      onPageChange={onPageChange}
    />
  );
}
