'use client';

import { lazy, Suspense } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsNav } from './ReportsNav';
import { DEFAULT_REPORT } from '../constants';
import type { ReportType } from '../types/reports.types';

const panelMap: Record<ReportType, React.LazyExoticComponent<React.ComponentType>> = {
  // Step 63 — workforce panels (real)
  'workforce/headcount': lazy(() => import('./HeadcountReport')),
  'workforce/turnover': lazy(() => import('./TurnoverReport')),
  'workforce/demographics': lazy(() => import('./DemographicsReport')),
  // Step 64 — attendance & leave panels (placeholder until next step)
  'attendance/summary': lazy(() => import('./panels/AttendanceSummaryPanel')),
  'attendance/absenteeism': lazy(() => import('./panels/AbsenteeismPanel')),
  'leave/utilization': lazy(() => import('./panels/LeaveUtilizationPanel')),
  'leave/pending': lazy(() => import('./panels/LeavePendingPanel')),
  // Step 65 — payroll panels (placeholder until next step)
  'payroll/summary': lazy(() => import('./panels/PayrollSummaryPanel')),
  'payroll/ctc-analysis': lazy(() => import('./panels/CtcAnalysisPanel')),
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
    <div className="flex min-h-0 flex-1 gap-6">
      <aside className="sticky top-6 self-start">
        <ReportsNav active={safeReport} onChange={(value) => setActiveReport(value)} />
      </aside>

      <div className="flex min-w-0 flex-1">
        <Suspense fallback={<PanelSkeleton />}>
          <Panel />
        </Suspense>
      </div>
    </div>
  );
}
