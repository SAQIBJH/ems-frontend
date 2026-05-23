'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { Loader2Icon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/shared/layouts/PageHeader';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';

import {
  employeeCreateSchema,
  type EmployeeCreateFormValues,
} from '../validations/employee.schema';
import { EMPLOYMENT_TYPE_LABELS, KNOWN_DEPARTMENTS } from '../constants';
import type {
  EmployeeCreateInput,
  EmployeeDetail,
  EmploymentType,
  Gender,
} from '../types/employee.types';
import { useEmployee } from '../hooks/useEmployee';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployeeMutations';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** ISO string from API → 'YYYY-MM-DD' for <input type="date"> */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/** Trim empty strings to undefined before calling the API. */
function buildPayload(values: EmployeeCreateFormValues): EmployeeCreateInput {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    workEmail: values.workEmail,
    employeeCode: values.employeeCode,
    employmentType: values.employmentType as EmploymentType,
    joinedOn: values.joinedOn,
    designation: values.designation,
    departmentId: values.departmentId,
    managerId: values.managerId || undefined,
    phone: values.phone || undefined,
    location: values.location || undefined,
    address: values.address || undefined,
    gender: (values.gender as Gender) || undefined,
    dateOfBirth: values.dateOfBirth || undefined,
    personalEmail: values.personalEmail || undefined,
  };
}

/* ── Tiny form-field helpers ──────────────────────────────────────────────── */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <Separator />
    </div>
  );
}

/* ── Inner form ───────────────────────────────────────────────────────────── */

