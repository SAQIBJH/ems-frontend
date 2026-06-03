'use client';

import { useState, type CSSProperties } from 'react';
import { CheckIcon, FilterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import type { Review } from '../types/performance.types';
import { REVIEW_STATUS_CONFIG, RATING_CONFIG, DEPARTMENTS } from '../constants';
import { useReviews } from '../hooks/usePerformance';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function PerfDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: 7, height: 7, background: color } as CSSProperties}
      aria-hidden
    />
  );
}

function ReviewActionLabel(status: Review['status']): string {
  if (status === 'Calibrated') return 'View';
  if (status === 'Manager review') return 'Review';
  return 'Open';
}

function ReviewsTableSkeleton() {
  return (
    <div className="divide-y divide-subtle">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ReviewsTab() {
  const [department, setDepartment] = useState('All departments');

  const params = department !== 'All departments' ? { departmentId: department } : undefined;
  const reviewsQuery = useReviews(params);
  const reviews = reviewsQuery.data?.reviews ?? [];

  return (
    <SectionCard
      title={`Cycle progress · ${reviewsQuery.data?.pagination.total ?? 0} reports`}
      noPad
      actions={
        <div className="flex items-center gap-2">
          <Select value={department} onValueChange={(v) => setDepartment(v ?? 'All departments')}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Filter panel coming soon')}
          >
            <FilterIcon className="size-3.5" aria-hidden />
            Filter
          </Button>
        </div>
      }
    >
      {reviewsQuery.isLoading ? (
        <ReviewsTableSkeleton />
      ) : reviewsQuery.isError ? (
        <div className="p-6">
          <ErrorState
            message="Failed to load reviews"
            onRetry={() => void reviewsQuery.refetch()}
          />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No reviews" description="No reviews match the selected filter." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                  Employee
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                  Reviewer
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Self</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Manager</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Status</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Rating</th>
                <th className="w-28 px-5 py-2.5 text-right text-xs font-medium text-fg-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                const sm = REVIEW_STATUS_CONFIG[r.status];
                const rm = r.rating ? RATING_CONFIG[r.rating] : null;
                const initials = getInitials(r.employeeName);
                return (
                  <tr
                    key={r.employeeId}
                    className="border-b border-subtle last:border-0 hover:bg-surface-2 transition-colors duration-[120ms]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px] font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[13px] font-medium leading-[18px] text-fg">
                            {r.employeeName}
                          </p>
                          <p className="text-[12px] leading-[16px] text-fg-subtle">
                            {r.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-fg-muted">{r.reviewerName}</td>
                    <td className="px-5 py-3">
                      {r.selfComplete ? (
                        <CheckIcon
                          size={15}
                          aria-label="Complete"
                          style={{ color: 'var(--success-500)' } as CSSProperties}
                        />
                      ) : (
                        <span className="text-fg-disabled" aria-label="Incomplete">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {r.managerComplete ? (
                        <CheckIcon
                          size={15}
                          aria-label="Complete"
                          style={{ color: 'var(--success-500)' } as CSSProperties}
                        />
                      ) : (
                        <span className="text-fg-disabled" aria-label="Incomplete">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-4"
                        style={{ color: sm.color } as CSSProperties}
                      >
                        <PerfDot color={sm.color} />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {rm ? (
                        <span
                          className="text-[13px] font-medium leading-[18px]"
                          style={{ color: rm.color } as CSSProperties}
                        >
                          {r.rating}
                        </span>
                      ) : (
                        <span className="text-fg-disabled">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant={r.status === 'Manager review' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toast.info(`Opening review for ${r.employeeName}`)}
                      >
                        {ReviewActionLabel(r.status)}
                      </Button>
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
