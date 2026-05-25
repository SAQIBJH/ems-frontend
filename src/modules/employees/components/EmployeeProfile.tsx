'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import {
  BriefcaseIcon,
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';

import { useEmployee } from '../hooks/useEmployee';
import { useDeleteEmployee } from '../hooks/useEmployeeMutations';
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS } from '../constants';
import type {
  EmployeeDetail,
  EmploymentStatus,
  EmploymentType,
  LeaveBalance,
} from '../types/employee.types';

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

/* ── Status badge ─────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: EmploymentStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge
        variant="outline"
        className="border-success/40 bg-success/10 text-success text-[11px] font-medium"
      >
        {EMPLOYMENT_STATUS_LABELS.ACTIVE}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-fg-disabled/40 bg-surface-2 text-fg-muted text-[11px] font-medium"
    >
      {EMPLOYMENT_STATUS_LABELS.TERMINATED}
    </Badge>
  );
}

/* ── Detail row ───────────────────────────────────────────────────────────── */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2">
        <Icon className="size-4 text-fg-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="text-sm font-medium text-fg">{value ?? '—'}</p>
      </div>
    </div>
  );
}

/* ── Overview tab ─────────────────────────────────────────────────────────── */

function OverviewTab({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-subtle bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Contact
        </h3>
        <Separator className="mb-2" />
        <DetailRow icon={MailIcon} label="Work email" value={employee.workEmail} />
        <DetailRow icon={MailIcon} label="Personal email" value={employee.personalEmail} />
        <DetailRow icon={PhoneIcon} label="Phone" value={employee.phone} />
        <DetailRow icon={MapPinIcon} label="Address" value={employee.address} />
      </div>

      <div className="rounded-lg border border-subtle bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Personal
        </h3>
        <Separator className="mb-2" />
        <DetailRow
          icon={CalendarIcon}
          label="Date of birth"
          value={formatDate(employee.dateOfBirth)}
        />
        <DetailRow
          icon={UserIcon}
          label="Gender"
          value={
            employee.gender
              ? employee.gender.charAt(0) + employee.gender.slice(1).toLowerCase()
              : null
          }
        />
        <DetailRow icon={MapPinIcon} label="Location" value={employee.location} />
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
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-subtle bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Employment
        </h3>
        <Separator className="mb-2" />
        <DetailRow icon={BriefcaseIcon} label="Employee code" value={employee.employeeCode} />
        <DetailRow icon={BriefcaseIcon} label="Designation" value={employee.designation} />
        <DetailRow
          icon={BriefcaseIcon}
          label="Employment type"
          value={EMPLOYMENT_TYPE_LABELS[employee.employmentType as EmploymentType]}
        />
        <DetailRow icon={CalendarIcon} label="Joined on" value={formatDate(employee.joinedOn)} />
      </div>

      <div className="rounded-lg border border-subtle bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Organisation
        </h3>
        <Separator className="mb-2" />
        <DetailRow icon={BriefcaseIcon} label="Department" value={employee.department?.name} />
        <DetailRow icon={MapPinIcon} label="Work location" value={employee.location} />
        <DetailRow icon={UserIcon} label="Manager" value={managerName} />
        <DetailRow icon={BriefcaseIcon} label="Pay currency" value={employee.payCurrency} />
      </div>
    </div>
  );
}

/* ── Documents tab (placeholder) ─────────────────────────────────────────── */

function DocumentsTab() {
  return (
    <EmptyState
      title="Documents"
      description="Document upload is not yet available. Check back soon."
      icon={<FileTextIcon className="size-6 text-fg-muted" aria-hidden />}
    />
  );
}

/* ── Attendance tab (placeholder) ────────────────────────────────────────── */

function AttendanceTab() {
  return (
    <EmptyState
      title="Attendance records"
      description="Attendance details will be available here."
      icon={<CalendarIcon className="size-6 text-fg-muted" aria-hidden />}
    />
  );
}

/* ── Leave tab ────────────────────────────────────────────────────────────── */

function LeaveTab({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) {
    return (
      <EmptyState
        title="No leave balances"
        description="Leave balances have not been configured for this employee."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((b) => (
        <div
          key={b.leaveTypeId}
          className="space-y-3 rounded-lg border border-subtle bg-surface p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">{b.leaveType.name}</span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {b.leaveType.code}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="tabular-nums text-xl font-semibold text-fg">{b.balance}</p>
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">Available</p>
            </div>
            <div>
              <p className="tabular-nums text-xl font-semibold text-fg">{b.used}</p>
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">Used</p>
            </div>
            <div>
              <p className="tabular-nums text-xl font-semibold text-warning">{b.pending}</p>
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">Pending</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Activity tab (placeholder) ──────────────────────────────────────────── */

function ActivityTab() {
  return (
    <EmptyState
      title="Activity log"
      description="Audit trail for this employee will appear here."
      icon={<FileTextIcon className="size-6 text-fg-muted" aria-hidden />}
    />
  );
}

/* ── Profile skeleton ─────────────────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <>
      <div className="border-b border-subtle bg-surface px-6 py-6">
        <div className="flex items-start gap-5">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="mt-2 h-5 w-24" />
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6 py-6">
        <Skeleton className="h-9 w-80" />
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Skeleton className="h-52 rounded-lg" />
          <Skeleton className="h-52 rounded-lg" />
        </div>
      </div>
    </>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function EmployeeProfile({ id }: { id: string }) {
  const router = useRouter();
  const { permissions } = useAuth();
  const [showTerminate, setShowTerminate] = useState(false);

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id);
  const deleteMutation = useDeleteEmployee();

  async function handleTerminate() {
    if (!employee) return;
    try {
      await deleteMutation.mutateAsync(employee.id);
      toast.success(`${employee.firstName} ${employee.lastName} has been terminated.`);
      setShowTerminate(false);
      router.push('/employees');
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

  /* Empty (should not happen but keeps the four-state contract) */
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
                  size="default"
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

      {/* Profile header */}
      <div className="border-b border-subtle bg-surface px-6 py-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar className="size-16 shrink-0">
            <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-fg">{fullName}</h2>
              <StatusBadge status={employee.employmentStatus} />
            </div>
            <p className="mt-0.5 text-sm text-fg-muted">
              {employee.designation}
              {employee.department && (
                <span className="text-fg-subtle"> · {employee.department.name}</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-fg-muted">
              <span>{employee.employeeCode}</span>
              {employee.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3" aria-hidden />
                  {employee.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" aria-hidden />
                Joined {formatDate(employee.joinedOn)}
              </span>
              {employee.user && <span>{employee.user.memberType.replace(/_/g, ' ')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="job">Job</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab employee={employee} />
          </TabsContent>
          <TabsContent value="job">
            <JobTab employee={employee} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceTab />
          </TabsContent>
          <TabsContent value="leave">
            <LeaveTab balances={employee.leaveBalances} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={showTerminate}
        onOpenChange={setShowTerminate}
        title="Terminate employee?"
        description={`${fullName}'s employment will be marked as terminated. This action can be reversed by an administrator.`}
        confirmLabel="Terminate"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleTerminate}
      />
    </>
  );
}