function EmployeeFormInner({
  mode,
  employee,
}: {
  mode: 'create' | 'edit';
  employee?: EmployeeDetail;
}) {
  const router = useRouter();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeCreateFormValues>({
    resolver: zodResolver(employeeCreateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      workEmail: '',
      employeeCode: '',
      employmentType: 'FULL_TIME',
      joinedOn: '',
      designation: '',
      departmentId: '',
      managerId: '',
      phone: '',
      location: '',
      address: '',
      gender: '',
      dateOfBirth: '',
      personalEmail: '',
    },
  });

  /* Populate form fields when editing */
  useEffect(() => {
    if (mode === 'edit' && employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        workEmail: employee.workEmail,
        employeeCode: employee.employeeCode,
        employmentType: employee.employmentType,
        joinedOn: toDateInput(employee.joinedOn),
        designation: employee.designation,
        departmentId: employee.departmentId,
        managerId: employee.managerId ?? '',
        phone: employee.phone ?? '',
        location: employee.location ?? '',
        address: employee.address ?? '',
        gender: employee.gender ?? '',
        dateOfBirth: toDateInput(employee.dateOfBirth),
        personalEmail: employee.personalEmail ?? '',
      });
    }
  }, [mode, employee, reset]);

  async function onSubmit(values: EmployeeCreateFormValues) {
    const payload = buildPayload(values);
    try {
      let saved: EmployeeDetail;

      if (mode === 'create') {
        saved = await createMutation.mutateAsync(payload);
        toast.success('Employee created successfully.');
      } else {
        saved = await updateMutation.mutateAsync({ id: employee!.id, ...payload });
        toast.success('Employee updated successfully.');
      }

      router.push(`/employees/${saved.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      const apiError = axiosErr.response?.data?.error;

      if (status === 422 && Array.isArray(apiError?.details)) {
        apiError.details.forEach(({ field, message }: { field: string; message: string }) => {
          setError(field as keyof EmployeeCreateFormValues, { message });
        });
        return;
      }

      if (status === 409) {
        if (apiError?.code === 'DUPLICATE_EMPLOYEE_CODE') {
          setError('employeeCode', { message: 'This employee code is already taken.' });
          return;
        }
        if (apiError?.code === 'DUPLICATE_WORK_EMAIL') {
          setError('workEmail', { message: 'This email is already in use.' });
          return;
        }
      }

      toast.error(apiError?.message ?? 'Failed to save employee. Please try again.');
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const cancelHref = mode === 'edit' && employee ? `/employees/${employee.id}` : '/employees';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-8 px-6 py-6">
        {/* ── Section 1: Required fields ──────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeader title="Employee information" />
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">
                First name{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="firstName"
                placeholder="Jane"
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
              <FieldError message={errors.firstName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">
                Last name{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
              <FieldError message={errors.lastName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="workEmail">
                Work email{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="workEmail"
                type="email"
                placeholder="jane.doe@company.com"
                aria-invalid={!!errors.workEmail}
                {...register('workEmail')}
              />
              <FieldError message={errors.workEmail?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employeeCode">
                Employee code{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="employeeCode"
                placeholder="E0042"
                aria-invalid={!!errors.employeeCode}
                {...register('employeeCode')}
              />
              <FieldError message={errors.employeeCode?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation">
                Designation{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="designation"
                placeholder="Software Engineer"
                aria-invalid={!!errors.designation}
                {...register('designation')}
              />
              <FieldError message={errors.designation?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dept-trigger">
                Department{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="dept-trigger"
                      className="w-full"
                      aria-invalid={!!errors.departmentId}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {KNOWN_DEPARTMENTS.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.departmentId?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emptype-trigger">
                Employment type{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Controller
                control={control}
                name="employmentType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="emptype-trigger"
                      className="w-full"
                      aria-invalid={!!errors.employmentType}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.employmentType?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="joinedOn">
                Joined on{' '}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="joinedOn"
                type="date"
                aria-invalid={!!errors.joinedOn}
                {...register('joinedOn')}
              />
              <FieldError message={errors.joinedOn?.message} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Optional fields ──────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeader title="Additional details" />
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="personalEmail">Personal email</Label>
              <Input
                id="personalEmail"
                type="email"
                placeholder="jane@gmail.com"
                aria-invalid={!!errors.personalEmail}
                {...register('personalEmail')}
              />
              <FieldError message={errors.personalEmail?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Mumbai"
                aria-invalid={!!errors.location}
                {...register('location')}
              />
              <FieldError message={errors.location?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender-trigger">Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="gender-trigger"
                      className="w-full"
                      aria-invalid={!!errors.gender}
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not specified</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.gender?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                aria-invalid={!!errors.dateOfBirth}
                {...register('dateOfBirth')}
              />
              <FieldError message={errors.dateOfBirth?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="managerId">Manager ID</Label>
              <Input
                id="managerId"
                placeholder="Employee ID of their manager"
                aria-invalid={!!errors.managerId}
                {...register('managerId')}
              />
              <FieldError message={errors.managerId?.message} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Street, city, state"
                rows={3}
                aria-invalid={!!errors.address}
                {...register('address')}
              />
              <FieldError message={errors.address?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-subtle bg-canvas/95 px-6 py-4 backdrop-blur-sm">
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          aria-disabled={isPending}
        >
          Cancel
        </Link>
        <Button type="submit" size="sm" disabled={isPending} aria-busy={isPending}>
          {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
          {mode === 'create' ? 'Create employee' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

/* ── Edit wrapper — loads employee data, handles loading / error ──────────── */

function EditForm({ employeeId }: { employeeId: string }) {
  const { data: employee, isLoading, isError, error, refetch } = useEmployee(employeeId);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Edit Employee"
          breadcrumbs={[
            { label: 'Employees', href: '/employees' },
            { label: 'Profile', href: `/employees/${employeeId}` },
            { label: 'Edit' },
          ]}
        />
        <div className="space-y-8 px-6 py-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-px w-full" />
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    const axiosErr = error as AxiosError<ApiError>;
    const status = axiosErr.response?.status;
    const message =
      status === 404
        ? 'Employee not found.'
        : (axiosErr.response?.data?.error?.message ?? 'Failed to load employee.');
    return (
      <>
        <PageHeader
          title="Edit Employee"
          breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: 'Edit' }]}
        />
        <div className="px-6 py-6">
          <ErrorState message={message} onRetry={status !== 404 ? () => refetch() : undefined} />
        </div>
      </>
    );
  }

  if (!employee) return null;

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <>
      <PageHeader
        title={`Edit ${fullName}`}
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: fullName, href: `/employees/${employeeId}` },
          { label: 'Edit' },
        ]}
      />
      <EmployeeFormInner mode="edit" employee={employee} />
    </>
  );
}

/* ── Public component ─────────────────────────────────────────────────────── */

type EmployeeFormProps = { mode: 'create' } | { mode: 'edit'; employeeId: string };

export function EmployeeForm(props: EmployeeFormProps) {
  if (props.mode === 'edit') {
    return <EditForm employeeId={props.employeeId} />;
  }

  return (
    <>
      <PageHeader
        title="New Employee"
        breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: 'New employee' }]}
      />
      <EmployeeFormInner mode="create" />
    </>
  );
}
