'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { BriefcaseIcon, EditIcon, MailIcon, PhoneIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { SectionCard } from '@/components/data-display/SectionCard';
import { InfoRow } from '@/components/data-display/InfoRow';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TypeToConfirmDialog } from '@/components/feedback/TypeToConfirmDialog';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';

import { useEmployee } from '../hooks/useEmployee';
import { useDeleteEmployee } from '../hooks/useEmployeeMutations';
import { EMPLOYMENT_TYPE_LABELS } from '../constants';
import type { EmployeeDetail, EmploymentType } from '../types/employee.types';
import { StatusBadge } from './StatusBadge';
import { DocumentsTab } from './DocumentsTab';
import { AttendanceTab } from './AttendanceTab';
import { LeaveTab } from './LeaveTab';
import { ActivityTab } from './ActivityTab';
import { CompensationTab } from './CompensationTab';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/* ── Overview tab ─────────────────────────────────────────────────────────── */

function OverviewTab({ employee }: { employee: EmployeeDetail }) {
  const managerName = employee.manager
    ? `${employee.manager.firstName} ${employee.manager.lastName}`
    : null;

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* Left — personal details */}
      <div className="xl:col-span-2">
        <SectionCard title="Personal details" noPad>
          <div className="px-5">
            <InfoRow label="Employee code">
              <span className="font-mono text-xs">{employee.employeeCode}</span>
            </InfoRow>
            <InfoRow label="Work email">
              <a href={`mailto:${employee.workEmail}`} className="text-brand hover:underline">
                {employee.workEmail}
              </a>
            </InfoRow>
            {employee.personalEmail && (
              <InfoRow label="Personal email">
                <a href={`mailto:${employee.personalEmail}`} className="text-brand hover:underline">
                  {employee.personalEmail}
                </a>
              </InfoRow>
            )}
            {employee.phone && <InfoRow label="Phone">{employee.phone}</InfoRow>}
            {employee.address && <InfoRow label="Address">{employee.address}</InfoRow>}
            {employee.dateOfBirth && (
              <InfoRow label="Date of birth">{formatDate(employee.dateOfBirth)}</InfoRow>
            )}
            {employee.gender && (
              <InfoRow label="Gender">
                {employee.gender.charAt(0) + employee.gender.slice(1).toLowerCase()}
              </InfoRow>
            )}
            {employee.location && <InfoRow label="Location">{employee.location}</InfoRow>}
          </div>
        </SectionCard>
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-4">
        <SectionCard title="Employment" noPad>
          <div className="px-5">
            <InfoRow label="Designation">{employee.designation}</InfoRow>
            <InfoRow label="Department">{employee.department?.name}</InfoRow>
            <InfoRow label="Type">
              {EMPLOYMENT_TYPE_LABELS[employee.employmentType as EmploymentType]}
            </InfoRow>
            <InfoRow label="Joined">{formatDate(employee.joinedOn)}</InfoRow>
            {managerName && <InfoRow label="Manager">{managerName}</InfoRow>}
          </div>
        </SectionCard>

        {employee.documents.length > 0 && (
          <SectionCard title="Documents" noPad>
            {employee.documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border-b border-subtle px-5 py-2.5 last:border-0"
              >
                <span className="truncate text-sm text-fg">
                  {doc.documentType.replace(/_/g, ' ')}
                </span>
                {doc.verificationStatus === 'VERIFIED' ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-success/40 bg-success/10 text-success text-[11px]"
                  >
                    Verified
                  </Badge>
                ) : doc.verificationStatus === 'REJECTED' ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-danger/40 bg-danger/10 text-danger text-[11px]"
                  >
                    Rejected
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-warning/40 bg-warning/10 text-warning text-[11px]"
                  >
                    Pending
                  </Badge>
                )}
              </div>
            ))}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

/* ── Job tab ──────────────────────────────────────────────────────────────── */

