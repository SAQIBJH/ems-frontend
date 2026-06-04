'use client';

import { lazy, Suspense } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { ReportsNav } from './ReportsNav';
import { DEFAULT_REPORT } from '../constants';
import type { ReportType } from '../types/reports.types';

const panelMap: Record<ReportType, React.LazyExoticComponent<React.ComponentType>> = {
  // Step 63 — workforce panels
  'workforce/headcount': lazy(() => import('./HeadcountReport')),
  'workforce/turnover': lazy(() => import('./TurnoverReport')),
  'workforce/demographics': lazy(() => import('./DemographicsReport')),
  // Step 64 — attendance & leave panels
  'attendance/summary': lazy(() => import('./AttendanceSummaryReport')),
  'attendance/absenteeism': lazy(() => import('./AbsenteeismReport')),
  'leave/utilization': lazy(() => import('./LeaveUtilizationReport')),
  'leave/pending': lazy(() => import('./PendingLeaveReport')),
  // Step 65 — payroll panels
  'payroll/summary': lazy(() => import('./PayrollSummaryReport')),
  'payroll/ctc-analysis': lazy(() => import('./CtcAnalysisReport')),
};

function PanelSkeleton() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

const VALID_REPORTS = Object.keys(panelMap) as ReportType[];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useQueryState(
    'report',
    parseAsString.withDefault(DEFAULT_REPORT),
  );

  const safeReport: ReportType = VALID_REPORTS.includes(activeReport as ReportType)
    ? (activeReport as ReportType)
    : DEFAULT_REPORT;

  const Panel = panelMap[safeReport];

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Reports"
        description="Org analytics and scheduled exports for headcount, attendance, leave, and pay."
      />

      <div className="flex min-h-0 flex-1 gap-6 p-6">
        <aside className="sticky top-20 self-start">
          <ReportsNav active={safeReport} onChange={(value) => setActiveReport(value)} />
        </aside>

        <div className="flex min-w-0 flex-1">
          <Suspense fallback={<PanelSkeleton />}>
            <Panel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
