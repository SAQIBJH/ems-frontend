'use client';

import type { CSSProperties } from 'react';
import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CandidateCard, RecruitDot } from './CandidateCard';
import type { Candidate, Opening } from '../types/recruitment.types';
import { RECRUIT_STAGES } from '../constants';

interface PipelineBoardProps {
  candidates: Candidate[];
  openings: Opening[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function PipelineBoard({
  candidates,
  openings,
  isLoading,
  isError,
  onRetry,
}: PipelineBoardProps) {
  const byStage = Object.fromEntries(
    RECRUIT_STAGES.map((s) => [s.key, candidates.filter((c) => c.stage === s.key)]),
  ) as Record<string, Candidate[]>;

  if (isError) {
    return <ErrorState message="Failed to load pipeline" onRetry={onRetry} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12px] font-medium leading-[16px] text-fg-secondary">Role</span>
        <div className="w-48">
          <Select defaultValue="all">
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All openings</SelectItem>
              {openings.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select defaultValue="all">
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All recruiters</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm">
          <FilterIcon className="size-3.5" aria-hidden />
          Filter
        </Button>
      </div>

      {/* Kanban board */}
      <div
        className="grid items-start gap-3"
        style={
          {
            gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))',
          } as CSSProperties
        }
      >
        {RECRUIT_STAGES.map((stage) => {
          const cards = byStage[stage.key] ?? [];
          return (
            <div
              key={stage.key}
              className="flex min-h-[120px] flex-col rounded-xl border border-subtle bg-surface-raised"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 pb-[10px] pt-3">
                <span className="inline-flex items-center gap-2">
                  <RecruitDot color={stage.color} />
                  <span className="text-[12px] font-semibold uppercase leading-[16px] tracking-[0.04em] text-fg">
                    {stage.label}
                  </span>
                </span>
                <span className="font-mono text-[12px] font-medium leading-[16px] text-fg-muted">
                  {isLoading ? '—' : cards.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex flex-col gap-2 px-2 pb-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </>
                ) : cards.length === 0 ? (
                  <p className="py-4 text-center text-[12px] leading-[16px] text-fg-disabled">
                    No candidates
                  </p>
                ) : (
                  cards.map((c) => <CandidateCard key={c.id} candidate={c} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
