'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BuildingIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  tenantSettingsSchema,
  type TenantSettingsFormValues,
} from '../validations/settings.schema';
import { TIMEZONES, MONTH_NAMES } from '../constants';

function CompanyProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

export function CompanyProfilePanel() {
  const { data, isLoading, isError, refetch } = useTenantSettings();
  const mutation = useUpdateTenantSettings();

  const form = useForm<TenantSettingsFormValues>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      company_name: '',
      timezone: '',
      working_hours_start: '',
      working_hours_end: '',
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        company_name: data.company_name,
        timezone: data.timezone,
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
      });
    }
  }, [data, form]);

  function onSubmit(values: TenantSettingsFormValues) {
    mutation.mutate(values, {
      onSuccess: () => toast.success('Company profile saved'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save company profile');
      },
    });
  }

  if (isError) {
    return <ErrorState message="Failed to load company settings." onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return <CompanyProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BuildingIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Company Profile</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Basic information about your organisation visible to all users.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Company name */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" {...form.register('company_name')} placeholder="Acme Corp" />
            {form.formState.errors.company_name && (
              <p className="text-xs text-danger">{form.formState.errors.company_name.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Controller
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(val) => field.onChange(val ?? '')}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
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
          </div>

          {/* Working hours start */}
          <div className="space-y-1.5">
            <Label htmlFor="working_hours_start">Work Day Start</Label>
            <Input id="working_hours_start" type="time" {...form.register('working_hours_start')} />
            {form.formState.errors.working_hours_start && (
              <p className="text-xs text-danger">
                {form.formState.errors.working_hours_start.message}
              </p>
            )}
          </div>

          {/* Working hours end */}
          <div className="space-y-1.5">
            <Label htmlFor="working_hours_end">Work Day End</Label>
            <Input id="working_hours_end" type="time" {...form.register('working_hours_end')} />
            {form.formState.errors.working_hours_end && (
              <p className="text-xs text-danger">
                {form.formState.errors.working_hours_end.message}
              </p>
            )}
          </div>
        </div>

        {/* Fiscal year start — read-only, not patchable via this endpoint */}
        {data && (
          <div className="rounded-md border border-subtle bg-surface-raised px-4 py-3 text-sm">
            <span className="text-fg-subtle">Fiscal Year Start: </span>
            <span className="font-medium text-fg">
              {MONTH_NAMES[(data.fiscal_year_start ?? 1) - 1] ?? `Month ${data.fiscal_year_start}`}
            </span>
            <span className="ml-2 text-xs text-fg-muted">(contact support to change)</span>
          </div>
        )}

        <div className="flex items-center gap-3">
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
