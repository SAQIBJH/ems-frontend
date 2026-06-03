'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SectionCard } from '@/components/data-display/SectionCard';
import type { GoalStatus } from '../types/performance.types';
import { GOAL_STATUS_CONFIG, GOAL_STATUSES } from '../constants';
import { useGoals } from '../hooks/usePerformance';
import { PerfProgressBar } from './PerfProgressBar';
import { AddGoalDialog } from './AddGoalDialog';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function GoalsTableSkeleton() {
  return (
    <div className="divide-y divide-subtle">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-1.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function GoalsTab() {
  const [statusFilter, setStatusFilter] = useState<'All statuses' | GoalStatus>('All statuses');
  const [addOpen, setAddOpen] = useState(false);

  const params =
    statusFilter !== 'All statuses' ? { status: statusFilter as GoalStatus } : undefined;
  const goalsQuery = useGoals(params);
  const goals = goalsQuery.data?.goals ?? [];

  return (
    <>
      <SectionCard
        title="Team goals · H1 2026"
        noPad
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter((v ?? 'All statuses') as typeof statusFilter)}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-3.5" aria-hidden />
              Add goal
            </Button>
          </div>
        }
      >
        {goalsQuery.isLoading ? (
          <GoalsTableSkeleton />
        ) : goalsQuery.isError ? (
          <div className="p-6">
            <ErrorState message="Failed to load goals" onRetry={() => void goalsQuery.refetch()} />
          </div>
        ) : goals.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No goals"
              description="No goals match the selected filter."
              action={
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add goal
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Owner</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Goal</th>
                  <th className="w-56 px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                    Progress
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">Due</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-fg-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => {
                  const gs = GOAL_STATUS_CONFIG[g.status];
                  const initials = getInitials(g.employeeName);
                  return (
                    <tr
                      key={g.id}
                      className="border-b border-subtle last:border-0 hover:bg-surface-2 transition-colors duration-[120ms]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarFallback className="text-[10px] font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[13px] font-medium leading-[18px] text-fg">
                            {g.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-xs px-5 py-3">
                        <span className="text-[13px] leading-[18px] text-fg">{g.title}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <PerfProgressBar
                            value={g.progressPct}
                            color={gs.color}
                            className="flex-1"
                          />
                          <span className="min-w-[2.25rem] text-right font-mono text-[12px] font-medium leading-4 tabular-nums text-fg-muted">
                            {g.progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-[12px] text-fg-muted">{g.dueDate}</td>
                      <td className="px-5 py-3">
                        <Badge variant={gs.variant} dot>
                          {g.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <AddGoalDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
