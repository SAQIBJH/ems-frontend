'use client';

import { useState } from 'react';
import {
  MapPinIcon,
  MoreHorizontalIcon,
  FilterIcon,
  ArrowUpDownIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import { OpeningDetailSheet } from './OpeningDetailSheet';
import { EditOpeningDialog } from './EditOpeningDialog';
import { CloseOpeningDialog } from './CloseOpeningDialog';
import type { Opening, OpeningStatus } from '../types/recruitment.types';
import { OPENING_STATUS_CONFIG, EMPLOYMENT_TYPE_LABELS } from '../constants';

type SortField = 'title' | 'applicantCount' | 'createdAt';
type SortDir = 'asc' | 'desc';
type OverlayMode = 'detail' | 'edit' | 'close' | null;

const ALL_STATUSES: OpeningStatus[] = ['Open', 'Closing', 'On hold', 'Closed'];

interface OpeningsTableProps {
  openings: Opening[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function OpeningsTable({ openings, isLoading, isError, onRetry }: OpeningsTableProps) {
  const [filterStatuses, setFilterStatuses] = useState<OpeningStatus[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Overlay state — a single selected opening + which overlay is open
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(null);

  const openOverlay = (opening: Opening, mode: OverlayMode) => {
    setSelectedOpening(opening);
    setOverlayMode(mode);
  };
  const closeOverlay = () => setOverlayMode(null);

  const toggleStatus = (s: OpeningStatus) =>
    setFilterStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtered = filterStatuses.length
    ? openings.filter((o) => filterStatuses.includes(o.status))
    : openings;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'applicantCount') cmp = a.applicantCount - b.applicantCount;
    else cmp = a.createdAt.localeCompare(b.createdAt);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const hasFilter = filterStatuses.length > 0;

  if (isError) {
    return <ErrorState message="Failed to load openings" onRetry={onRetry} />;
  }

  const headerActions = (
    <div className="flex gap-2">
      {/* Filter popover */}
      <Popover>
        <PopoverTrigger
          className={cn(buttonVariants({ variant: hasFilter ? 'default' : 'outline', size: 'sm' }))}
        >
          <FilterIcon className="size-3.5" aria-hidden />
          Filter{hasFilter ? ` (${filterStatuses.length})` : ''}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 gap-1 p-2">
          <p className="px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            Status
          </p>
          {ALL_STATUSES.map((s) => {
            const active = filterStatuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
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
                {s}
              </button>
            );
          })}
          {hasFilter && (
            <>
              <div className="my-1 h-px bg-subtle" />
              <button
                type="button"
                onClick={() => setFilterStatuses([])}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] text-danger hover:bg-surface-raised"
              >
                <XIcon className="size-3.5" aria-hidden />
                Clear filter
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Sort dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <ArrowUpDownIcon className="size-3.5" aria-hidden />
          Sort
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {(
            [
              { field: 'title', label: 'Role (A–Z)' },
              { field: 'applicantCount', label: 'Applicants' },
              { field: 'createdAt', label: 'Date posted' },
            ] as { field: SortField; label: string }[]
          ).map(({ field, label }) => (
            <DropdownMenuItem
              key={field}
              onClick={() => {
                if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                else {
                  setSortField(field);
                  setSortDir('asc');
                }
              }}
              className={cn(
                'flex items-center justify-between',
                sortField === field && 'font-medium',
              )}
            >
              {label}
              {sortField === field && (
                <span className="text-[11px] text-fg-muted">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <SectionCard
        title={`Open requisitions · ${isLoading ? '…' : sorted.length}`}
        actions={headerActions}
        noPad
      >
        {isLoading ? (
          <OpeningsTableSkeleton />
        ) : sorted.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              title={hasFilter ? 'No matching openings' : 'No openings'}
              description={hasFilter ? 'Try adjusting your filters.' : 'Post a job to get started.'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-medium text-fg-muted">
                    Applicants
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-medium text-fg-muted">
                    Status
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((o) => {
                  const statusCfg = OPENING_STATUS_CONFIG[o.status] ?? {
                    variant: 'secondary' as const,
                  };
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-subtle last:border-0 transition-colors duration-[120ms] hover:bg-surface-raised"
                    >
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium leading-[18px] text-fg">{o.title}</p>
                        <p className="font-mono text-[11px] leading-[14px] text-fg-muted">{o.id}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-fg-secondary">{o.department}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary">
                          <MapPinIcon size={13} className="shrink-0 text-fg-muted" aria-hidden />
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
                            <DropdownMenuItem onClick={() => openOverlay(o, 'detail')}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openOverlay(o, 'edit')}>
                              Edit opening
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openOverlay(o, 'close')}
                            >
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

      {/* Overlays — rendered outside the table so they sit above everything */}
      <OpeningDetailSheet
        opening={selectedOpening}
        open={overlayMode === 'detail'}
        onOpenChange={(o) => {
          if (!o) closeOverlay();
        }}
      />
      <EditOpeningDialog
        opening={selectedOpening}
        open={overlayMode === 'edit'}
        onOpenChange={(o) => {
          if (!o) closeOverlay();
        }}
      />
      <CloseOpeningDialog
        opening={selectedOpening}
        open={overlayMode === 'close'}
        onOpenChange={(o) => {
          if (!o) closeOverlay();
        }}
      />
    </>
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
          <Skeleton className="ml-auto h-4 w-8" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
