'use client';

import { useMemo, useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { FileEditIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/shared/layouts/PageHeader';

import {
  AttendanceCalendar,
  AttendanceSummaryCards,
  CheckInOutCard,
  RegularizationDialog,
  useAttendanceRecords,
} from '@/modules/attendance';
import { buildDateMap } from '@/modules/attendance/utils/attendance.utils';

export default function AttendancePage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [regularizationOpen, setRegularizationOpen] = useState(false);

  // Load records for current month to derive today's record
  const monthParam = format(currentDate, 'yyyy-MM');
  const { data: monthData, isLoading: isMonthLoading } = useAttendanceRecords({
    month: monthParam,
    limit: 31,
  });

  const todayRecord = useMemo(() => {
    const records = monthData?.records;
    if (!records) return null;
    const map = buildDateMap(records);
    return map.get(format(new Date(), 'yyyy-MM-dd')) ?? null;
  }, [monthData]);

  function handlePrev() {
    setCurrentDate((d) => subMonths(d, 1));
  }

  function handleNext() {
    setCurrentDate((d) => addMonths(d, 1));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track your daily check-in, check-out, and monthly summary."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setRegularizationOpen(true)}
          >
            <FileEditIcon className="size-4" aria-hidden />
            Request Regularization
          </Button>
        }
      />

      {/* Summary stats */}
      <AttendanceSummaryCards />

      {/* Today + Calendar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <CheckInOutCard todayRecord={todayRecord} isLoading={isMonthLoading} />
        <AttendanceCalendar currentDate={currentDate} onPrev={handlePrev} onNext={handleNext} />
      </div>

      <RegularizationDialog open={regularizationOpen} onOpenChange={setRegularizationOpen} />
    </div>
  );
}
