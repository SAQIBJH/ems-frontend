import { cn } from '@/lib/utils';

import { TIMESHEET_STATUS_CONFIG } from '../constants';
import type { TimesheetStatus } from '../types/timesheet.types';

/** Status pill for a weekly timesheet (Draft / Submitted / Approved / Rejected). */
export function TimesheetStatusBadge({
  status,
  className,
}: {
  status: TimesheetStatus;
  className?: string;
}) {
  const cfg = TIMESHEET_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        cfg.color,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
