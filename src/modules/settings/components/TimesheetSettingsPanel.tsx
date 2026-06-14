'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';
import {
  useTimesheetSettings,
  useUpdateTimesheetSettings,
  timesheetSettingsSchema,
  type TimesheetSettings,
  type TimesheetSettingsFormValues,
} from '@/modules/timesheets';

import { FormRow, PanelHeader } from './FormRow';

const ROUNDING_OPTIONS = [
  { value: '0', label: 'No rounding' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
];

const POLICY_OPTIONS: { value: TimesheetSettings['unloggedHoursPolicy']; label: string }[] = [
  { value: 'IGNORE', label: 'Ignore — never flag or deduct' },
  { value: 'FLAG', label: 'Flag in review (default)' },
  { value: 'DEDUCT', label: 'Deduct shortfall from pay' },
];

/** Reminder-day Select uses an 'off' sentinel for `null` (Base UI disallows empty values). */
const REMINDER_OFF = 'off';
const REMINDER_DAY_OPTIONS = [
  { value: REMINDER_OFF, label: 'Off — no reminder' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

function PanelSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-subtle">
      <div className="space-y-1.5 pb-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-6 py-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-9 w-full max-w-[480px]" />
        </div>
      ))}
    </div>
  );
}

/** Inner form — seeded from loaded data so no effect-driven reset is needed. */
function SettingsForm({ data }: { data: TimesheetSettings }) {
  const mutation = useUpdateTimesheetSettings();
  const form = useForm<TimesheetSettingsFormValues>({
    resolver: zodResolver(timesheetSettingsSchema),
    defaultValues: {
      standardWeeklyHours: data.standardWeeklyHours,
      overtimeThresholdHours: data.overtimeThresholdHours,
      roundingMinutes: data.roundingMinutes,
      approvalRequired: data.approvalRequired,
      unloggedHoursPolicy: data.unloggedHoursPolicy,
      billableDefault: data.billableDefault,
      submitReminderDay: data.submitReminderDay,
      requireTaskOnEntry: data.requireTaskOnEntry,
    },
  });

  const approvalRequired = useWatch({ control: form.control, name: 'approvalRequired' });
  const billableDefault = useWatch({ control: form.control, name: 'billableDefault' });
  const roundingMinutes = useWatch({ control: form.control, name: 'roundingMinutes' });
  const policy = useWatch({ control: form.control, name: 'unloggedHoursPolicy' });
  const submitReminderDay = useWatch({ control: form.control, name: 'submitReminderDay' });
  const requireTaskOnEntry = useWatch({ control: form.control, name: 'requireTaskOnEntry' });

  function onSubmit(values: TimesheetSettingsFormValues) {
    mutation.mutate(values, {
      onSuccess: () => toast.success('Timesheet settings saved'),
      onError: (err) => {
        const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
        toast.error(apiErr?.message ?? 'Failed to save timesheet settings');
      },
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="divide-y divide-subtle">
        <FormRow
          label="Standard week"
          help="Hours in a normal working week. Overtime is logged time beyond this."
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={168}
              step="0.5"
              className="max-w-[120px]"
              {...form.register('standardWeeklyHours', { valueAsNumber: true })}
            />
            <span className="text-sm text-fg-muted">hours / week</span>
          </div>
          {form.formState.errors.standardWeeklyHours && (
            <p className="text-xs text-danger">
              {form.formState.errors.standardWeeklyHours.message}
            </p>
          )}
        </FormRow>

        <FormRow
          label="Overtime threshold"
          help="Weekly hours after which time counts as overtime."
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={168}
              step="0.5"
              className="max-w-[120px]"
              {...form.register('overtimeThresholdHours', { valueAsNumber: true })}
            />
            <span className="text-sm text-fg-muted">hours / week</span>
          </div>
          {form.formState.errors.overtimeThresholdHours && (
            <p className="text-xs text-danger">
              {form.formState.errors.overtimeThresholdHours.message}
            </p>
          )}
        </FormRow>

        <FormRow label="Rounding" help="Round logged durations to the nearest interval.">
          <Select
            value={String(roundingMinutes)}
            onValueChange={(v) =>
              form.setValue('roundingMinutes', Number(v), { shouldDirty: true })
            }
          >
            <SelectTrigger className="max-w-[200px]">
              <SelectValue>
                {(v) => ROUNDING_OPTIONS.find((o) => o.value === String(v))?.label ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROUNDING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow
          label="Unlogged hours"
          help="What to do when logged time is below the standard week."
        >
          <Select
            value={policy}
            onValueChange={(v) =>
              form.setValue('unloggedHoursPolicy', v as TimesheetSettings['unloggedHoursPolicy'], {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger className="max-w-[280px]">
              <SelectValue>
                {(v) => POLICY_OPTIONS.find((o) => o.value === v)?.label ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {POLICY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-fg-muted">
            Only <span className="font-medium">Deduct</span> lets a shortfall reduce pay (imported
            as LOP). Flag surfaces it in review only.
          </p>
        </FormRow>

        <FormRow label="Approval" help="Require manager/HR approval before a week is final.">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle px-4 py-3">
            <div>
              <p className="text-sm font-medium text-fg">Require approval</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                Submitted weeks must be approved before they feed reports or payroll.
              </p>
            </div>
            <Switch
              checked={approvalRequired}
              onCheckedChange={(val) =>
                form.setValue('approvalRequired', val, { shouldDirty: true })
              }
              aria-label="Require approval"
            />
          </div>
        </FormRow>

        <FormRow label="Billable default" help="Whether new time entries are billable by default.">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle px-4 py-3">
            <div>
              <p className="text-sm font-medium text-fg">Default new entries to billable</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                Employees can still toggle billable per entry.
              </p>
            </div>
            <Switch
              checked={billableDefault}
              onCheckedChange={(val) =>
                form.setValue('billableDefault', val, { shouldDirty: true })
              }
              aria-label="Billable default"
            />
          </div>
        </FormRow>

        <FormRow label="Require task" help="Force a task on every time entry.">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle px-4 py-3">
            <div>
              <p className="text-sm font-medium text-fg">Require a task on every entry</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                When on, logging or timing against a project with no task is blocked.
              </p>
            </div>
            <Switch
              checked={requireTaskOnEntry}
              onCheckedChange={(val) =>
                form.setValue('requireTaskOnEntry', val, { shouldDirty: true })
              }
              aria-label="Require task on entry"
            />
          </div>
        </FormRow>

        <FormRow
          label="Submit reminder"
          help="Weekday to nudge employees about an unsubmitted prior week (and approvers about pending sheets)."
        >
          <Select
            value={submitReminderDay == null ? REMINDER_OFF : String(submitReminderDay)}
            onValueChange={(v) =>
              form.setValue('submitReminderDay', v === REMINDER_OFF ? null : Number(v), {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger className="max-w-[220px]">
              <SelectValue>
                {(v) =>
                  REMINDER_DAY_OPTIONS.find((o) => o.value === String(v))?.label ??
                  'Off — no reminder'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REMINDER_DAY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-fg-muted">
            Reminders arrive as in-app notifications. <span className="font-medium">Off</span>{' '}
            disables them.
          </p>
        </FormRow>
      </div>

      {form.formState.isDirty && (
        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" disabled={mutation.isPending}>
            <SaveIcon className="mr-1.5 size-3.5" />
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset()}
            disabled={mutation.isPending}
          >
            Discard
          </Button>
        </div>
      )}
    </form>
  );
}

export function TimesheetSettingsPanel() {
  const { data, isLoading, isError, refetch } = useTimesheetSettings();

  return (
    <div>
      <PanelHeader
        section="People"
        title="Timesheets"
        description="Standard hours, overtime, rounding, and approval rules for time logging."
      />

      {isError ? (
        <div className="pt-5">
          <ErrorState message="Failed to load timesheet settings." onRetry={() => void refetch()} />
        </div>
      ) : isLoading || !data ? (
        <PanelSkeleton />
      ) : (
        <SettingsForm data={data} />
      )}
    </div>
  );
}
