'use client';

import { format, isPast, isToday, parseISO } from 'date-fns';
import { ClockIcon, FileEditIcon, LogInIcon, LogOutIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, WORK_MODE_LABELS } from '../constants';
import { formatDuration } from '../utils/attendance.utils';
import type { AttendanceRecord, AttendanceStatus, WorkMode } from '../types/attendance.types';

interface DayDetailDrawerProps {
  /** YYYY-MM-DD */
  date: string | null;
  record: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user clicks "Request Regularization". */
  onRequestRegularization: (date: string) => void;
  /** When true, hides the regularization CTA (e.g. HR viewing another employee). */
  readOnly?: boolean;
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-subtle bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-fg-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold tabular-nums text-fg">{value}</p>
    </div>
  );
}

export function DayDetailDrawer({
  date,
  record,
  open,
  onOpenChange,
  onRequestRegularization,
  readOnly = false,
}: DayDetailDrawerProps) {
  if (!date) return null;

  const parsedDate = parseISO(date);
  const isPastOrToday = isPast(parsedDate) || isToday(parsedDate);

  const statusCfg = record ? STATUS_CONFIG[record.status as AttendanceStatus] : null;
  const workModeLabel = record?.workMode
    ? (WORK_MODE_LABELS[record.workMode as WorkMode] ?? record.workMode)
    : null;

  const checkInTime = record?.checkInAt ? format(parseISO(record.checkInAt), 'hh:mm a') : null;
  const checkOutTime = record?.checkOutAt ? format(parseISO(record.checkOutAt), 'hh:mm a') : null;
  const duration =
    record?.totalMinutes != null && record.totalMinutes > 0
      ? formatDuration(record.totalMinutes)
      : null;

  const canRegularize = !readOnly && isPastOrToday;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader className="border-b border-subtle pb-4">
          <div className="flex items-start justify-between gap-2 pr-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                {format(parsedDate, 'EEEE')}
              </p>
              <SheetTitle className="mt-0.5 text-lg font-semibold text-fg">
                {format(parsedDate, 'dd MMMM yyyy')}
              </SheetTitle>
            </div>
            {statusCfg && (
              <span
                className={cn(
                  'mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusCfg.bgClass,
                  statusCfg.textClass,
                )}
              >
                {statusCfg.label}
              </span>
            )}
            {!record && (
              <span className="mt-1 shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                No record
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {/* Work mode pill */}
          {workModeLabel && (
            <p className="text-sm text-fg-muted">
              Work mode: <span className="font-medium text-fg">{workModeLabel}</span>
            </p>
          )}

          {/* Check-in / Check-out grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={<LogInIcon className="size-3.5" aria-hidden />}
              label="Check In"
              value={checkInTime ?? '—'}
            />
            <StatBox
              icon={<LogOutIcon className="size-3.5" aria-hidden />}
              label="Check Out"
              value={checkOutTime ?? '—'}
            />
          </div>

          {/* Duration */}
          {duration && (
            <StatBox
              icon={<ClockIcon className="size-3.5" aria-hidden />}
              label="Total hours"
              value={duration}
            />
          )}

          {/* Notes */}
          {record?.notes && (
            <div className="rounded-lg border border-subtle bg-surface-2 p-3">
              <p className="mb-1 text-xs text-fg-muted">Notes</p>
              <p className="text-sm text-fg">{record.notes}</p>
            </div>
          )}

          {/* Empty state */}
          {!record && (
            <div className="rounded-lg border border-dashed border-subtle bg-surface-2/50 p-4 text-center">
              <p className="text-sm text-fg-muted">No attendance recorded for this day.</p>
            </div>
          )}
        </div>

        {/* Regularize CTA */}
        {canRegularize && (
          <div className="border-t border-subtle p-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                onRequestRegularization(date);
              }}
            >
              <FileEditIcon className="size-4" aria-hidden />
              Request Regularization
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
