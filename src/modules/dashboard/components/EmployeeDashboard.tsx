'use client';

import { useState } from 'react';
import { CalendarPlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers';
import { NewLeaveRequestDialog } from '@/modules/leave/components/NewLeaveRequestDialog';

import { useEmployeeDashboard, useEmployeeTeam } from '../hooks/useDashboard';
import { TodayAttendanceCard } from './TodayAttendanceCard';
import { LeaveBalanceMiniCard } from './LeaveBalanceMiniCard';
import { UpcomingHolidaysCard } from './UpcomingHolidaysCard';
import { MyDocumentsCard } from './MyDocumentsCard';
import type { TeamPerson } from '../types/dashboard.types';

function TeamPersonRow({ person, isManager }: { person: TeamPerson; isManager?: boolean }) {
  const initials = person.name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{person.name}</p>
        <p className="truncate text-xs text-fg-muted">{person.designation}</p>
      </div>
      {isManager && (
        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand">
          Manager
        </span>
      )}
    </li>
  );
}

function MyTeamPanel() {
  const { data, isLoading, isError, refetch } = useEmployeeTeam();
  const hasContent = data && (data.manager || (data.peers && data.peers.length > 0));

  return (
    <div className="rounded-xl border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">My Team</h2>
      </div>
      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-xs text-danger"
            >
              Failed to load team — Retry
            </Button>
          </div>
        ) : !hasContent ? (
          <p className="py-6 text-center text-sm text-fg-muted">No team members found.</p>
        ) : (
          <ul className="divide-y divide-subtle">
            {data.manager && <TeamPersonRow person={data.manager} isManager />}
            {data.peers.map((peer, i) => (
              <TeamPersonRow key={peer.email ?? i} person={peer} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useEmployeeDashboard();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const firstName = user?.employee?.firstName ?? data?.employeeName?.split(' ')[0] ?? '';
  const subtitle = data ? `${data.designation} · ${data.department}` : null;

  return (
    <div className="space-y-6 p-6">
      {/* Greeting + action */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-fg">Hi, {firstName}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
            </>
          )}
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={() => setLeaveDialogOpen(true)}>
          <CalendarPlusIcon className="size-4" aria-hidden />
          Request leave
        </Button>
      </div>

      {/* Row 1: 3-column cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TodayAttendanceCard />
        <LeaveBalanceMiniCard />
        <UpcomingHolidaysCard />
      </div>

      {/* Row 2: 2-column panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MyDocumentsCard />
        <MyTeamPanel />
      </div>

      <NewLeaveRequestDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen} />
    </div>
  );
}
