'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlobeIcon, SaveIcon, ClockIcon, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
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
  localeTimezoneSchema,
  type LocaleTimezoneFormValues,
} from '../validations/settings.schema';
import { TIMEZONES, MONTH_NAMES } from '../constants';

// ── Live clock ────────────────────────────────────────────────────────────────

function LiveClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  let display = '—';
  try {
    const zoned = toZonedTime(now, timezone);
    display = format(zoned, 'EEE, MMM d yyyy  HH:mm:ss');
  } catch {
    display = 'Invalid timezone';
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-subtle bg-surface-raised/50 text-sm">
      <ClockIcon className="size-4 text-fg-disabled shrink-0" />
      <span className="text-fg-muted">Current time:</span>
      <span className="font-mono font-medium text-fg">{display}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LocaleSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full max-w-sm" />
      </div>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LocaleTimezonePanel() {
  const { data, isLoading, isError, refetch } = useTenantSettings();
  const mutation = useUpdateTenantSettings();

  const form = useForm<LocaleTimezoneFormValues>({
    resolver: zodResolver(localeTimezoneSchema),
    defaultValues: { timezone: '' },
  });

  const watchedTimezone = form.watch('timezone');

  useEffect(() => {
    if (data) {
      form.reset({ timezone: data.timezone });
    }
  }, [data, form]);

  function onSubmit(values: LocaleTimezoneFormValues) {
    mutation.mutate(
      { timezone: values.timezone },
      {
        onSuccess: () => toast.success('Timezone saved'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save timezone');
        },
      },
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load settings." onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return <LocaleSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GlobeIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Locale &amp; Timezone</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Set the default timezone for your organisation. All timestamps and scheduling are based on
          this setting.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Controller
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => field.onChange(val ?? '')}>
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue placeholder="Select timezone">
                    {(v) => TIMEZONES.find((tz) => tz.value === v)?.label ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
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

        {/* Live clock for selected timezone */}
        {watchedTimezone && <LiveClock timezone={watchedTimezone} />}

        {/* Fiscal year — read-only */}
        {data && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-subtle bg-surface-raised/50 text-sm">
            <CalendarIcon className="size-4 text-fg-disabled shrink-0" />
            <span className="text-fg-muted">Fiscal year starts:</span>
            <span className="font-medium text-fg">
              {MONTH_NAMES[(data.fiscal_year_start ?? 1) - 1] ?? `Month ${data.fiscal_year_start}`}
            </span>
            <span className="ml-auto text-xs text-fg-disabled">Contact support to change</span>
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
              onClick={() => form.reset({ timezone: data?.timezone ?? '' })}
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
