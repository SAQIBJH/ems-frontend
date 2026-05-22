import { cn } from '@/lib/utils';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';

export { Skeleton } from '@/components/ui/skeleton';

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShadcnSkeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 rounded-lg border border-subtle bg-surface p-4', className)}>
      <ShadcnSkeleton className="h-4 w-1/3" />
      <div className="space-y-2">
        <ShadcnSkeleton className="h-4 w-full" />
        <ShadcnSkeleton className="h-4 w-5/6" />
        <ShadcnSkeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonRow({ cols = 4, className }: { cols?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <ShadcnSkeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-4 border-b border-subtle pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <ShadcnSkeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-1">
          {Array.from({ length: cols }).map((_, j) => (
            <ShadcnSkeleton key={j} className={cn('h-4 flex-1', j === 0 && 'max-w-[140px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}
