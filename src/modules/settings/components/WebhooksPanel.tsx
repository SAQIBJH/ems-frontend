'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  WebhookIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  SendIcon,
  ListIcon,
  CopyIcon,
  CheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ApiError } from '@/types/api';

import { useWebhooks, useWebhookDeliveries } from '../hooks/useSettings';
import {
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
} from '../hooks/useSettingsMutations';
import type { Webhook, WebhookEvent, WebhookStatus } from '../types/settings.types';

// ── Event catalogue ───────────────────────────────────────────────────────────

const EVENT_GROUPS: { label: string; events: WebhookEvent[] }[] = [
  {
    label: 'Employees',
    events: ['EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_TERMINATED'],
  },
  {
    label: 'Leave',
    events: ['LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_WITHDRAWN'],
  },
  {
    label: 'Attendance',
    events: [
      'ATTENDANCE_REGULARIZED',
      'ATTENDANCE_REGULARIZATION_APPROVED',
      'ATTENDANCE_REGULARIZATION_DENIED',
    ],
  },
  {
    label: 'Departments',
    events: ['DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DELETED'],
  },
  {
    label: 'Payroll',
    events: ['PAYROLL_RUN_APPROVED', 'PAYSLIP_GENERATED'],
  },
];

const EVENT_LABEL: Record<WebhookEvent, string> = {
  EMPLOYEE_CREATED: 'Employee created',
  EMPLOYEE_UPDATED: 'Employee updated',
  EMPLOYEE_TERMINATED: 'Employee terminated',
  LEAVE_REQUESTED: 'Leave requested',
  LEAVE_APPROVED: 'Leave approved',
  LEAVE_REJECTED: 'Leave rejected',
  LEAVE_WITHDRAWN: 'Leave withdrawn',
  ATTENDANCE_REGULARIZED: 'Attendance regularized',
  ATTENDANCE_REGULARIZATION_APPROVED: 'Regularization approved',
  ATTENDANCE_REGULARIZATION_DENIED: 'Regularization denied',
  DEPARTMENT_CREATED: 'Department created',
  DEPARTMENT_UPDATED: 'Department updated',
  DEPARTMENT_DELETED: 'Department deleted',
  PAYROLL_RUN_APPROVED: 'Payroll run approved',
  PAYSLIP_GENERATED: 'Payslip generated',
};

// ── Schema ────────────────────────────────────────────────────────────────────

const webhookSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((v) => v.startsWith('https://'), 'Must use HTTPS'),
  description: z.string().optional(),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  active: z.boolean(),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: WebhookStatus) {
  if (status === 'active') {
    return (
      <Badge variant="outline" className="text-success border-success/30 bg-success/5 text-xs">
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-fg-muted border-subtle bg-surface-raised/40 text-xs">
      Disabled
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 p-1.5 rounded-md border border-subtle bg-surface hover:bg-surface-raised transition-colors text-fg-muted hover:text-fg"
      aria-label="Copy"
    >
      {copied ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5" />}
    </button>
  );
}

// ── Secret reveal dialog ──────────────────────────────────────────────────────

function SecretRevealDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Webhook secret — save it now</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-fg-muted">
          This secret is shown <strong>once</strong>. Store it somewhere safe — you cannot retrieve
          it again. Use it to verify HMAC-SHA256 signatures on incoming deliveries.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-surface border border-subtle rounded px-2.5 py-2 text-fg-subtle break-all font-mono">
            {secret}
          </code>
          <CopyButton text={secret} />
        </div>
        <DialogFooter>
          <Button size="default" onClick={onClose}>
            I&apos;ve saved it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Webhook form dialog ───────────────────────────────────────────────────────

function WebhookDialog({
  webhook,
  open,
  onOpenChange,
}: {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createMutation = useCreateWebhook();
  const updateMutation = useUpdateWebhook();
  const isEditing = !!webhook;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: webhook?.url ?? '',
      description: webhook?.description ?? '',
      events: (webhook?.events as string[]) ?? [],
      active: webhook ? webhook.status === 'active' : true,
    },
  });

  const selectedEvents = watch('events');

  function toggleEvent(event: string, checked: boolean) {
    const current = selectedEvents ?? [];
    setValue('events', checked ? [...current, event] : current.filter((e) => e !== event), {
      shouldValidate: true,
    });
  }

  function toggleGroup(events: WebhookEvent[], checked: boolean) {
    const current = selectedEvents ?? [];
    if (checked) {
      const merged = Array.from(new Set([...current, ...events]));
      setValue('events', merged, { shouldValidate: true });
    } else {
      setValue(
        'events',
        current.filter((e) => !events.includes(e as WebhookEvent)),
        { shouldValidate: true },
      );
    }
  }

  function onSubmit(values: WebhookFormValues) {
    if (isEditing) {
      updateMutation.mutate(
        {
          id: webhook.id,
          input: {
            url: values.url,
            events: values.events as WebhookEvent[],
            description: values.description || undefined,
            active: values.active,
          },
        },
        {
          onSuccess: () => {
            toast.success('Webhook updated');
            onOpenChange(false);
          },
          onError: (err) => {
            const axiosErr = err as AxiosError<ApiError>;
            toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to update webhook');
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          url: values.url,
          events: values.events as WebhookEvent[],
          description: values.description || undefined,
          active: values.active,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
          onError: (err) => {
            const axiosErr = err as AxiosError<ApiError>;
            toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to create webhook');
          },
        },
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit webhook' : 'Add webhook'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="wh-url">Endpoint URL</Label>
            <Input
              id="wh-url"
              type="url"
              placeholder="https://hooks.example.com/ems"
              {...register('url')}
            />
            {errors.url && <p className="text-xs text-danger">{errors.url.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-desc">
              Description <span className="text-fg-muted">(optional)</span>
            </Label>
            <Input id="wh-desc" placeholder="Slack notifications" {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label>Events</Label>
            {errors.events && <p className="text-xs text-danger">{errors.events.message}</p>}
            <div className="rounded-lg border border-subtle divide-y divide-subtle">
              {EVENT_GROUPS.map((group) => {
                const allSelected = group.events.every((e) => selectedEvents?.includes(e));
                const someSelected = group.events.some((e) => selectedEvents?.includes(e));
                return (
                  <div key={group.label} className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`grp-${group.label}`}
                        checked={allSelected}
                        data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                        onCheckedChange={(v) => toggleGroup(group.events, !!v)}
                      />
                      <label
                        htmlFor={`grp-${group.label}`}
                        className="text-xs font-semibold text-fg cursor-pointer uppercase tracking-widest"
                      >
                        {group.label}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
                      {group.events.map((event) => (
                        <div key={event} className="flex items-center gap-2">
                          <Controller
                            control={control}
                            name="events"
                            render={() => (
                              <Checkbox
                                id={`evt-${event}`}
                                checked={selectedEvents?.includes(event)}
                                onCheckedChange={(v) => toggleEvent(event, !!v)}
                              />
                            )}
                          />
                          <label
                            htmlFor={`evt-${event}`}
                            className="text-xs text-fg-muted cursor-pointer"
                          >
                            {EVENT_LABEL[event]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Active</p>
              <p className="text-xs text-fg-muted">Deliver events to this endpoint</p>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="default" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Update webhook' : 'Add webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteWebhookDialog({
  webhook,
  open,
  onOpenChange,
}: {
  webhook: Webhook;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const deleteMutation = useDeleteWebhook();

  function handleDelete() {
    deleteMutation.mutate(webhook.id, {
      onSuccess: () => {
        toast.success('Webhook deleted');
        onOpenChange(false);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to delete webhook');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete webhook?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-fg-muted">
          Deliveries to <span className="font-mono text-xs break-all">{webhook.url}</span> will stop
          immediately. This cannot be undone.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="default"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delivery log sheet ────────────────────────────────────────────────────────

function DeliveryLogSheet({
  webhook,
  open,
  onOpenChange,
}: {
  webhook: Webhook;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWebhookDeliveries(open ? webhook.id : null, page);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Delivery log</SheetTitle>
          <p className="text-xs text-fg-muted font-mono break-all">{webhook.url}</p>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          )}

          {!isLoading && (!data || data.deliveries.length === 0) && (
            <EmptyState
              title="No deliveries yet"
              description="Events will appear here once the webhook receives its first call."
            />
          )}

          {data?.deliveries.map((d) => (
            <div key={d.id} className="rounded-lg border border-subtle bg-surface p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {d.success ? (
                    <CheckCircle2Icon className="size-3.5 text-success shrink-0" />
                  ) : (
                    <XCircleIcon className="size-3.5 text-danger shrink-0" />
                  )}
                  <span className="text-xs font-mono font-semibold text-fg">{d.event}</span>
                  {d.responseStatus !== null && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        d.success
                          ? 'text-success border-success/30 bg-success/5'
                          : 'text-danger border-danger/30 bg-danger/5'
                      }`}
                    >
                      {d.responseStatus}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-fg-muted shrink-0">
                  {d.durationMs !== null ? `${d.durationMs}ms` : '—'}
                </span>
              </div>
              <p className="text-xs text-fg-muted">
                {format(parseISO(d.timestamp), 'd MMM yyyy, HH:mm:ss')}
              </p>
              {d.responseBody && (
                <pre className="text-xs bg-surface-raised/40 border border-subtle rounded p-2 overflow-x-auto text-fg-subtle max-h-20">
                  {d.responseBody}
                </pre>
              )}
            </div>
          ))}

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-fg-muted">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function WebhooksSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-lg border border-subtle p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-7 w-20 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function WebhooksPanel() {
  const { data: webhooks, isLoading, isError, refetch } = useWebhooks();
  const testMutation = useTestWebhook();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Webhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);
  const [deliveryTarget, setDeliveryTarget] = useState<Webhook | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const createMutation = useCreateWebhook();

  // Capture secret from the last successful create
  function handleCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  // Intercept createMutation onSuccess to show the secret reveal dialog
  function handleWebhookDialogClose(open: boolean) {
    if (!open && createMutation.data) {
      setNewSecret(createMutation.data.secret);
    }
    setDialogOpen(open);
  }

  function handleTest(webhook: Webhook) {
    testMutation.mutate(webhook.id, {
      onSuccess: (result) => {
        toast.success(`PING delivered — ${result.responseStatus} in ${result.durationMs}ms`);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Delivery failed');
      },
    });
  }

  if (isError) {
    return <ErrorState message="Failed to load webhooks." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <WebhookIcon className="size-4 text-fg-subtle" />
            <h2 className="text-sm font-semibold text-fg">Webhooks</h2>
          </div>
          <p className="text-sm text-fg-muted">
            Push real-time event notifications to any HTTPS endpoint. Deliveries are signed with
            HMAC-SHA256 and retried automatically on failure.
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={handleCreate}>
          <PlusIcon className="size-3.5 mr-1.5" />
          Add webhook
        </Button>
      </div>

      {/* List */}
      {isLoading && <WebhooksSkeleton />}

      {!isLoading && (!webhooks || webhooks.length === 0) && (
        <EmptyState
          title="No webhooks configured"
          description="Add a webhook to receive real-time event notifications in your external systems."
          action={
            <Button size="sm" onClick={handleCreate}>
              <PlusIcon className="size-3.5 mr-1.5" />
              Add webhook
            </Button>
          }
        />
      )}

      {!isLoading && webhooks && webhooks.length > 0 && (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-lg border border-subtle bg-surface p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-mono text-fg truncate">{wh.url}</p>
                  {wh.description && <p className="text-xs text-fg-muted">{wh.description}</p>}
                </div>
                {statusBadge(wh.status)}
              </div>

              {/* Events summary */}
              <div className="flex flex-wrap gap-1.5">
                {wh.events.slice(0, 5).map((e) => (
                  <span
                    key={e}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-subtle text-fg-muted font-mono"
                  >
                    {e}
                  </span>
                ))}
                {wh.events.length > 5 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-subtle text-fg-muted">
                    +{wh.events.length - 5} more
                  </span>
                )}
              </div>

              {/* Last delivery */}
              {wh.lastDelivery && (
                <div className="flex items-center gap-2">
                  {wh.lastDelivery.success ? (
                    <CheckCircle2Icon className="size-3 text-success" />
                  ) : (
                    <XCircleIcon className="size-3 text-danger" />
                  )}
                  <span className="text-xs text-fg-muted">
                    Last delivery {format(parseISO(wh.lastDelivery.timestamp), 'd MMM, HH:mm')} —{' '}
                    {wh.lastDelivery.statusCode} in {wh.lastDelivery.durationMs}ms
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-subtle">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditTarget(wh);
                    setDialogOpen(true);
                  }}
                >
                  <PencilIcon className="size-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(wh)}
                  disabled={testMutation.isPending && testMutation.variables === wh.id}
                >
                  <SendIcon className="size-3.5 mr-1.5" />
                  {testMutation.isPending && testMutation.variables === wh.id ? 'Sending…' : 'Test'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeliveryTarget(wh)}>
                  <ListIcon className="size-3.5 mr-1.5" />
                  Deliveries
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger hover:text-danger border-danger/30 hover:bg-danger/5 ml-auto"
                  onClick={() => setDeleteTarget(wh)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <WebhookDialog
        key={editTarget?.id ?? 'new'}
        webhook={editTarget}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!editTarget && createMutation.isSuccess) {
              setNewSecret(createMutation.data?.secret ?? null);
            }
            setEditTarget(null);
          }
          setDialogOpen(open);
        }}
      />

      {newSecret && <SecretRevealDialog secret={newSecret} onClose={() => setNewSecret(null)} />}

      {deleteTarget && (
        <DeleteWebhookDialog
          key={deleteTarget.id}
          webhook={deleteTarget}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      )}

      {deliveryTarget && (
        <DeliveryLogSheet
          key={deliveryTarget.id}
          webhook={deliveryTarget}
          open
          onOpenChange={(open) => {
            if (!open) setDeliveryTarget(null);
          }}
        />
      )}
    </div>
  );
}
