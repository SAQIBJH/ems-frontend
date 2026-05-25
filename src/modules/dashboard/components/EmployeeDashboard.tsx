'use client';

import Link from 'next/link';
import { CalendarIcon, ClipboardListIcon, UsersIcon } from 'lucide-react';
import { StatsCard } from '@/components/data-display/StatsCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers';
import { useEmployeeDashboard, useEmployeeTeam } from '../hooks/useDashboard';
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
    </li>
  );
}

function EmployeeTeamPanel() {
  const { data, isLoading, isError, refetch } = useEmployeeTeam();

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="border-b border-subtle px-5 py-3">
        <h2 className="text-sm font-medium text-fg">My Team</h2>
      </div>
      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
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

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useEmployeeDashboard();

  const displayName =
    data?.employeeName ??
    (user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.email ?? ''));

  const firstName = user?.employee?.firstName ?? displayName.split(' ')[0];

  return (
    <div className="space-y-6 p-6">
      {/* Greeting */}
      <div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Hi, {firstName}</h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              {data?.designation ? `${data.designation} · ${data.department}` : 'Welcome back.'}
            </p>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Pending Leave Requests"
          value={data?.pendingLeaves ?? 0}
          icon={<ClipboardListIcon className="size-4" aria-hidden />}
          loading={isLoading}
          href="/leave"
        />
        <StatsCard
          label="My Attendance"
          value="View"
          icon={<CalendarIcon className="size-4" aria-hidden />}
          loading={false}
          href="/attendance"
        />
        <StatsCard
          label="Team Members"
          value="View"
          icon={<UsersIcon className="size-4" aria-hidden />}
          loading={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <EmployeeTeamPanel />

        {/* Quick links */}
        <div className="rounded-lg border border-subtle bg-surface">
          <div className="border-b border-subtle px-5 py-3">
            <h2 className="text-sm font-medium text-fg">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {[
              { label: 'Request Leave', href: '/leave', icon: CalendarIcon },
              { label: 'View Attendance', href: '/attendance', icon: CalendarIcon },
              { label: 'Upcoming Holidays', href: '/holidays', icon: CalendarIcon },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg border border-subtle bg-surface-2 px-4 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface hover:border-default-border"
              >
                <Icon className="size-4 text-fg-muted" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
