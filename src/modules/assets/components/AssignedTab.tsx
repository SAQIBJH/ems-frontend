'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function AssignedTab() {
  // reuse the assets query filtered to Assigned status
  const assetsQuery = useAssets({ status: 'Assigned' });
  const assigned = assetsQuery.data?.assets ?? [];
  const total = assetsQuery.data?.pagination.total ?? 0;

  return (
    <SectionCard title={`Assigned hardware · ${total}`} noPad>
      {assetsQuery.isLoading ? (
        <TableSkeleton />
      ) : assetsQuery.isError ? (
        <div className="p-6">
          <ErrorState
            message="Failed to load assigned assets"
            onRetry={() => void assetsQuery.refetch()}
          />
        </div>
      ) : assigned.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No assigned assets"
            description="All hardware is currently unassigned."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                  Employee
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Asset</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Tag</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                  Assigned since
                </th>
                <th className="w-28 px-5 py-2.5 text-right text-xs font-medium text-fg-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((a) => {
                const holderName = a.assignedTo?.name ?? '';
                const initials = getInitials(holderName);
                return (
                  <tr
                    key={a.id}
                    className="border-b border-subtle last:border-0 transition-colors duration-[120ms] hover:bg-surface-2"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px] font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] font-medium text-fg">{holderName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <AssetGlyph type={a.type} />
                        <span className="text-[13px] text-fg">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[12px] text-fg-subtle">{a.tag}</td>
                    <td className="px-5 py-3 text-[13px] text-fg-muted">
                      {a.assignedSince ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.success(`Recall initiated for ${a.tag} from ${holderName}`)
                        }
                      >
                        Recall
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
