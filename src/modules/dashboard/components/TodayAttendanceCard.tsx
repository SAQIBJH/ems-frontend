'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { LogInIcon, LogOutIcon } from 'lucide-react';
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

import { useAttendanceToday } from '@/modules/attendance/hooks/useAttendance';
import { useCheckIn, useCheckOut } from '@/modules/attendance/hooks/useAttendanceMutations';
import { STATUS_CONFIG, WORK_MODE_LABELS } from '@/modules/attendance/constants';
import type { WorkMode } from '@/modules/attendance/types/attendance.types';

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Respect prefers-reduced-motion: update every minute instead of every second
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = reducedMotion ? 60_000 : 1_000;
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-4xl font-bold tabular-nums tracking-tight text-fg">
        {format(now, 'hh:mm')}
      </span>
      <span className="text-lg font-medium text-fg-muted">{format(now, 'a')}</span>
    </div>
  );
}

export function TodayAttendanceCard() {
  const { data: record, isLoading, isError, refetch } = useAttendanceToday();
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
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-28" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-5 space-y-3">
        <p className="text-sm font-medium text-fg">Today&apos;s Attendance</p>
        <p className="text-sm text-danger">Failed to load attendance.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const hasCheckedIn = !!record?.checkInAt;
  const hasCheckedOut = !!record?.checkOutAt;
  const statusCfg = record ? STATUS_CONFIG[record.status] : null;

  const statusLabel = (() => {
    if (!record || !hasCheckedIn) return null;
    const base = 'Checked in';
    const mode = record.workMode ? WORK_MODE_LABELS[record.workMode as WorkMode] : null;
    return mode ? `${base} · ${mode}` : base;
  })();

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg">Today&apos;s Attendance</p>
        {statusLabel && statusCfg ? (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusCfg.bgClass,
              statusCfg.textClass,
            )}
          >
            {statusLabel}
          </span>
        ) : (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
            Not checked in
          </span>
        )}
      </div>

      {/* Live clock */}
      <LiveClock />

      {/* Check-in / Check-out times */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-surface-2 px-3 py-2.5">
          <p className="text-xs text-fg-subtle mb-1">Check In</p>
          <p className="text-sm font-medium text-fg">
            {record?.checkInAt ? format(parseISO(record.checkInAt), 'hh:mm a') : '—'}
          </p>
        </div>
        <div className="rounded-md bg-surface-2 px-3 py-2.5">
          <p className="text-xs text-fg-subtle mb-1">Check Out</p>
          <p className="text-sm font-medium text-fg">
            {record?.checkOutAt ? format(parseISO(record.checkOutAt), 'hh:mm a') : '—'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {!hasCheckedIn && (
          <>
            <Select value={workMode} onValueChange={(v) => setWorkMode(v as WorkMode)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue>
                  {(v) => WORK_MODE_LABELS[v as keyof typeof WORK_MODE_LABELS] ?? v}
                </SelectValue>
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
          </>
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

        <Link href="/attendance" className="ml-auto text-xs text-brand hover:underline">
          View history →
        </Link>
      </div>
    </div>
  );
}
