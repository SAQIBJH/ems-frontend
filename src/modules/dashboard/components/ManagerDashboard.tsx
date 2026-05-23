'use client';

import { UsersIcon, ClipboardListIcon, CalendarCheckIcon } from 'lucide-react';
import { StatsCard } from '@/components/data-display/StatsCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useManagerDashboard, useManagerTeam } from '../hooks/useDashboard';
import type { TeamMember } from '../types/dashboard.types';

function TeamMemberRow({ member }: { member: TeamMember }) {
  const initials = (member.firstName[0] ?? '') + (member.lastName[0] ?? '');

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
        {initials.toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {member.firstName} {member.lastName}
        </p>
        <p className="truncate text-xs text-fg-muted">{member.designation}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          member.employmentStatus === 'ACTIVE'
            ? 'bg-success/10 text-success'
            : 'bg-fg-muted/10 text-fg-muted'
        }`}
      >
        {member.employmentStatus}
      </span>
    </li>
  );
}

function TeamList() {
  const { data, isLoading, isError, refetch } = useManagerTeam();

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">My Team</h2>
      </div>
      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
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
            <ErrorState message="Failed to load team" onRetry={() => refetch()} />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">No team members found.</p>
        ) : (
          <ul className="divide-y divide-subtle">
            {data.map((member) => (
              <TeamMemberRow key={member.id} member={member} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ManagerDashboard() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useManagerDashboard();

  return (
    <div className="space-y-6 p-6">
      {summaryError ? (
        <ErrorState message="Failed to load dashboard" onRetry={() => refetchSummary()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard
            label="Team Size"
            value={summary?.teamSize ?? 0}
            icon={<UsersIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
          />
          <StatsCard
            label="Pending Approvals"
            value={summary?.pendingApprovals ?? 0}
            icon={<ClipboardListIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
            href="/leave"
          />
          <StatsCard
            label="Today's Check-ins"
            value={
              typeof summary?.todayAttendance?.present === 'number'
                ? summary.todayAttendance.present
                : '—'
            }
            icon={<CalendarCheckIcon className="size-4" aria-hidden />}
            loading={summaryLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TeamList />

        {/* Quick links */}
        <div className="rounded-lg border border-subtle bg-surface">
          <div className="border-b border-subtle px-5 py-3">
            <h2 className="text-sm font-medium text-fg">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              { label: 'View Leave Requests', href: '/leave', icon: ClipboardListIcon },
              { label: 'Attendance Records', href: '/attendance', icon: CalendarCheckIcon },
              { label: 'Employee Directory', href: '/employees', icon: UsersIcon },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg border border-subtle bg-surface-2 px-4 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface hover:border-default-border"
              >
                <Icon className="size-4 text-fg-muted" aria-hidden />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
