import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Delta {
  value: number;
  direction: 'up' | 'down';
  period: string;
}

interface SubLine {
  text: string;
  tone?: 'positive' | 'negative' | 'warning' | 'neutral';
}

interface StatsCardProps {
  label: string;
  value: string | number;
  delta?: Delta;
  subLine?: SubLine;
  icon?: ReactNode;
  loading?: boolean;
  href?: string;
  /** CSS color value for the 2px top accent bar + icon chip tint.
   *  e.g. 'var(--brand-500)', 'var(--success-500)', 'var(--dept-engineering)' */
  accent?: string;
}

const SUB_LINE_TONE: Record<NonNullable<SubLine['tone']>, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-fg-muted',
};

function StatsCardInner({
  label,
  value,
  delta,
  subLine,
  icon,
  loading,
  accent,
}: Omit<StatsCardProps, 'href'>) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
    );
  }

  const iconChipStyle: CSSProperties = accent
    ? {
        background: `color-mix(in oklab, ${accent} 14%, transparent)`,
        color: accent,
      }
    : {};

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && (
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              !accent && 'bg-brand-50 text-brand',
            )}
            style={iconChipStyle}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-fg">{value}</p>
      {subLine && (
        <p className={cn('text-xs font-medium', SUB_LINE_TONE[subLine.tone ?? 'neutral'])}>
          {subLine.text}
        </p>
      )}
      {!subLine && delta && (
        <div className="flex items-center gap-1.5">
          {delta.direction === 'up' ? (
            <TrendingUpIcon className="size-3.5 text-success" aria-hidden />
          ) : (
            <TrendingDownIcon className="size-3.5 text-danger" aria-hidden />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              delta.direction === 'up' ? 'text-success' : 'text-danger',
            )}
          >
            {delta.value > 0 ? '+' : ''}
            {delta.value}
          </span>
          <span className="text-xs text-fg-subtle">{delta.period}</span>
        </div>
      )}
    </div>
  );
}

export function StatsCard({
  label,
  value,
  delta,
  subLine,
  icon,
  loading,
  href,
  accent,
}: StatsCardProps) {
  const classes = cn(
    'relative overflow-hidden rounded-xl border border-subtle bg-surface p-4 transition-colors duration-[120ms]',
    href && 'cursor-pointer hover:bg-surface-2 hover:border-default-border',
  );

  const accentBar = accent ? (
    <div
      aria-hidden
      className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl"
      style={{ background: accent, opacity: 0.85 }}
    />
  ) : null;

  const inner = (
    <>
      {accentBar}
      <StatsCardInner
        label={label}
        value={value}
        delta={delta}
        subLine={subLine}
        icon={icon}
        loading={loading}
        accent={accent}
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={loading ? label : `${label}: ${value}`}>
        {inner}
      </Link>
    );
  }

  return <div className={classes}>{inner}</div>;
}
