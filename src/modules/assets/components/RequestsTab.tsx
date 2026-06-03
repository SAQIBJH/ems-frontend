'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import type { AssetRequest, RequestStatus } from '../types/assets.types';
import { REQUEST_STATUS_CONFIG, REQUEST_STATUSES } from '../constants';
import { useAssetRequests, useApproveRequest, useDeclineRequest } from '../hooks/useAssets';
import { RequestDetailSheet } from './RequestDetailSheet';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-subtle">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function RequestsTab() {
  const [statusFilter, setStatusFilter] = useState<'All statuses' | RequestStatus>('All statuses');
  const [viewRequest, setViewRequest] = useState<AssetRequest | null>(null);

  const params =
    statusFilter !== 'All statuses' ? { status: statusFilter as RequestStatus } : undefined;
  const requestsQuery = useAssetRequests(params);
  const requests = requestsQuery.data?.requests ?? [];
  const total = requestsQuery.data?.pagination.total ?? 0;

  const approve = useApproveRequest();
  const decline = useDeclineRequest();

  function handleApprove(id: string, item: string) {
    approve.mutate(id, {
      onSuccess: () => toast.success(`Request for "${item}" approved`),
      onError: () => toast.error('Failed to approve request'),
    });
  }

  function handleDecline(id: string, item: string) {
    decline.mutate(
      { id },
      {
        onSuccess: () => toast.success(`Request for "${item}" declined`),
        onError: () => toast.error('Failed to decline request'),
      },
    );
  }

  return (
    <>
      <SectionCard
        title={`Asset requests · ${total}`}
        noPad
        actions={
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v ?? 'All statuses') as typeof statusFilter)}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {requestsQuery.isLoading ? (
          <TableSkeleton />
        ) : requestsQuery.isError ? (
          <div className="p-6">
            <ErrorState
              message="Failed to load requests"
              onRetry={() => void requestsQuery.refetch()}
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No requests"
              description="No asset requests match the selected filter."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                    Requested by
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Item</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                    Reason
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Date</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                    Status
                  </th>
                  <th className="w-40 px-5 py-2.5 text-right text-xs font-medium text-fg-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const sc = REQUEST_STATUS_CONFIG[r.status];
                  const initials = getInitials(r.requestedBy.name);
                  const isPending = r.status === 'Pending';
                  const isBusy =
                    (approve.isPending && approve.variables === r.id) ||
                    (decline.isPending &&
                      typeof decline.variables === 'object' &&
                      decline.variables?.id === r.id);

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-subtle last:border-0 transition-colors duration-[120ms] hover:bg-surface-2"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarFallback className="text-[10px] font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] font-medium text-fg">
                            {r.requestedBy.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-fg">{r.item}</td>
                      <td className="px-5 py-3 text-[13px] text-fg-muted">{r.reason}</td>
                      <td className="px-5 py-3 font-mono text-[12px] text-fg-muted">
                        {r.requestedAt}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={sc.variant} dot>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isPending ? (
                          <div className="inline-flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleDecline(r.id, r.item)}
                            >
                              {decline.isPending && decline.variables?.id === r.id
                                ? 'Declining…'
                                : 'Decline'}
                            </Button>
                            <Button
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleApprove(r.id, r.item)}
                            >
                              {approve.isPending && approve.variables === r.id
                                ? 'Approving…'
                                : 'Approve'}
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setViewRequest(r)}>
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <RequestDetailSheet
        request={viewRequest}
        open={!!viewRequest}
        onOpenChange={(open) => {
          if (!open) setViewRequest(null);
        }}
      />
    </>
  );
}
