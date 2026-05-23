import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '../constants';
import type { LeaveStatus } from '../types/leave.types';

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
}

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
      )}
    >
      {cfg.label}
    </span>
  );
}
