'use client';

import { useState } from 'react';
import {
  FilterIcon,
  MoreHorizontalIcon,
  CheckSquareIcon,
  WrenchIcon,
  ArchiveIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import type { AssetType, AssetStatus } from '../types/assets.types';
import { ASSET_STATUS_CONFIG, ASSET_TYPES, ASSET_STATUSES } from '../constants';
import { useAssets } from '../hooks/useAssets';
import { AssetGlyph } from './AssetGlyph';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-subtle">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-[30px] shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="ml-auto h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function InventoryTab() {
  const [typeFilter, setTypeFilter] = useState<'All types' | AssetType>('All types');
  const [statusFilter, setStatusFilter] = useState<'All statuses' | AssetStatus>('All statuses');

  const params = {
    ...(typeFilter !== 'All types' ? { type: typeFilter as AssetType } : {}),
    ...(statusFilter !== 'All statuses' ? { status: statusFilter as AssetStatus } : {}),
  };
  const assetsQuery = useAssets(Object.keys(params).length ? params : undefined);
  const assets = assetsQuery.data?.assets ?? [];
  const total = assetsQuery.data?.pagination.total ?? 0;

  const hasFilter = typeFilter !== 'All types' || statusFilter !== 'All statuses';

  return (
    <SectionCard
      title={`Asset register · ${total}`}
      noPad
      actions={
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter((v ?? 'All types') as typeof typeFilter)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v ?? 'All statuses') as typeof statusFilter)}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger
              className={buttonVariants({
                variant: hasFilter ? 'default' : 'outline',
                size: 'sm',
              })}
            >
              <FilterIcon className="size-3.5" aria-hidden />
              Filter
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
                Quick filters
              </p>
              {[
                { label: 'Available only', type: undefined, status: 'Available' as AssetStatus },
                { label: 'In repair', type: undefined, status: 'Repair' as AssetStatus },
                { label: 'Retired', type: undefined, status: 'Retired' as AssetStatus },
              ].map(({ label, status }) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] text-fg hover:bg-surface-2 transition-colors duration-[120ms]"
                  onClick={() => {
                    setStatusFilter(status);
                  }}
                >
                  {label}
                </button>
              ))}
              {hasFilter && (
                <button
                  type="button"
                  className="mt-1.5 w-full rounded-md px-2 py-1 text-left text-[12px] text-fg-muted hover:text-fg transition-colors"
                  onClick={() => {
                    setTypeFilter('All types');
                    setStatusFilter('All statuses');
                  }}
                >
                  Clear all filters
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      {assetsQuery.isLoading ? (
        <TableSkeleton />
      ) : assetsQuery.isError ? (
        <div className="p-6">
          <ErrorState message="Failed to load assets" onRetry={() => void assetsQuery.refetch()} />
        </div>
      ) : assets.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No assets" description="No assets match the selected filters." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Asset</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Tag</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Type</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Status</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                  Assigned to
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Since</th>
                <th className="w-10 px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const sc = ASSET_STATUS_CONFIG[a.status];
                return (
                  <tr
                    key={a.id}
                    className="border-b border-subtle last:border-0 transition-colors duration-[120ms] hover:bg-surface-2"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <AssetGlyph type={a.type} />
                        <span className="text-[13px] font-medium text-fg">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-fg-subtle">{a.tag}</td>
                    <td className="px-5 py-3 text-[13px] text-fg-muted">{a.type}</td>
                    <td className="px-5 py-3">
                      <Badge variant={sc.variant} dot>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {a.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarFallback className="text-[10px] font-medium">
                              {getInitials(a.assignedTo.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] text-fg">{a.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-fg-disabled">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-fg-muted">
                      {a.assignedSince ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-[120ms]">
                          <MoreHorizontalIcon size={14} aria-hidden />
                          <span className="sr-only">More options</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => toast.info(`Viewing details for ${a.tag}`)}
                          >
                            View details
                          </DropdownMenuItem>
                          {a.status === 'Assigned' && (
                            <DropdownMenuItem
                              onClick={() => toast.success(`${a.tag} marked as available`)}
                            >
                              <CheckSquareIcon size={13} aria-hidden />
                              Mark available
                            </DropdownMenuItem>
                          )}
                          {(a.status === 'Available' || a.status === 'Assigned') && (
                            <DropdownMenuItem onClick={() => toast.info(`${a.tag} sent to repair`)}>
                              <WrenchIcon size={13} aria-hidden />
                              Send to repair
                            </DropdownMenuItem>
                          )}
                          {a.status !== 'Retired' && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => toast.success(`${a.tag} retired`)}
                            >
                              <ArchiveIcon size={13} aria-hidden />
                              Retire
                            </DropdownMenuItem>
                          )}
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
