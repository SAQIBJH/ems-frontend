'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useTenantSettings } from '../hooks/useSettings';
import { useUpdateTenantSettings } from '../hooks/useSettingsMutations';
import { workingHoursSchema, type WorkingHoursFormValues } from '../validations/settings.schema';
import { FormRow, PanelHeader } from './FormRow';

// ── Duration helper ───────────────────────────────────────────────────────────

function parseMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatDuration(startHHMM: string, endHHMM: string): string | null {
  try {
    const diff = parseMins(endHHMM) - parseMins(startHHMM);
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `${h} hours` : `${h}h ${m}m`;
  } catch {
    return null;
  }
}

// ── Visual day bar ────────────────────────────────────────────────────────────

function DayBar({ start, end }: { start: string; end: string }) {
  const startMins = parseMins(start);
  const endMins = parseMins(end);
  const totalMins = 24 * 60;

  const left = `${(startMins / totalMins) * 100}%`;
  const width = `${Math.max(0, ((endMins - startMins) / totalMins) * 100)}%`;

  const markers = [0, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div className="space-y-1.5">
      <div className="relative h-6 rounded-md bg-surface-raised overflow-hidden border border-subtle">
        {endMins > startMins && (
          <div
            className="absolute top-0 bottom-0 bg-brand/20 border-l border-r border-brand/40"
            style={{ left, width }}
          />
        )}
      </div>
      <div className="relative flex">
        {markers.map((h) => (
          <div
            key={h}
            className="absolute -translate-x-1/2 text-[0.6rem] text-fg-disabled"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 24 ? '' : `${h}:00`}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function WorkingHoursSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-subtle">
      <div className="pb-5 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-6 py-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
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

// ── Main component ────────────────────────────────────────────────────────────

export function WorkingHoursPanel() {
  const { data, isLoading, isError, refetch } = useTenantSettings();
  const mutation = useUpdateTenantSettings();

  const form = useForm<WorkingHoursFormValues>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: { working_hours_start: '', working_hours_end: '' },
  });

  const watchStart = form.watch('working_hours_start');
  const watchEnd = form.watch('working_hours_end');

  useEffect(() => {
    if (data) {
      form.reset({
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
      });
    }
  }, [data, form]);

  function onSubmit(values: WorkingHoursFormValues) {
    mutation.mutate(
      {
        working_hours_start: values.working_hours_start,
        working_hours_end: values.working_hours_end,
      },
      {
        onSuccess: () => toast.success('Working hours saved'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save working hours');
        },
      },
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load settings." onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return <WorkingHoursSkeleton />;
  }

  const duration = formatDuration(watchStart, watchEnd);

  return (
    <div>
      <PanelHeader
        section="Organization"
        title="Working Hours"
        description="Standard work day for attendance tracking."
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="divide-y divide-subtle">
          {/* Day starts */}
          <FormRow label="Day starts" help="Employees check in from this time.">
            <Input
              id="working_hours_start"
              type="time"
              className="max-w-[160px]"
              {...form.register('working_hours_start')}
            />
            {form.formState.errors.working_hours_start && (
              <p className="text-xs text-danger">
                {form.formState.errors.working_hours_start.message}
              </p>
            )}
          </FormRow>

          {/* Day ends */}
          <FormRow label="Day ends">
            <Input
              id="working_hours_end"
              type="time"
              className="max-w-[160px]"
              {...form.register('working_hours_end')}
            />
            {form.formState.errors.working_hours_end && (
              <p className="text-xs text-danger">
                {form.formState.errors.working_hours_end.message}
              </p>
            )}
          </FormRow>

          {/* Visual timeline */}
          <FormRow label="Visual timeline">
            <div className="space-y-2">
              {watchStart && watchEnd ? (
                <>
                  <DayBar start={watchStart} end={watchEnd} />
                  {duration && (
                    <p className="text-xs text-fg-muted">
                      Work day duration: <span className="font-semibold text-fg">{duration}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-fg-muted">
                  Set start and end times to preview the timeline.
                </p>
              )}
            </div>
          </FormRow>
        </div>

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