function JobTab({ employee }: { employee: EmployeeDetail }) {
  const managerName = employee.manager
    ? `${employee.manager.firstName} ${employee.manager.lastName}`
    : null;

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SectionCard title="Employment" noPad>
          <div className="px-5">
            <InfoRow label="Employee code">
              <span className="font-mono text-xs">{employee.employeeCode}</span>
            </InfoRow>
            <InfoRow label="Designation">{employee.designation}</InfoRow>
            <InfoRow label="Department">{employee.department?.name}</InfoRow>
            <InfoRow label="Employment type">
              {EMPLOYMENT_TYPE_LABELS[employee.employmentType as EmploymentType]}
            </InfoRow>
            <InfoRow label="Joined">{formatDate(employee.joinedOn)}</InfoRow>
            {managerName && <InfoRow label="Manager">{managerName}</InfoRow>}
            {employee.location && <InfoRow label="Work location">{employee.location}</InfoRow>}
            {employee.payCurrency && <InfoRow label="Pay currency">{employee.payCurrency}</InfoRow>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ── Profile skeleton ─────────────────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <div className="flex items-center gap-5">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="mt-1 h-4 w-80" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="xl:col-span-2 h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function EmployeeProfile({ id }: { id: string }) {
  const { permissions, user: viewer } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTerminate, setShowTerminate] = useState(false);

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id);
  const deleteMutation = useDeleteEmployee();

  const showCompensation =
    viewer?.memberType === 'HR_ADMIN' || viewer?.memberType === 'SUPER_ADMIN';

  const TABS = [
    { value: 'overview', label: 'Overview' },
    { value: 'job', label: 'Job' },
    ...(showCompensation ? [{ value: 'compensation', label: 'Compensation' }] : []),
    { value: 'documents', label: 'Documents' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'leave', label: 'Leave' },
    { value: 'activity', label: 'Activity' },
  ];

  async function handleTerminate() {
    if (!employee) return;
    try {
      await deleteMutation.mutateAsync(employee.id);
      toast.success(`${employee.firstName} ${employee.lastName} has been terminated.`);
      setShowTerminate(false);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to terminate employee.');
    }
  }

  /* Loading */
  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Employee Profile"
          breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: 'Profile' }]}
        />
        <ProfileSkeleton />
      </>
    );
  }

  /* Error */
  if (isError) {
    const axiosErr = error as AxiosError<ApiError>;
    const status = axiosErr.response?.status;
    const message =
      status === 404
        ? 'Employee not found.'
        : (axiosErr.response?.data?.error?.message ?? 'Failed to load employee profile.');
    return (
      <>
        <PageHeader
          title="Employee Profile"
          breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: 'Profile' }]}
        />
        <div className="px-6 py-6">
          <ErrorState message={message} onRetry={status !== 404 ? () => refetch() : undefined} />
        </div>
      </>
    );
  }

  /* Empty */
  if (!employee) {
    return (
      <>
        <PageHeader
          title="Employee Profile"
          breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: 'Profile' }]}
        />
        <div className="px-6 py-6">
          <EmptyState
            title="Employee not found"
            description="This employee record does not exist."
          />
        </div>
      </>
    );
  }

  /* Success */
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = getInitials(employee.firstName, employee.lastName);
  const canTerminate =
    permissions.includes('employees:delete') && employee.employmentStatus !== 'TERMINATED';

  return (
    <>
      <PageHeader
        title={fullName}
        breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: fullName }]}
        actions={
          <div className="flex items-center gap-2">
            <PermissionWrapper permission="employees:write">
              <Link
                href={`/employees/${id}/edit`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
              >
                <EditIcon className="size-4" aria-hidden />
                Edit
              </Link>
            </PermissionWrapper>
            {canTerminate && (
              <PermissionWrapper permission="employees:delete">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-danger/30 text-danger hover:bg-danger/5 hover:text-danger"
                  onClick={() => setShowTerminate(true)}
                >
                  Terminate
                </Button>
              </PermissionWrapper>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Identity card */}
        <div className="rounded-xl border border-subtle bg-surface p-6">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar className="size-14 shrink-0">
              <AvatarFallback className="bg-brand-50 text-base font-semibold text-brand">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-[-0.01em] text-fg">{fullName}</h2>
                <StatusBadge status={employee.employmentStatus} />
                <Badge variant="outline" className="text-[11px]">
                  {EMPLOYMENT_TYPE_LABELS[employee.employmentType as EmploymentType]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                {employee.designation}
                {employee.department && (
                  <span className="text-fg-subtle"> · {employee.department.name}</span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
                {employee.workEmail && (
                  <span className="flex items-center gap-1.5">
                    <MailIcon className="size-3.5 shrink-0" aria-hidden />
                    {employee.workEmail}
                  </span>
                )}
                {employee.phone && (
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 shrink-0" aria-hidden />
                    {employee.phone}
                  </span>
                )}
                {employee.manager && (
                  <span className="flex items-center gap-1.5">
                    <BriefcaseIcon className="size-3.5 shrink-0" aria-hidden />
                    Reports to {employee.manager.firstName} {employee.manager.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Terminated banner */}
        {employee.employmentStatus === 'TERMINATED' && (
          <div className="-mt-2 rounded-lg border border-warning/20 bg-warning/5 px-5 py-3">
            <p className="text-sm text-warning">
              This employee has been terminated. Their account access has been revoked.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="-mt-2 flex gap-0 border-b border-subtle" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={activeTab === t.value}
              onClick={() => setActiveTab(t.value)}
              className={cn(
                '-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                activeTab === t.value
                  ? 'border-brand text-brand'
                  : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab employee={employee} />}
        {activeTab === 'job' && <JobTab employee={employee} />}
        {activeTab === 'compensation' && <CompensationTab employeeId={id} />}
        {activeTab === 'documents' && <DocumentsTab employeeId={id} />}
        {activeTab === 'attendance' && <AttendanceTab employeeId={id} />}
        {activeTab === 'leave' && <LeaveTab balances={employee.leaveBalances} employeeId={id} />}
        {activeTab === 'activity' && <ActivityTab employeeId={id} />}
      </div>

      <TypeToConfirmDialog
        open={showTerminate}
        onOpenChange={setShowTerminate}
        title="Terminate employee?"
        description={`${fullName}'s employment will be marked as terminated. This action can be reversed by an administrator.`}
        confirmText={employee.employeeCode}
        confirmLabel="Terminate"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleTerminate}
      />
    </>
  );
}
