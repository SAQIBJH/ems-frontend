'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDaysIcon, CheckIcon, EditIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RoleGate } from '@/shared/guards/RoleGate';
import type { ApiError } from '@/types/api';

import { useLeaveTypes } from '../hooks/useSettings';
import {
  useCreateLeaveType,
  useDeleteLeaveType,
  useUpdateLeaveType,
} from '../hooks/useSettingsMutations';
import { leaveTypeSchema, type LeaveTypeFormValues } from '../validations/settings.schema';
import type { LeaveType } from '../types/settings.types';

const ADMIN_ROLES = ['HR_ADMIN', 'SUPER_ADMIN'] as const;

function LeaveTypesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-subtle px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface LeaveTypeFormProps {
  defaultValues?: LeaveTypeFormValues;
  onSubmit: (values: LeaveTypeFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
  submitLabel: string;
}

function LeaveTypeForm({
  defaultValues,
  onSubmit,
  isPending,
  onCancel,
  submitLabel,
}: LeaveTypeFormProps) {
  const form = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: defaultValues ?? {
      name: '',
      code: '',
      annualAllowance: 0,
      isPaid: true,
      carryForwardAllowed: false,
      color: '',
    },
  });

  const colorValue = form.watch('color');

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="lt-name">Name</Label>
          <Input id="lt-name" placeholder="Annual Leave" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Code */}
        <div className="space-y-1.5">
          <Label htmlFor="lt-code">Code</Label>
          <Input
            id="lt-code"
            placeholder="ANNUAL"
            className="font-mono uppercase"
            {...form.register('code', {
              setValueAs: (v: string) => v.toUpperCase(),
            })}
          />
          {form.formState.errors.code && (
            <p className="text-xs text-danger">{form.formState.errors.code.message}</p>
          )}
        </div>

        {/* Annual allowance */}
        <div className="space-y-1.5">
          <Label htmlFor="lt-days">Days per Year</Label>
          <Input
            id="lt-days"
            type="number"
            min={0}
            max={365}
            placeholder="21"
            {...form.register('annualAllowance', { valueAsNumber: true })}
          />
          {form.formState.errors.annualAllowance && (
            <p className="text-xs text-danger">{form.formState.errors.annualAllowance.message}</p>
          )}
        </div>

        {/* Colour */}
        <div className="space-y-1.5">
          <Label htmlFor="lt-color">Colour (optional)</Label>
          <div className="flex items-center gap-2">
            <div
              className="size-9 rounded-md border border-subtle shrink-0"
              style={{
                backgroundColor: /^#[0-9a-fA-F]{6}$/.test(colorValue ?? '')
                  ? colorValue
                  : undefined,
              }}
            />
            <Input
              id="lt-color"
              placeholder="#94a3b8"
              className="font-mono"
              {...form.register('color')}
            />
          </div>
          {form.formState.errors.color && (
            <p className="text-xs text-danger">{form.formState.errors.color.message}</p>
          )}
        </div>
      </div>

      {/* Boolean toggles */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="lt-paid"
            checked={form.watch('isPaid')}
            onCheckedChange={(val) => form.setValue('isPaid', val, { shouldDirty: true })}
          />
          <Label htmlFor="lt-paid" className="cursor-pointer">
            Paid leave
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="lt-carry"
            checked={form.watch('carryForwardAllowed')}
            onCheckedChange={(val) =>
              form.setValue('carryForwardAllowed', val, { shouldDirty: true })
            }
          />
          <Label htmlFor="lt-carry" className="cursor-pointer">
            Carry forward allowed
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface DeleteDialogProps {
  leaveType: LeaveType;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteDialog({ leaveType, onConfirm, onCancel, isPending }: DeleteDialogProps) {
  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Deactivate leave type?</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-fg-muted">
        <span className="font-medium text-fg">{leaveType.name}</span> will be soft-deactivated.
        Existing leave requests won&apos;t be affected, but employees won&apos;t be able to apply
        for this type going forward.
      </p>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
          <Trash2Icon className="size-3.5 mr-1.5" />
          {isPending ? 'Deactivating…' : 'Deactivate'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function LeaveTypesPanel() {
  const { data, isLoading, isError, refetch } = useLeaveTypes();
  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();
  const deleteMutation = useDeleteLeaveType();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);

  function handleCreate(values: LeaveTypeFormValues) {
    createMutation.mutate(
      {
        ...values,
        color: values.color || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`"${values.name}" created`);
          setAddOpen(false);
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          const code = axiosErr.response?.data?.error?.code;
          if (code === 'DUPLICATE_LEAVE_TYPE_CODE') {
            toast.error(`Code "${values.code}" is already in use. Choose a different code.`);
          } else {
            toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to create leave type');
          }
        },
      },
    );
  }

  function handleUpdate(values: LeaveTypeFormValues) {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, input: { ...values, color: values.color || undefined } },
      {
        onSuccess: () => {
          toast.success('Leave type updated');
          setEditTarget(null);
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to update leave type');
        },
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.name}" deactivated`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        const code = axiosErr.response?.data?.error?.code;
        if (code === 'LEAVE_TYPE_IN_USE') {
          toast.error('This leave type has active balance records and cannot be deactivated.');
        } else {
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to deactivate leave type');
        }
      },
    });
  }

  if (isError) {
    return <ErrorState message="Failed to load leave types." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="size-4 text-fg-subtle" />
            <h2 className="text-sm font-semibold text-fg">Leave Types</h2>
          </div>
          <p className="text-sm text-fg-muted">
            Manage the leave categories available to your employees.
          </p>
        </div>

        <RoleGate roles={[...ADMIN_ROLES]}>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-3.5 mr-1.5" />
            Add Type
          </Button>
        </RoleGate>
      </div>

      {/* List */}
      {isLoading ? (
        <LeaveTypesSkeleton />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No leave types yet"
          description="Add your first leave type to allow employees to submit requests."
          action={
            <RoleGate roles={[...ADMIN_ROLES]}>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <PlusIcon className="size-3.5 mr-1.5" />
                Add Type
              </Button>
            </RoleGate>
          }
        />
      ) : (
        <div className="rounded-lg border border-subtle divide-y divide-subtle">
          {data.map((lt) => (
            <div
              key={lt.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-raised/40 transition-colors"
            >
              {/* Left: colour dot + name + code */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="size-2.5 rounded-full shrink-0 border border-subtle"
                  style={{ backgroundColor: lt.color ?? '#94a3b8' }}
                />
                <span className="text-sm font-medium text-fg truncate">{lt.name}</span>
                <span className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-fg-subtle border border-subtle">
                  {lt.code}
                </span>
              </div>

              {/* Right: metadata + actions */}
              <div className="flex items-center gap-5 shrink-0 ml-4">
                <span className="text-xs text-fg-subtle">{lt.annualAllowance}d / yr</span>

                <span className="flex items-center gap-1 text-xs text-fg-subtle">
                  {lt.isPaid ? (
                    <CheckIcon className="size-3 text-success" />
                  ) : (
                    <XIcon className="size-3 text-fg-muted" />
                  )}
                  Paid
                </span>

                <span className="flex items-center gap-1 text-xs text-fg-subtle">
                  {lt.carryForwardAllowed ? (
                    <CheckIcon className="size-3 text-success" />
                  ) : (
                    <XIcon className="size-3 text-fg-muted" />
                  )}
                  Carry fwd
                </span>

                <RoleGate roles={[...ADMIN_ROLES]}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setEditTarget(lt)}
                      title="Edit"
                    >
                      <EditIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-danger hover:text-danger"
                      onClick={() => setDeleteTarget(lt)}
                      title="Deactivate"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </RoleGate>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Leave Type</DialogTitle>
          </DialogHeader>
          <LeaveTypeForm
            onSubmit={handleCreate}
            isPending={createMutation.isPending}
            onCancel={() => setAddOpen(false)}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Leave Type</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <LeaveTypeForm
              defaultValues={{
                name: editTarget.name,
                code: editTarget.code,
                annualAllowance: editTarget.annualAllowance,
                isPaid: editTarget.isPaid,
                carryForwardAllowed: editTarget.carryForwardAllowed,
                color: editTarget.color ?? '',
              }}
              onSubmit={handleUpdate}
              isPending={updateMutation.isPending}
              onCancel={() => setEditTarget(null)}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        {deleteTarget && (
          <DeleteDialog
            leaveType={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  );
}
