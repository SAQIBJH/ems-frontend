import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  /** Slot rendered on the right side of the card header (e.g. range-picker buttons). */
  actions?: ReactNode;
  /** Skip default body padding — useful when the body contains a flush table or list. */
  noPad?: boolean;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  actions,
  noPad = false,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={cn('rounded-xl border border-subtle bg-surface', className)}>
      <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
        <h3 className="text-sm font-medium text-fg">{title}</h3>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
