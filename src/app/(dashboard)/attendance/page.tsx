'use client';

import { useState } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { FileEditIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/shared/layouts/PageHeader';

import {
  AttendanceCalendar,
  AttendanceSummaryCards,
  CheckInOutCard,
  RegularizationDialog,
} from '@/modules/attendance';

export default function AttendancePage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [regularizationOpen, setRegularizationOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track your daily check-in, check-out, and monthly summary."
        actions={
          <Button
            variant="outline"
            size="default"
            className="gap-1.5"
            onClick={() => setRegularizationOpen(true)}
          >
            <FileEditIcon className="size-4" aria-hidden />
            Request Regularization
          </Button>
        }
      />

      <AttendanceSummaryCards />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <CheckInOutCard />
        <AttendanceCalendar
          currentDate={currentDate}
          onPrev={() => setCurrentDate((d) => subMonths(d, 1))}
          onNext={() => setCurrentDate((d) => addMonths(d, 1))}
        />
      </div>

      <RegularizationDialog open={regularizationOpen} onOpenChange={setRegularizationOpen} />
    </div>
  );
}
