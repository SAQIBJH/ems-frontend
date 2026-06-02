'use client';

import { MapPinIcon, MoreHorizontalIcon, FilterIcon, ArrowUpDownIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import type { Opening } from '../types/recruitment.types';
import { OPENING_STATUS_CONFIG, EMPLOYMENT_TYPE_LABELS } from '../constants';

interface OpeningsTableProps {
  openings: Opening[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function OpeningsTable({ openings, isLoading, isError, onRetry }: OpeningsTableProps) {
  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        <FilterIcon className="size-3.5" aria-hidden />
        Filter
      </Button>
      <Button variant="outline" size="sm">
        <ArrowUpDownIcon className="size-3.5" aria-hidden />
        Sort
      </Button>
    </div>
  );

  if (isError) {
    return <ErrorState message="Failed to load openings" onRetry={onRetry} />;
  }

  return (
    <SectionCard
      title={`Open requisitions · ${isLoading ? '…' : openings.length}`}
      actions={actions}
      noPad
    >
      {isLoading ? (
        <OpeningsTableSkeleton />
      ) : openings.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState title="No openings" description="Post a job to get started." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">Role</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">Type</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-fg-muted">
                  Applicants
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">Stage</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                  Status
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {openings.map((o) => {
                const statusCfg = OPENING_STATUS_CONFIG[o.status] ?? {
                  variant: 'secondary' as const,
                };
                return (
                  <tr
                    key={o.id}
                    className="border-b border-subtle last:border-0 hover:bg-surface-raised transition-colors duration-[120ms]"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium leading-[18px] text-fg">{o.title}</p>
                      <p className="font-mono text-[11px] leading-[14px] text-fg-muted">{o.id}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-fg-secondary">{o.department}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary">
                        <MapPinIcon size={13} className="text-fg-muted shrink-0" aria-hidden />
                        {o.location}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-fg-secondary">
                      {EMPLOYMENT_TYPE_LABELS[o.employmentType] ?? o.employmentType}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-semibold text-fg">
                      {o.applicantCount}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-fg-secondary">{o.currentStage}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusCfg.variant} dot={statusCfg.dot}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'size-7',
                          )}
                          aria-label={`Actions for ${o.title}`}
                        >
                          <MoreHorizontalIcon size={14} aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Edit opening</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Close opening
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

function OpeningsTableSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
