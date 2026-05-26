'use client';

import { format, parseISO, startOfWeek } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';
import { useTeamWeeklyAttendance } from '../hooks/useDashboard';

const CODE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  P: { bg: 'bg-success/10', text: 'text-success', label: 'Present' },
  A: { bg: 'bg-danger/10', text: 'text-danger', label: 'Absent' },
  L: { bg: 'bg-warning/10', text: 'text-warning', label: 'Leave' },
  W: { bg: 'bg-brand/10', text: 'text-brand', label: 'WFH' },
  H: { bg: 'bg-info/10', text: 'text-info', label: 'Half-day' },
  O: { bg: 'bg-surface-2', text: 'text-fg-subtle', label: 'Off / Holiday' },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function weekStartMonday(): string {
  const d = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(d, 'yyyy-MM-dd');
}

export function TeamWeeklyAttendanceGrid() {
  const weekStart = weekStartMonday();
  const { data, isLoading, isError, refetch } = useTeamWeeklyAttendance(weekStart);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">Team Attendance — This Week</h2>
      </div>
      <div className="overflow-x-auto p-5">
        {isLoading ? (
          <div className="space-y-2">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-10 flex-1" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-7 w-24 rounded" />
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-7 flex-1 rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load team attendance" onRetry={() => refetch()} />
        ) : !data || data.members.length === 0 ? (
          <div className="py-8 text-center text-sm text-fg-muted">No team attendance data.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-3 text-left text-xs font-medium text-fg-muted w-28">
                  Member
                </th>
                {(data.members[0]?.days ?? []).slice(0, 5).map((day, i) => {
                  let label = DAY_LABELS[i] ?? '';
                  try {
                    label = format(parseISO(day.date), 'EEE d');
                  } catch {}
                  return (
                    <th
                      key={day.date}
                      className="pb-2 px-1 text-center text-xs font-medium text-fg-muted"
                    >
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {data.members.map((member) => (
                <tr key={member.employeeId}>
                  <td className="py-1.5 pr-3">
                    <p className="text-xs font-medium text-fg truncate max-w-[100px]">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-fg-muted truncate max-w-[100px]">
                      {member.designation}
                    </p>
                  </td>
                  {member.days.slice(0, 5).map((day) => {
                    const style = CODE_STYLE[day.code] ?? CODE_STYLE['O'];
                    return (
                      <td key={day.date} className="py-1.5 px-1 text-center">
                        <span
                          title={`${style.label} · ${day.date}`}
                          className={cn(
                            'inline-flex size-7 items-center justify-center rounded text-[11px] font-semibold',
                            style.bg,
                            style.text,
                          )}
                        >
                          {day.code}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-subtle px-5 py-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(CODE_STYLE).map(([code, s]) => (
          <span key={code} className="flex items-center gap-1 text-[10px] text-fg-muted">
            <span
              className={cn(
                'inline-flex size-4 items-center justify-center rounded text-[9px] font-bold',
                s.bg,
                s.text,
              )}
            >
              {code}
            </span>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
