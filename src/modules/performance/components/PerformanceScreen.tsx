'use client';

import {
  DownloadIcon,
  PlusIcon,
  ClipboardListIcon,
  TargetIcon,
  StarIcon,
  ClockIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/data-display/StatsCard';
import { PageHeader } from '@/shared/layouts/PageHeader';

import { useActiveCycle, usePerformanceSummary } from '../hooks/usePerformance';
import { ActiveCycleBanner } from './ActiveCycleBanner';
import { ReviewsTab } from './ReviewsTab';
import { GoalsTab } from './GoalsTab';
import { CalibrationTab } from './CalibrationTab';

export function PerformanceScreen() {
  const cycleQuery = useActiveCycle();
  const summaryQuery = usePerformanceSummary();
  const summary = summaryQuery.data;

  return (
    <>
      <PageHeader
        title="Performance"
        description="Run review cycles, track goals, and calibrate ratings across the org."
        breadcrumbs={[{ label: 'Performance' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Export started — your file will download shortly.')}
            >
              <DownloadIcon className="size-3.5" aria-hidden />
              Export
            </Button>
            <Button size="sm" onClick={() => toast.info('Review cycle creation coming soon')}>
              <PlusIcon className="size-3.5" aria-hidden />
              Start a Review
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5 p-6">
        {/* Active cycle banner */}
        <ActiveCycleBanner cycle={cycleQuery.data} isLoading={cycleQuery.isLoading} />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Reviews complete"
            value={
              summaryQuery.isLoading
                ? '—'
                : `${summary?.reviewsComplete ?? 0} / ${summary?.reviewsTotal ?? 0}`
            }
            icon={<ClipboardListIcon className="size-4" aria-hidden />}
            accent="var(--brand-500)"
            subLine={
              summary
                ? {
                    text: `${summary.reviewsComplete} of ${summary.reviewsTotal} (${Math.round((summary.reviewsComplete / summary.reviewsTotal) * 100)}% of cycle)`,
                    tone: 'neutral',
                  }
                : undefined
            }
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Goals on track"
            value={summaryQuery.isLoading ? '—' : `${summary?.goalsOnTrackPct ?? 0}%`}
            icon={<TargetIcon className="size-4" aria-hidden />}
            accent="var(--success-500)"
            delta={
              summary?.goalsOnTrackDelta !== undefined
                ? {
                    value: summary.goalsOnTrackDelta,
                    direction: summary.goalsOnTrackDelta >= 0 ? 'up' : 'down',
                    period: 'vs H2 2025',
                  }
                : undefined
            }
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Avg rating"
            value={summaryQuery.isLoading ? '—' : (summary?.avgRating ?? 0).toFixed(1)}
            icon={<StarIcon className="size-4" aria-hidden />}
            accent="var(--warning-500)"
            subLine={summary ? { text: 'of 5.0', tone: 'neutral' } : undefined}
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Overdue reviews"
            value={summaryQuery.isLoading ? '—' : (summary?.overdueReviews ?? 0).toString()}
            icon={<ClockIcon className="size-4" aria-hidden />}
            accent="var(--danger-500)"
            subLine={summary ? { text: 'past Jun 14', tone: 'negative' } : undefined}
            loading={summaryQuery.isLoading}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reviews">
          <TabsList variant="line" className="mb-2 w-full justify-start">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="calibration">Calibration</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-4">
            <ReviewsTab />
          </TabsContent>

          <TabsContent value="goals" className="mt-4">
            <GoalsTab />
          </TabsContent>

          <TabsContent value="calibration" className="mt-4">
            <CalibrationTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
