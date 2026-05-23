'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { LogInIcon, LogOutIcon, ClockIcon } from 'lucide-react';
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
import type { WorkMode } from '../types/attendance.types';

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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-14 w-28" />
          <Skeleton className="h-14 w-28" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  const hasCheckedIn = !!todayRecord?.checkInAt;
  const hasCheckedOut = !!todayRecord?.checkOutAt;
  const statusCfg = todayRecord ? STATUS_CONFIG[todayRecord.status] : null;

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-4 text-fg-muted" aria-hidden />
          <span className="text-sm font-medium text-fg">Today</span>
          <span className="text-sm text-fg-subtle">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        {statusCfg && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusCfg.bgClass,
              statusCfg.textClass,
            )}
          >
            {statusCfg.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-surface-2 px-3 py-2.5">
          <p className="text-xs text-fg-subtle mb-1">Check In</p>
          <p className="text-sm font-medium text-fg">
            {todayRecord?.checkInAt ? format(parseISO(todayRecord.checkInAt), 'hh:mm a') : '—'}
          </p>
        </div>
        <div className="rounded-md bg-surface-2 px-3 py-2.5">
          <p className="text-xs text-fg-subtle mb-1">Check Out</p>
          <p className="text-sm font-medium text-fg">
            {todayRecord?.checkOutAt ? format(parseISO(todayRecord.checkOutAt), 'hh:mm a') : '—'}
          </p>
        </div>
      </div>

      {todayRecord?.totalMinutes != null && (
        <p className="text-xs text-fg-subtle">
          Total: {formatDuration(todayRecord.totalMinutes)}
          {todayRecord.workMode && <> · {WORK_MODE_LABELS[todayRecord.workMode]}</>}
        </p>
      )}

      {!hasCheckedIn && (
        <div className="flex items-center gap-2">
          <Select value={workMode} onValueChange={(v) => setWorkMode(v as WorkMode)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleCheckIn}
            disabled={checkIn.isPending}
            className="h-8 gap-1.5"
          >
            <LogInIcon className="size-3.5" aria-hidden />
            {checkIn.isPending ? 'Checking in…' : 'Check In'}
          </Button>
        </div>
      )}

      {hasCheckedIn && !hasCheckedOut && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleCheckOut}
          disabled={checkOut.isPending}
          className="h-8 gap-1.5"
        >
          <LogOutIcon className="size-3.5" aria-hidden />
          {checkOut.isPending ? 'Checking out…' : 'Check Out'}
        </Button>
      )}

      {hasCheckedIn && hasCheckedOut && (
        <p className="text-xs text-fg-subtle">Completed for today</p>
      )}
    </div>
  );
}
