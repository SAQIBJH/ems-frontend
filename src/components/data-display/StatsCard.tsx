import Link from 'next/link';
import type { ReactNode } from 'react';
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
  /** Simple text sub-line with semantic tone colour */
  subLine?: SubLine;
  icon?: ReactNode;
  loading?: boolean;
  href?: string;
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-fg">{value}</p>
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

export function StatsCard({ label, value, delta, subLine, icon, loading, href }: StatsCardProps) {
  const classes = cn(
    'rounded-lg border border-subtle bg-surface p-4 transition-colors duration-[120ms]',
    href && 'cursor-pointer hover:bg-surface-2 hover:border-default-border',
  );

  const inner = (
    <StatsCardInner
      label={label}
      value={value}
      delta={delta}
      subLine={subLine}
      icon={icon}
      loading={loading}
    />
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
