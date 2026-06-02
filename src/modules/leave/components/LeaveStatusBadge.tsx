import type { LeaveStatus } from '../types/leave.types';

const STATUS_META: Record<LeaveStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'var(--status-pending)' },
  APPROVED: { label: 'Approved', color: 'var(--status-approved)' },
  DENIED: { label: 'Denied', color: 'var(--status-rejected)' },
  REJECTED: { label: 'Rejected', color: 'var(--status-rejected)' },
  WITHDRAWN: { label: 'Withdrawn', color: 'var(--status-withdrawn)' },
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'var(--text-secondary)' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium leading-[16px]"
      style={{
        background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
        color: meta.color,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: 'currentColor' }}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

/* ── Leave type color mapping ───────────────────────────────────────────── */

export function leaveTypeColor(code: string, name: string): string {
  const c = code.toLowerCase();
  const n = name.toLowerCase();
  if (c === 'cl' || n.includes('casual')) return 'var(--leave-casual)';
  if (c === 'sl' || n.includes('sick')) return 'var(--leave-sick)';
  if (
    c === 'el' ||
    c === 'al' ||
    c === 'pl2' ||
    n.includes('earned') ||
    n.includes('annual') ||
    n.includes('privilege')
  )
    return 'var(--leave-earned)';
  if (
    c === 'ml' ||
    c === 'pl' ||
    c === 'ptl' ||
    n.includes('parental') ||
    n.includes('maternit') ||
    n.includes('paternit')
  )
    return 'var(--leave-parental)';
  if (c === 'bl' || c === 'bv' || n.includes('bereave')) return 'var(--leave-bereavement)';
  if (c === 'co' || n.includes('comp')) return 'var(--leave-comp-off)';
  if (c === 'ul' || c === 'lop' || n.includes('unpaid') || n.includes('loss of pay'))
    return 'var(--leave-unpaid)';
  return 'var(--text-secondary)';
}

export function LeaveTypePill({ code, name }: { code?: string; name: string }) {
  const color = leaveTypeColor(code ?? '', name);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium leading-[16px] whitespace-nowrap"
      style={{
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        color,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: 'currentColor' }}
        aria-hidden
      />
      {name}
    </span>
  );
}
