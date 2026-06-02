'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useTenantSettings } from '../hooks/useSettings';
import { useUpdateTenantSettings } from '../hooks/useSettingsMutations';
import { TIMEZONES, MONTH_NAMES } from '../constants';
import { FormRow, PanelHeader } from './FormRow';

// Extended schema that covers all company profile fields plus the hidden working-hours fields
const companyProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  // kept in form but not rendered — submitted unchanged from server data
  working_hours_start: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  working_hours_end: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  // new optional identity fields
  displayName: z.string().optional(),
  legalName: z.string().optional(),
  country: z.string().optional(),
  primaryContactEmail: z.string().email('Must be a valid email').or(z.literal('')).optional(),
  defaultCurrency: z.string().optional(),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

function CompanyProfileSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-subtle">
      {/* Header skeleton */}
      <div className="pb-5 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-6 py-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 max-w-[480px] w-full" />
        </div>
      ))}
      <div className="pt-6 flex gap-3">
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

export function CompanyProfilePanel() {
  const { data, isLoading, isError, refetch } = useTenantSettings();
  const mutation = useUpdateTenantSettings();

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      company_name: '',
      timezone: '',
      working_hours_start: '',
      working_hours_end: '',
      displayName: '',
      legalName: '',
      country: '',
      primaryContactEmail: '',
      defaultCurrency: '',
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        company_name: data.company_name,
        timezone: data.timezone,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
        displayName: data.displayName ?? '',
        legalName: data.legalName ?? '',
        country: data.country ?? '',
        primaryContactEmail: data.primaryContactEmail ?? '',
        defaultCurrency: data.defaultCurrency ?? '',
      });
    }
  }, [data, form]);

  function onSubmit(values: CompanyProfileFormValues) {
    mutation.mutate(
      {
        company_name: values.company_name,
        timezone: values.timezone,
        working_hours_start: values.working_hours_start,
        working_hours_end: values.working_hours_end,
        displayName: values.displayName || undefined,
        legalName: values.legalName || undefined,
        country: values.country || undefined,
        primaryContactEmail: values.primaryContactEmail || undefined,
        defaultCurrency: values.defaultCurrency || undefined,
      },
      {
        onSuccess: () => toast.success('Company profile saved'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save company profile');
        },
      },
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load company settings." onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return <CompanyProfileSkeleton />;
  }

  return (
    <div>
      <PanelHeader
        section="Organization"
        title="Company Profile"
        description="How your company appears across the platform."
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="divide-y divide-subtle">
          {/* Company Name */}
          <FormRow label="Company Name" help="Shown in invitations and emails.">
            <Input id="company_name" {...form.register('company_name')} placeholder="Acme Corp" />
            {form.formState.errors.company_name && (
              <p className="text-xs text-danger">{form.formState.errors.company_name.message}</p>
            )}
          </FormRow>

          {/* Short name */}
          <FormRow label="Short name" help="Abbreviated name used in tight UI spaces.">
            <Input id="displayName" {...form.register('displayName')} placeholder="Acme" />
            {form.formState.errors.displayName && (
              <p className="text-xs text-danger">{form.formState.errors.displayName.message}</p>
            )}
          </FormRow>

          {/* Legal name */}
          <FormRow label="Legal name" help="Official registered company name.">
            <Input
              id="legalName"
              {...form.register('legalName')}
              placeholder="Acme Corporation Pvt. Ltd."
            />
            {form.formState.errors.legalName && (
              <p className="text-xs text-danger">{form.formState.errors.legalName.message}</p>
            )}
          </FormRow>

          {/* Timezone */}
          <FormRow label="Timezone" help="All dates and times display in this zone.">
            <Controller
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(val) => field.onChange(val ?? '')}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone">
                      {(v) => TIMEZONES.find((tz) => tz.value === v)?.label ?? v}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.timezone && (
              <p className="text-xs text-danger">{form.formState.errors.timezone.message}</p>
            )}
          </FormRow>

          {/* Country */}
          <FormRow label="Country" help="Primary country of operation.">
            <Input id="country" {...form.register('country')} placeholder="India" />
            {form.formState.errors.country && (
              <p className="text-xs text-danger">{form.formState.errors.country.message}</p>
            )}
          </FormRow>

          {/* Contact email */}
          <FormRow label="Contact email" help="Primary contact for platform communications.">
            <Input
              id="primaryContactEmail"
              type="email"
              {...form.register('primaryContactEmail')}
              placeholder="hr@acmecorp.com"
            />
            {form.formState.errors.primaryContactEmail && (
              <p className="text-xs text-danger">
                {form.formState.errors.primaryContactEmail.message}
              </p>
            )}
          </FormRow>

          {/* Currency */}
          <FormRow label="Currency" help="Default currency for payroll and reports.">
            <Input
              id="defaultCurrency"
              {...form.register('defaultCurrency')}
              placeholder="INR"
              className="max-w-[120px]"
            />
            {form.formState.errors.defaultCurrency && (
              <p className="text-xs text-danger">{form.formState.errors.defaultCurrency.message}</p>
            )}
          </FormRow>

          {/* Fiscal year — read-only */}
          {data && (
            <FormRow label="Fiscal year" help="Contact support to change.">
              <div className="rounded-md border border-subtle bg-surface-raised px-4 py-2.5 text-sm">
                <span className="font-medium text-fg">
                  {MONTH_NAMES[(data.fiscal_year_start ?? 1) - 1] ??
                    `Month ${data.fiscal_year_start}`}
                </span>
              </div>
            </FormRow>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6">
          <Button
            type="submit"
            size="default"
            disabled={mutation.isPending || !form.formState.isDirty}
          >
            <SaveIcon className="size-3.5 mr-1.5" />
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          {form.formState.isDirty && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() =>
                form.reset({
                  company_name: data?.company_name ?? '',
                  timezone: data?.timezone ?? '',
                  working_hours_start: data?.working_hours_start ?? '',
                  working_hours_end: data?.working_hours_end ?? '',
                  displayName: data?.displayName ?? '',
                  legalName: data?.legalName ?? '',
                  country: data?.country ?? '',
                  primaryContactEmail: data?.primaryContactEmail ?? '',
                  defaultCurrency: data?.defaultCurrency ?? '',
                })
              }
              disabled={mutation.isPending}
            >
              Discard
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
