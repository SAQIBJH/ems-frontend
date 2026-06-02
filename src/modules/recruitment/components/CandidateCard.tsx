'use client';

import type { CSSProperties } from 'react';
import { StarIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Candidate } from '../types/recruitment.types';

/* ── RecruitDot ────────────────────────────────────────────────────────────── */

interface RecruitDotProps {
  color: string;
  className?: string;
}

export function RecruitDot({ color, className }: RecruitDotProps) {
  return (
    <span
      className={cn('inline-block shrink-0 rounded-full', className)}
      style={{ width: 7, height: 7, background: color } as CSSProperties}
      aria-hidden
    />
  );
}

/* ── Rating ─────────────────────────────────────────────────────────────────── */

export function Rating({ value }: { value: number }) {
  return (
    <span
      className="inline-flex gap-px"
      title={`${value} / 5`}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          size={12}
          aria-hidden
          style={
            {
              color: n <= value ? 'var(--warning-500)' : 'var(--border-strong)',
              fill: n <= value ? 'var(--warning-500)' : 'none',
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/* ── CandidateCard ──────────────────────────────────────────────────────────── */

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate: c }: CandidateCardProps) {
  return (
    <div
      className={cn(
        'group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-subtle bg-surface p-3',
        'transition-colors duration-[120ms]',
        'hover:border-default-border hover:bg-surface-2',
      )}
      style={{} as CSSProperties}
    >
      {/* Name + role */}
      <div className="flex items-start gap-2.5">
        <CandidateAvatar name={c.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-[18px] text-fg">{c.name}</p>
          <p className="truncate text-[12px] leading-[16px] text-fg-muted">{c.role}</p>
        </div>
      </div>

      {/* Rating + days in stage */}
      <div className="flex items-center justify-between">
        <Rating value={c.rating} />
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium leading-[14px] text-fg-muted">
          <ClockIcon size={12} aria-hidden />
          {c.daysInStage}d
        </span>
      </div>

      {/* Tag chip + referral */}
      {c.tag && (
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] font-medium leading-[14px] text-fg-secondary">
            {c.tag}
          </span>
          {c.isReferral && (
            <span
              className="text-[11px] font-medium leading-[14px]"
              style={{ color: 'var(--brand-500)' } as CSSProperties}
            >
              Referral
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Simple initials avatar (no external dep needed) ───────────────────────── */

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
