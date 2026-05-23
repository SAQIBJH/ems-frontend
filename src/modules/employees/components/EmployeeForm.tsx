'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { DynamicForm } from '@/shared/engines/DynamicForm';
import type { FormSectionConfig } from '@/shared/engines/DynamicForm';
import type { ApiError } from '@/types/api';

import {
  employeeCreateSchema,
  type EmployeeCreateFormValues,
} from '../validations/employee.schema';
import { EMPLOYMENT_TYPE_LABELS } from '../constants';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import type {
  EmployeeCreateInput,
  EmployeeDetail,
  EmploymentType,
  Gender,
} from '../types/employee.types';
import { useEmployee } from '../hooks/useEmployee';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployeeMutations';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

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
  const { data: deptList } = useDepartments();
  const flatDepts = flattenDepartmentTree(deptList ?? []);

  const form = useForm<EmployeeCreateFormValues>({
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

  const { reset } = form;
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
          form.setError(field as keyof EmployeeCreateFormValues, { message });
        });
        return;
      }

      if (status === 409) {
        if (apiError?.code === 'DUPLICATE_EMPLOYEE_CODE') {
          form.setError('employeeCode', { message: 'This employee code is already taken.' });
          return;
        }
        if (apiError?.code === 'DUPLICATE_WORK_EMAIL') {
          form.setError('workEmail', { message: 'This email is already in use.' });
          return;
        }
      }

      toast.error(apiError?.message ?? 'Failed to save employee. Please try again.');
    }
  }

  const isPending =
    form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending;
  const cancelHref = mode === 'edit' && employee ? `/employees/${employee.id}` : '/employees';

  const sections: FormSectionConfig<EmployeeCreateFormValues>[] = [
    {
      title: 'Employee information',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First name',
          placeholder: 'Jane',
          required: true,
        },
        { name: 'lastName', type: 'text', label: 'Last name', placeholder: 'Doe', required: true },
        {
          name: 'workEmail',
          type: 'email',
          label: 'Work email',
          placeholder: 'jane.doe@company.com',
          required: true,
        },
        {
          name: 'employeeCode',
          type: 'text',
          label: 'Employee code',
          placeholder: 'E0042',
          required: true,
        },
        {
          name: 'designation',
          type: 'text',
          label: 'Designation',
          placeholder: 'Software Engineer',
          required: true,
        },
        {
          name: 'departmentId',
          label: 'Department',
          required: true,
          render: ({ field, error }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="df-departmentId" className="w-full" aria-invalid={!!error}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {flatDepts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.depth > 0 ? `${'—'.repeat(d.depth)} ` : ''}
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        },
        {
          name: 'employmentType',
          type: 'select',
          label: 'Employment type',
          required: true,
          options: (Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
            ([value, label]) => ({ value, label }),
          ),
        },
        { name: 'joinedOn', type: 'date', label: 'Joined on', required: true },
      ],
    },
    {
      title: 'Additional details',
      fields: [
        { name: 'phone', type: 'tel', label: 'Phone', placeholder: '+91 98765 43210' },
        {
          name: 'personalEmail',
          type: 'email',
          label: 'Personal email',
          placeholder: 'jane@gmail.com',
        },
        { name: 'location', type: 'text', label: 'Location', placeholder: 'Mumbai' },
        {
          name: 'gender',
          type: 'select',
          label: 'Gender',
          options: [
            { value: '', label: 'Not specified' },
            { value: 'MALE', label: 'Male' },
            { value: 'FEMALE', label: 'Female' },
            { value: 'OTHER', label: 'Other' },
          ],
        },
        { name: 'dateOfBirth', type: 'date', label: 'Date of birth' },
        {
          name: 'managerId',
          type: 'text',
          label: 'Manager ID',
          placeholder: 'Employee ID of their manager',
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Address',
          placeholder: 'Street, city, state',
          rows: 3,
          colSpan: 2,
        },
      ],
    },
  ];

  return (
    <DynamicForm
      form={form}
      sections={sections}
      onSubmit={onSubmit}
      submitLabel={mode === 'create' ? 'Create employee' : 'Save changes'}
      cancelHref={cancelHref}
      isPending={isPending}
    />
  );
}

/* ── Edit wrapper ─────────────────────────────────────────────────────────── */

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
