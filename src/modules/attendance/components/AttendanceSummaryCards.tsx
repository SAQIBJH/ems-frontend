'use client';

import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  HomeIcon,
  CalendarOffIcon,
  SunIcon,
} from 'lucide-react';
import { StatsCard } from '@/components/data-display/StatsCard';
import { useAttendanceSummary } from '../hooks/useAttendance';

export function AttendanceSummaryCards() {
  const { data, isLoading } = useAttendanceSummary();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatsCard
        label="Present"
        value={isLoading ? '—' : (data?.present ?? 0)}
        icon={<CheckCircleIcon className="size-4" aria-hidden />}
        loading={isLoading}
        accent="var(--success-500)"
      />
      <StatsCard
        label="Absent"
        value={isLoading ? '—' : (data?.absent ?? 0)}
        icon={<XCircleIcon className="size-4" aria-hidden />}
        loading={isLoading}
        accent="var(--danger-500)"
      />
      <StatsCard
        label="Late"
        value={isLoading ? '—' : (data?.late ?? 0)}
        icon={<ClockIcon className="size-4" aria-hidden />}
        loading={isLoading}
        accent="var(--warning-500)"
      />
      <StatsCard
        label="WFH"
        value={isLoading ? '—' : (data?.wfh ?? 0)}
        icon={<HomeIcon className="size-4" aria-hidden />}
        loading={isLoading}
        accent="var(--info-500)"
      />
      <StatsCard
        label="Leave"
        value={isLoading ? '—' : (data?.leave ?? 0)}
        icon={<CalendarOffIcon className="size-4" aria-hidden />}
        loading={isLoading}
        accent="var(--warning-500)"
      />
      <StatsCard
        label="Attendance %"
        value={isLoading ? '—' : `${data?.attendancePercentage ?? 0}%`}
        icon={<SunIcon className="size-4" aria-hidden />}
        loading={isLoading}
        accent="var(--brand-500)"
      />
    </div>
  );
}
