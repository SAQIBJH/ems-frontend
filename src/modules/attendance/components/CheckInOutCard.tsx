'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { LogInIcon, LogOutIcon, CoffeeIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useAttendanceRecords } from '../hooks/useAttendance';
import { useCheckIn, useCheckOut } from '../hooks/useAttendanceMutations';
import { STATUS_CONFIG, WORK_MODE_LABELS } from '../constants';
import { buildDateMap, formatDuration } from '../utils/attendance.utils';
import { LiveClock } from './LiveClock';
import type { WorkMode } from '../types/attendance.types';

const TARGET_MINUTES = 480; // 8h — configurable via tenant settings in future

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-widest text-fg-subtle">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums text-fg">{value}</p>
    </div>
  );
}

export function CheckInOutCard() {
  const todayMonth = format(new Date(), 'yyyy-MM');
  const { data, isLoading } = useAttendanceRecords({ month: todayMonth, limit: 31 });

  const todayRecord = useMemo(
    () => buildDateMap(data?.records ?? []).get(format(new Date(), 'yyyy-MM-dd')) ?? null,
    [data?.records],
  );

  const [workMode, setWorkMode] = useState<WorkMode>('OFFICE');
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  function handleCheckIn() {
    checkIn.mutate(
      { workMode },
      {
        onSuccess: () => toast.success('Checked in successfully'),
        onError: (err: unknown) => {
          const message =
            (err as AxiosError<{ error: { message: string } }>)?.response?.data?.error?.message ??
            'Failed to check in';
          toast.error(message);
        },
      },
    );
  }

  function handleCheckOut() {
    checkOut.mutate(undefined, {
      onSuccess: () => toast.success('Checked out successfully'),
      onError: (err: unknown) => {
        const message =
          (err as AxiosError<{ error: { message: string } }>)?.response?.data?.error?.message ??
          'Failed to check out';
        toast.error(message);
      },
    });
  }

  function handleTakeBreak() {
    toast.info('Break started — remember to resume when you return.');
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-subtle bg-surface p-5 space-y-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-44" />
        <div className="h-px bg-subtle" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  const hasCheckedIn = !!todayRecord?.checkInAt;
  const hasCheckedOut = !!todayRecord?.checkOutAt;
  const statusCfg = todayRecord ? STATUS_CONFIG[todayRecord.status] : null;

  const checkInTime = todayRecord?.checkInAt
    ? format(parseISO(todayRecord.checkInAt), 'hh:mm a')
    : null;
  const checkOutTime = todayRecord?.checkOutAt
    ? format(parseISO(todayRecord.checkOutAt), 'hh:mm a')
    : null;

  const hoursWorked =
    todayRecord?.totalMinutes != null
      ? formatDuration(todayRecord.totalMinutes)
      : hasCheckedIn
        ? '—'
        : null;
  const target = formatDuration(TARGET_MINUTES);

  const statusText = hasCheckedIn
    ? `Checked in · ${format(new Date(), 'EEE, MMM d')}`
    : `Not checked in · ${format(new Date(), 'EEE, MMM d')}`;

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-subtle bg-surface p-5">
      {/* Label */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-fg-subtle">Today</p>

      {/* Clock */}
      <div className="mt-1.5">
        <LiveClock />
      </div>

      {/* Status line */}
      <p className="mt-1 text-sm text-fg-muted">{statusText}</p>

      {/* Status badge */}
      {statusCfg && (
        <span
          className={cn(
            'mt-2 self-start rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusCfg.bgClass,
            statusCfg.textClass,
          )}
        >
          {statusCfg.label}
        </span>
      )}

      {/* Divider */}
      <div className="my-4 h-px bg-subtle" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCell label="Hours today" value={hoursWorked ?? '—'} />
        <StatCell label="Target" value={target} />
        {checkInTime && <StatCell label="Check In" value={checkInTime} />}
        {checkOutTime && <StatCell label="Check Out" value={checkOutTime} />}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        {!hasCheckedIn && (
          <>
            <Select value={workMode} onValueChange={(v) => setWorkMode(v as WorkMode)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v) => WORK_MODE_LABELS[v as keyof typeof WORK_MODE_LABELS] ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full gap-1.5" onClick={handleCheckIn} disabled={checkIn.isPending}>
              <LogInIcon className="size-4" aria-hidden />
              {checkIn.isPending ? 'Checking in…' : 'Check In'}
            </Button>
          </>
        )}

        {hasCheckedIn && !hasCheckedOut && (
          <>
            <Button
              className="w-full gap-1.5"
              onClick={handleCheckOut}
              disabled={checkOut.isPending}
            >
              <LogOutIcon className="size-4" aria-hidden />
              {checkOut.isPending ? 'Checking out…' : 'Check Out'}
            </Button>
            <Button variant="outline" className="w-full gap-1.5" onClick={handleTakeBreak}>
              <CoffeeIcon className="size-4" aria-hidden />
              Take a break
            </Button>
          </>
        )}

        {hasCheckedIn && hasCheckedOut && (
          <p className="text-center text-sm text-fg-muted">Completed for today</p>
        )}
      </div>
    </div>
  );
}
