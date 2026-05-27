import type { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Larger decorative SVG placed above the title. When provided, replaces the icon circle. */
  illustration?: ReactNode;
  /** Small icon rendered inside a circle. Used when `illustration` is not provided. */
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}
    >
      {illustration ? (
        <div className="text-fg-muted">{illustration}</div>
      ) : (
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-2">
          {icon ?? <InboxIcon className="size-6 text-fg-muted" aria-hidden />}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
