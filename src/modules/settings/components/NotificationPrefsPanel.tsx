'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useNotificationPrefs } from '../hooks/useSettings';
import { useUpdateNotificationPrefs } from '../hooks/useSettingsMutations';
import {
  notificationPrefsSchema,
  type NotificationPrefsFormValues,
} from '../validations/settings.schema';
import type { NotifChannel } from '../types/settings.types';
import { FormRow, PanelHeader } from './FormRow';

const EVENT_LABELS: Record<string, string> = {
  leave_approved: 'Leave approved',
  leave_rejected: 'Leave rejected',
  leave_requested: 'New leave request',
  attendance_regularization: 'Attendance regularization',
};

const EVENT_KEYS = [
  'leave_approved',
  'leave_rejected',
  'leave_requested',
  'attendance_regularization',
] as const;

type EventKey = (typeof EVENT_KEYS)[number];

function NotificationPrefsSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-subtle">
      <div className="pb-5 space-y-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-6 py-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-3 max-w-[480px]">
            {Array.from({ length: i === 0 ? 2 : 4 }).map((_, j) => (
              <Skeleton key={j} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationPrefsPanel() {
  const { data, isLoading, isError, refetch } = useNotificationPrefs();
  const mutation = useUpdateNotificationPrefs();

  const form = useForm<NotificationPrefsFormValues>({
    resolver: zodResolver(notificationPrefsSchema),
    defaultValues: {
      channels: { in_app: true, email: true },
      events: {
        leave_approved: ['in_app', 'email'],
        leave_rejected: ['in_app', 'email'],
        leave_requested: ['in_app'],
        attendance_regularization: ['in_app', 'email'],
      },
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        channels: data.channels,
        events: data.events,
      });
    }
  }, [data, form]);

  function toggleEventChannel(eventKey: EventKey, channel: NotifChannel) {
    const current = form.getValues(`events.${eventKey}`) as NotifChannel[];
    const updated = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    form.setValue(`events.${eventKey}`, updated, { shouldDirty: true });
  }

  function onSubmit(values: NotificationPrefsFormValues) {
    mutation.mutate(values, {
      onSuccess: () => toast.success('Notification preferences saved'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(
          axiosErr.response?.data?.error?.message ?? 'Failed to save notification preferences',
        );
      },
    });
  }

  if (isError) {
    return (
      <ErrorState
        message="Failed to load notification preferences."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) return <NotificationPrefsSkeleton />;

  const inApp = form.watch('channels.in_app');
  const email = form.watch('channels.email');

  return (
    <div>
      <PanelHeader
        section="Notifications"
        title="In-app Preferences"
        description="Choose when and how you receive notifications."
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="divide-y divide-subtle">
          {/* Channels */}
          <FormRow label="Channels" help="Enable or disable notification delivery methods.">
            {/* In-app */}
            <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-fg">In-app notifications</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Receive notifications inside the EMS application.
                </p>
              </div>
              <Switch
                checked={inApp}
                onCheckedChange={(val) =>
                  form.setValue('channels.in_app', val, { shouldDirty: true })
                }
              />
            </div>

            {/* Email */}
            <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-fg">Email notifications</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Receive notifications via your registered work email.
                </p>
              </div>
              <Switch
                checked={email}
                onCheckedChange={(val) =>
                  form.setValue('channels.email', val, { shouldDirty: true })
                }
              />
            </div>
          </FormRow>

          {/* Event preferences */}
          <FormRow
            label="Event preferences"
            help="Disabling a channel above also disables its checkboxes."
          >
            <div className="rounded-lg border border-subtle divide-y divide-subtle">
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-2 bg-surface-raised/50 rounded-t-lg">
                <span className="text-xs font-medium text-fg-subtle">Event</span>
                <div className="flex gap-8 pr-1">
                  <span className="text-xs font-medium text-fg-subtle w-12 text-center">
                    In-app
                  </span>
                  <span className="text-xs font-medium text-fg-subtle w-12 text-center">Email</span>
                </div>
              </div>

              {/* Event rows */}
              {EVENT_KEYS.map((eventKey) => {
                const currentChannels = form.watch(`events.${eventKey}`) as NotifChannel[];
                return (
                  <div key={eventKey} className="flex items-center justify-between px-4 py-3">
                    <Label className="text-sm text-fg font-normal cursor-default">
                      {EVENT_LABELS[eventKey]}
                    </Label>
                    <div className="flex gap-8 pr-1">
                      <div className="w-12 flex justify-center">
                        <Checkbox
                          id={`${eventKey}-in_app`}
                          checked={currentChannels.includes('in_app')}
                          onCheckedChange={() => toggleEventChannel(eventKey, 'in_app')}
                          disabled={!inApp}
                        />
                      </div>
                      <div className="w-12 flex justify-center">
                        <Checkbox
                          id={`${eventKey}-email`}
                          checked={currentChannels.includes('email')}
                          onCheckedChange={() => toggleEventChannel(eventKey, 'email')}
                          disabled={!email}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  channels: data?.channels ?? { in_app: true, email: true },
                  events: data?.events ?? {
                    leave_approved: ['in_app', 'email'],
                    leave_rejected: ['in_app', 'email'],
                    leave_requested: ['in_app'],
                    attendance_regularization: ['in_app', 'email'],
                  },
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
