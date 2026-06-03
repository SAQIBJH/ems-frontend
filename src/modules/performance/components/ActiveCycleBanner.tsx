import { StarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActiveCycle } from '../types/performance.types';
import { PerfProgressBar } from './PerfProgressBar';

interface ActiveCycleBannerProps {
  cycle: ActiveCycle | null | undefined;
  isLoading: boolean;
}

export function ActiveCycleBanner({ cycle, isLoading }: ActiveCycleBannerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-subtle bg-surface p-3.5">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-1.5 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    );
  }

  if (!cycle) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-subtle bg-surface p-3.5">
      <div
        className="grid size-9 shrink-0 place-items-center rounded-lg"
        style={{
          background: 'color-mix(in oklab, var(--brand-500) 14%, transparent)',
          color: 'var(--brand-500)',
        }}
      >
        <StarIcon className="size-[18px]" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-fg">{cycle.name}</p>
        <p className="text-xs leading-4 text-fg-muted">
          Manager reviews due <span className="font-mono">{cycle.managerReviewDue}</span>
          {' · '}
          calibration <span className="font-mono">{cycle.calibrationDate}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <PerfProgressBar value={cycle.progressPct} className="w-32" />
        <span className="min-w-[2.5rem] text-right font-mono text-sm font-semibold tabular-nums text-fg">
          {cycle.progressPct}%
        </span>
      </div>

      <Badge variant="warning">{cycle.status}</Badge>
    </div>
  );
}
