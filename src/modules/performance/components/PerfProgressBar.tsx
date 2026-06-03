import { cn } from '@/lib/utils';

interface PerfProgressBarProps {
  value: number;
  color?: string;
  className?: string;
}

export function PerfProgressBar({
  value,
  color = 'var(--brand-500)',
  className,
}: PerfProgressBarProps) {
  return (
    <div
      className={cn('h-1.5 min-w-[120px] overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-[280ms]"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}
