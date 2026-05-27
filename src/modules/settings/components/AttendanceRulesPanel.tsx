'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardListIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-28" />
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardListIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Attendance Rules</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Configure the thresholds and policies that govern daily attendance tracking.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Working days */}
        <div className="space-y-2">
          <Label>Working Days</Label>
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
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Late after */}
          <div className="space-y-1.5">
            <Label htmlFor="late_after">Late Check-in After</Label>
            <div className="flex items-center gap-2">
              <Input
                id="late_after"
                type="time"
                className="max-w-[140px]"
                {...form.register('late_after')}
              />
            </div>
            {form.formState.errors.late_after && (
              <p className="text-xs text-danger">{form.formState.errors.late_after.message}</p>
            )}
          </div>

          {/* Regularization window */}
          <div className="space-y-1.5">
            <Label htmlFor="regularization_window_days">Regularization Window</Label>
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
          </div>

          {/* Half-day threshold */}
          <div className="space-y-1.5">
            <Label htmlFor="half_day_threshold_minutes">Half-day Threshold</Label>
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
          </div>

          {/* Full-day threshold */}
          <div className="space-y-1.5">
            <Label htmlFor="full_day_threshold_minutes">Full-day Threshold</Label>
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
          </div>
        </div>

        {/* Geo-fencing */}
        <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fg">Geo-fencing</p>
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

        {/* Actions */}
        {form.formState.isDirty && (
          <div className="flex items-center gap-3">
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
