'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useAttendanceRules } from '../hooks/useSettings';
import { useUpdateAttendanceRules } from '../hooks/useSettingsMutations';
import {
  attendanceRulesSchema,
  type AttendanceRulesFormValues,
} from '../validations/settings.schema';
import { FormRow, PanelHeader } from './FormRow';

const WORK_DAYS = [
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
  { key: 'SAT', label: 'Sat' },
  { key: 'SUN', label: 'Sun' },
] as const;

function AttendanceRulesSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-subtle">
      <div className="pb-5 space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-6 py-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
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

export function AttendanceRulesPanel() {
  const { data, isLoading, isError, refetch } = useAttendanceRules();
  const mutation = useUpdateAttendanceRules();

  const form = useForm<AttendanceRulesFormValues>({
    resolver: zodResolver(attendanceRulesSchema),
    defaultValues: {
      work_week_days: [],
      late_after: '09:30',
      half_day_threshold_minutes: 240,
      full_day_threshold_minutes: 480,
      regularization_window_days: 7,
      geo_fencing_enabled: false,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        work_week_days: data.work_week_days,
        late_after: data.late_after,
        half_day_threshold_minutes: data.half_day_threshold_minutes,
        full_day_threshold_minutes: data.full_day_threshold_minutes,
        regularization_window_days: data.regularization_window_days,
        geo_fencing_enabled: data.geo_fencing_enabled,
      });
    }
  }, [data, form]);

  function toggleDay(day: string) {
    const current = form.getValues('work_week_days');
    const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    form.setValue('work_week_days', updated, { shouldDirty: true, shouldValidate: true });
  }

  function onSubmit(values: AttendanceRulesFormValues) {
    mutation.mutate(values, {
      onSuccess: () => toast.success('Attendance rules saved'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save attendance rules');
      },
    });
  }

  if (isError) {
    return <ErrorState message="Failed to load attendance rules." onRetry={() => void refetch()} />;
  }

  if (isLoading) return <AttendanceRulesSkeleton />;

  const selectedDays = form.watch('work_week_days');
  const geoEnabled = form.watch('geo_fencing_enabled');

  return (
    <div>
      <PanelHeader
        section="People"
        title="Attendance Rules"
        description="Define how attendance is tracked for your organisation."
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="divide-y divide-subtle">
          {/* Work week */}
          <FormRow label="Work week" help="Days considered working days.">
            <div className="flex flex-wrap gap-2">
              {WORK_DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={[
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    selectedDays.includes(key)
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-subtle bg-surface text-fg-subtle hover:border-fg-muted hover:text-fg',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.formState.errors.work_week_days && (
              <p className="text-xs text-danger">{form.formState.errors.work_week_days.message}</p>
            )}
          </FormRow>

          {/* Late threshold */}
          <FormRow label="Late threshold" help="Check-in after this time is marked late.">
            <Input
              id="late_after"
              type="time"
              className="max-w-[160px]"
              {...form.register('late_after')}
            />
            {form.formState.errors.late_after && (
              <p className="text-xs text-danger">{form.formState.errors.late_after.message}</p>
            )}
          </FormRow>

          {/* Half day */}
          <FormRow label="Half day" help="Minimum minutes for a half-day.">
            <div className="flex items-center gap-2">
              <Input
                id="half_day_threshold_minutes"
                type="number"
                min={1}
                max={720}
                className="max-w-[100px]"
                {...form.register('half_day_threshold_minutes', { valueAsNumber: true })}
              />
              <span className="text-sm text-fg-muted">minutes</span>
            </div>
            {form.formState.errors.half_day_threshold_minutes && (
              <p className="text-xs text-danger">
                {form.formState.errors.half_day_threshold_minutes.message}
              </p>
            )}
          </FormRow>

          {/* Full day */}
          <FormRow label="Full day" help="Minimum minutes for a full day.">
            <div className="flex items-center gap-2">
              <Input
                id="full_day_threshold_minutes"
                type="number"
                min={1}
                max={1440}
                className="max-w-[100px]"
                {...form.register('full_day_threshold_minutes', { valueAsNumber: true })}
              />
              <span className="text-sm text-fg-muted">minutes</span>
            </div>
            {form.formState.errors.full_day_threshold_minutes && (
              <p className="text-xs text-danger">
                {form.formState.errors.full_day_threshold_minutes.message}
              </p>
            )}
          </FormRow>

          {/* Regularisation window */}
          <FormRow label="Regularisation window" help="Days allowed to raise an attendance fix.">
            <div className="flex items-center gap-2">
              <Input
                id="regularization_window_days"
                type="number"
                min={1}
                max={90}
                className="max-w-[100px]"
                {...form.register('regularization_window_days', { valueAsNumber: true })}
              />
              <span className="text-sm text-fg-muted">days</span>
            </div>
            {form.formState.errors.regularization_window_days && (
              <p className="text-xs text-danger">
                {form.formState.errors.regularization_window_days.message}
              </p>
            )}
          </FormRow>

          {/* Geo-fencing */}
          <FormRow label="Geo-fencing" help="Restrict check-in to office location.">
            <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-fg">Enable geo-fencing</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Require employees to be within a defined location radius to check in.
                </p>
              </div>
              <Switch
                checked={geoEnabled}
                onCheckedChange={(val) =>
                  form.setValue('geo_fencing_enabled', val, { shouldDirty: true })
                }
              />
            </div>
          </FormRow>
        </div>

        {/* Actions */}
        {form.formState.isDirty && (
          <div className="flex items-center gap-3 pt-6">
            <Button type="submit" disabled={mutation.isPending}>
              <SaveIcon className="size-3.5 mr-1.5" />
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                form.reset({
                  work_week_days: data?.work_week_days ?? [],
                  late_after: data?.late_after ?? '09:30',
                  half_day_threshold_minutes: data?.half_day_threshold_minutes ?? 240,
                  full_day_threshold_minutes: data?.full_day_threshold_minutes ?? 480,
                  regularization_window_days: data?.regularization_window_days ?? 7,
                  geo_fencing_enabled: data?.geo_fencing_enabled ?? false,
                })
              }
              disabled={mutation.isPending}
            >
              Discard
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
