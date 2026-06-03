'use client';

import { useState, type CSSProperties } from 'react';
import { MailIcon, FilterIcon, StarIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import { RecruitDot } from './CandidateCard';
import type { Candidate, RecruitmentStage } from '../types/recruitment.types';
import { RECRUIT_STAGES, STAGE_SEQUENCE } from '../constants';
import { useAdvanceCandidate, useUpdateRating } from '../hooks/useRecruitment';

/* ── Interactive Rating ─────────────────────────────────────────────────── */

function InteractiveRating({ candidateId, value }: { candidateId: string; value: number }) {
  const [hovered, setHovered] = useState(0);
  const ratingMutation = useUpdateRating();

  const display = hovered > 0 ? hovered : value;

  return (
    <span
      className="inline-flex gap-px"
      title={value > 0 ? `${value} / 5` : 'Not yet rated'}
      aria-label={`Rate candidate`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="rounded-sm focus-visible:outline-brand cursor-pointer p-0.5"
          aria-label={`Set rating ${n}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => {
            ratingMutation.mutate(
              { id: candidateId, rating: n },
              {
                onSuccess: () => toast.success(`Rating updated to ${n}`),
                onError: () => toast.error('Failed to update rating'),
              },
            );
          }}
        >
          <StarIcon
            size={13}
            aria-hidden
            style={
              {
                color: n <= display ? 'var(--warning-500)' : 'var(--border-strong)',
                fill: n <= display ? 'var(--warning-500)' : 'none',
                transition: 'color 80ms, fill 80ms',
              } as CSSProperties
            }
          />
        </button>
      ))}
    </span>
  );
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */

function CandidateAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ background: 'var(--brand-500)' } as CSSProperties}
      aria-hidden
    >
      {initials}
    </div>
  );
}

/* ── Main table ──────────────────────────────────────────────────────────── */

const STAGE_FILTER_OPTIONS = RECRUIT_STAGES.map((s) => ({
  value: s.key as RecruitmentStage,
  label: s.label,
  color: s.color,
}));

interface CandidatesTableProps {
  candidates: Candidate[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function CandidatesTable({ candidates, isLoading, isError, onRetry }: CandidatesTableProps) {
  const advanceMutation = useAdvanceCandidate();
  const [filterStages, setFilterStages] = useState<RecruitmentStage[]>([]);

  const toggleStage = (s: RecruitmentStage) =>
    setFilterStages((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtered = filterStages.length
    ? candidates.filter((c) => filterStages.includes(c.stage))
    : candidates;

  const hasFilter = filterStages.length > 0;

  const handleAdvance = (candidate: Candidate) => {
    const currentIdx = STAGE_SEQUENCE.indexOf(candidate.stage);
    if (currentIdx === STAGE_SEQUENCE.length - 1) {
      toast.error('Candidate is already at the hired stage.');
      return;
    }
    const nextStage = STAGE_SEQUENCE[currentIdx + 1];
    advanceMutation.mutate(
      { id: candidate.id, stage: nextStage },
      {
        onSuccess: () => toast.success(`${candidate.name} advanced to ${nextStage}`),
        onError: () => toast.error('Failed to advance candidate'),
      },
    );
  };

  if (isError) {
    return <ErrorState message="Failed to load candidates" onRetry={onRetry} />;
  }

  const headerActions = (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: hasFilter ? 'default' : 'outline', size: 'sm' }))}
      >
        <FilterIcon className="size-3.5" aria-hidden />
        Filter{hasFilter ? ` (${filterStages.length})` : ''}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 gap-1 p-2">
        <p className="px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
          Stage
        </p>
        {STAGE_FILTER_OPTIONS.map(({ value, label, color }) => {
          const active = filterStages.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleStage(value)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] text-fg transition-colors',
                active ? 'bg-surface-raised font-medium' : 'hover:bg-surface-raised',
              )}
            >
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded border',
                  active ? 'border-brand bg-brand text-white' : 'border-default-border',
                )}
              >
                {active && <CheckIcon className="size-3" strokeWidth={3} aria-hidden />}
              </span>
              <RecruitDot color={color} />
              {label}
            </button>
          );
        })}
        {hasFilter && (
          <>
            <div className="my-1 h-px bg-subtle" />
            <button
              type="button"
              onClick={() => setFilterStages([])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] text-danger hover:bg-surface-raised"
            >
              <XIcon className="size-3.5" aria-hidden />
              Clear filter
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <SectionCard
      title={`All candidates · ${isLoading ? '…' : filtered.length}`}
      actions={headerActions}
      noPad
    >
      {isLoading ? (
        <CandidatesTableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState
            title={hasFilter ? 'No matching candidates' : 'No candidates'}
            description={hasFilter ? 'Try adjusting your filters.' : 'Candidates will appear here.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                  Applied for
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">Stage</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                  Rating
                </th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-fg-muted">
                  In stage
                </th>
                <th className="w-32 px-4 py-3 text-right text-[12px] font-medium text-fg-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const stageCfg = RECRUIT_STAGES.find((s) => s.key === c.stage);
                const isLast = c.stage === 'hired';
                const isAdvancing =
                  advanceMutation.isPending && advanceMutation.variables?.id === c.id;

                return (
                  <tr
                    key={c.id}
                    className="border-b border-subtle last:border-0 transition-colors duration-[120ms] hover:bg-surface-raised"
                  >
                    {/* Candidate */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <CandidateAvatar name={c.name} />
                        <div>
                          <p className="text-[13px] font-medium leading-[18px] text-fg">{c.name}</p>
                          {c.isReferral && (
                            <p
                              className="text-[11px] font-medium leading-[14px]"
                              style={{ color: 'var(--brand-500)' } as CSSProperties}
                            >
                              Referral
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Applied for */}
                    <td className="px-4 py-3">
                      <p className="text-[13px] leading-[18px] text-fg">{c.role}</p>
                      <p className="font-mono text-[11px] leading-[14px] text-fg-muted">{c.tag}</p>
                    </td>
                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-[16px] text-fg-secondary">
                        <RecruitDot color={stageCfg?.color ?? 'var(--border-strong)'} />
                        {stageCfg?.label ?? c.stage}
                      </span>
                    </td>
                    {/* Interactive rating */}
                    <td className="px-4 py-3">
                      <InteractiveRating candidateId={c.id} value={c.rating} />
                    </td>
                    {/* In stage */}
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-fg-secondary">
                      {c.daysInStage}d
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Email ${c.name}`}
                          onClick={() => {
                            window.location.href = `mailto:${c.email}`;
                          }}
                        >
                          <MailIcon size={14} aria-hidden />
                        </Button>
                        {!isLast && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAdvancing}
                            onClick={() => handleAdvance(c)}
                          >
                            {isAdvancing ? 'Advancing…' : 'Advance'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function CandidatesTableSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-8" />
          <div className="ml-auto flex gap-1.5">
            <Skeleton className="size-7 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
