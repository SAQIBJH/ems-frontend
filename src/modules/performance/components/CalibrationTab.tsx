'use client';

import { useState, type CSSProperties } from 'react';
import { FileTextIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SectionCard } from '@/components/data-display/SectionCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCalibration } from '../hooks/usePerformance';
import { RATING_CONFIG, NOTE_TONE_CONFIG } from '../constants';
import type { RatingValue } from '../types/performance.types';

function PerfDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: 7, height: 7, background: color } as CSSProperties}
      aria-hidden
    />
  );
}

function CalibrationSkeleton() {
  return (
    <div className="space-y-5 p-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function CalibrationTab() {
  const calibrationQuery = useCalibration();
  const data = calibrationQuery.data;
  const [sheetOpen, setSheetOpen] = useState(false);

  const maxCount = data ? Math.max(...data.distribution.map((d) => d.count)) : 1;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Rating distribution */}
        <SectionCard
          title="Rating distribution"
          actions={
            data ? (
              <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle">
                {data.totalReviewed} reviewed
              </span>
            ) : undefined
          }
        >
          {calibrationQuery.isLoading ? (
            <CalibrationSkeleton />
          ) : calibrationQuery.isError ? (
            <ErrorState
              message="Failed to load calibration data"
              onRetry={() => void calibrationQuery.refetch()}
            />
          ) : !data ? null : (
            <div className="space-y-[18px]">
              {data.distribution.map((d) => {
                const meta = RATING_CONFIG[d.rating as RatingValue];
                const barWidth = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                  <div key={d.rating}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="inline-flex items-center gap-2 text-[13px] font-medium leading-[18px] text-fg">
                        <PerfDot color={meta.color} />
                        {d.rating}
                      </span>
                      <span className="text-[12px] font-medium tabular-nums text-fg-subtle">
                        <strong className="text-fg">{d.count}</strong>
                        {' · '}
                        {d.pct}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-sm bg-surface-2"
                      role="progressbar"
                      aria-valuenow={d.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-sm transition-all duration-[280ms]"
                        style={{ width: `${barWidth}%`, background: meta.color } as CSSProperties}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Calibration notes */}
        <SectionCard title="Calibration notes">
          {calibrationQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-16 w-1 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : calibrationQuery.isError ? (
            <ErrorState
              message="Failed to load notes"
              onRetry={() => void calibrationQuery.refetch()}
            />
          ) : !data ? null : (
            <div className="flex flex-col gap-3.5">
              {data.notes.map((note, i) => {
                const accentColor = NOTE_TONE_CONFIG[note.tone];
                return (
                  <div key={i} className="flex gap-3">
                    <div
                      className="w-1 shrink-0 rounded-full"
                      style={{ background: accentColor } as CSSProperties}
                    />
                    <div>
                      <p className="text-[13px] font-medium leading-[18px] text-fg">{note.title}</p>
                      <p className="mt-0.5 text-[12px] leading-[18px] text-fg-muted">{note.body}</p>
                    </div>
                  </div>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                onClick={() => setSheetOpen(true)}
              >
                <FileTextIcon className="size-3.5" aria-hidden />
                Open calibration sheet
              </Button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Calibration sheet dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>H1 2026 Calibration Sheet</DialogTitle>
          </DialogHeader>

          {data && (
            <div className="space-y-6">
              {/* Summary line */}
              <p className="text-[13px] text-fg-muted">
                {data.totalReviewed} employees reviewed across all departments.
              </p>

              {/* Distribution table */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                  Rating distribution
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle">
                      <th className="py-2 text-left text-xs font-medium text-fg-muted">Rating</th>
                      <th className="py-2 text-right text-xs font-medium text-fg-muted">Count</th>
                      <th className="py-2 text-right text-xs font-medium text-fg-muted">%</th>
                      <th className="w-40 py-2 text-left text-xs font-medium text-fg-muted pl-4">
                        Distribution
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.distribution.map((d) => {
                      const meta = RATING_CONFIG[d.rating as RatingValue];
                      return (
                        <tr key={d.rating} className="border-b border-subtle last:border-0">
                          <td className="py-2.5">
                            <span
                              className="inline-flex items-center gap-2 text-[13px] font-medium"
                              style={{ color: meta.color } as CSSProperties}
                            >
                              <PerfDot color={meta.color} />
                              {d.rating}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-[13px] tabular-nums text-fg">
                            {d.count}
                          </td>
                          <td className="py-2.5 text-right font-mono text-[13px] tabular-nums text-fg-muted">
                            {d.pct}%
                          </td>
                          <td className="py-2.5 pl-4">
                            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className="h-full rounded-full"
                                style={
                                  { width: `${d.pct}%`, background: meta.color } as CSSProperties
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                  Calibration notes
                </p>
                <div className="space-y-3">
                  {data.notes.map((note, i) => {
                    const accentColor = NOTE_TONE_CONFIG[note.tone];
                    return (
                      <div key={i} className="flex gap-3 rounded-lg border border-subtle p-3">
                        <div
                          className="w-1 shrink-0 self-stretch rounded-full"
                          style={{ background: accentColor } as CSSProperties}
                        />
                        <div>
                          <p className="text-[13px] font-medium text-fg">{note.title}</p>
                          <p className="mt-0.5 text-[12px] text-fg-muted">{note.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                  <XIcon className="size-3.5" aria-hidden />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
