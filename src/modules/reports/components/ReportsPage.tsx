'use client';

import { lazy, Suspense } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsNav } from './ReportsNav';
import { DEFAULT_REPORT } from '../constants';
import type { ReportType } from '../types/reports.types';

const panelMap: Record<ReportType, React.LazyExoticComponent<React.ComponentType>> = {
  'workforce/headcount': lazy(() => import('./panels/HeadcountPanel')),
  'workforce/turnover': lazy(() => import('./panels/TurnoverPanel')),
  'workforce/demographics': lazy(() => import('./panels/DemographicsPanel')),
  'attendance/summary': lazy(() => import('./panels/AttendanceSummaryPanel')),
  'attendance/absenteeism': lazy(() => import('./panels/AbsenteeismPanel')),
  'leave/utilization': lazy(() => import('./panels/LeaveUtilizationPanel')),
  'leave/pending': lazy(() => import('./panels/LeavePendingPanel')),
  'payroll/summary': lazy(() => import('./panels/PayrollSummaryPanel')),
  'payroll/ctc-analysis': lazy(() => import('./panels/CtcAnalysisPanel')),
};

function PanelSkeleton() {
  return (
    <div className="space-y-4 flex-1">
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
