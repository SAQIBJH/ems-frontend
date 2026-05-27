'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import {
  usePayrollComponents,
  useCreatePayGroup,
  useUpdatePayGroup,
  COMPONENT_TYPE_CONFIG,
  CALCULATION_TYPE_CONFIG,
  payGroupSchema,
} from '../index';
import type { PayGroup, CalculationType } from '../types/payroll.types';
import type { PayGroupFormValues } from '../validations/pay-group.schema';

interface PayGroupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: PayGroup | null;
  onSuccess?: (id: string) => void;
}

const PAY_SCHEDULES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'WEEKLY', label: 'Weekly' },
] as const;

export function PayGroupDrawer({ open, onOpenChange, group, onSuccess }: PayGroupDrawerProps) {
  const isEdit = !!group;
  const createMutation = useCreatePayGroup();
  const updateMutation = useUpdatePayGroup();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: allComponents = [] } = usePayrollComponents();
  const [expandedOverrides, setExpandedOverrides] = useState<Set<string>>(new Set());

  const form = useForm<PayGroupFormValues>({
    resolver: zodResolver(payGroupSchema),
    defaultValues: {
      name: '',
      code: '',
      currency: 'INR',
      paySchedule: 'MONTHLY',
      description: null,
      active: true,
      components: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  const watchedComponents = form.watch('components');

  const selectedComponentIds = useMemo(
    () => new Set(watchedComponents.map((c) => c.componentId)),
    [watchedComponents],
  );

  useEffect(() => {
    if (!open) return;
    setExpandedOverrides(new Set());
    if (group) {
      form.reset({
        name: group.name,
        code: group.code,
        currency: group.currency,
        paySchedule: group.paySchedule,
        description: group.description ?? null,
        active: group.active,
        components: group.components.map((gc) => ({
          componentId: gc.componentId,
          overrideCalculationType: gc.overrideCalculationType,
          overrideValue: gc.overrideValue,
          overrideFormula: gc.overrideFormula,
        })),
      });
    } else {
      form.reset({
        name: '',
        code: '',
        currency: 'INR',
        paySchedule: 'MONTHLY',
        description: null,
        active: true,
        components: [],
      });
    }
  }, [open, group]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue('name', e.target.value);
    if (!isEdit) {
      const slug = e.target.value
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '')
        .replace(/^_+|_+$/g, '');
      form.setValue('code', slug);
    }
  }

  function toggleComponent(componentId: string, checked: boolean) {
    if (checked) {
      append({
        componentId,
        overrideCalculationType: null,
        overrideValue: null,
        overrideFormula: null,
      });
    } else {
      const idx = watchedComponents.findIndex((c) => c.componentId === componentId);
      if (idx !== -1) {
        remove(idx);
        setExpandedOverrides((prev) => {
          const next = new Set(prev);
          next.delete(componentId);
          return next;
        });
      }
    }
  }

  function toggleOverrideExpand(componentId: string) {
    setExpandedOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  }

  function getFieldIndex(componentId: string): number {
    return watchedComponents.findIndex((c) => c.componentId === componentId);
  }

  function setOverrideCalcType(fieldIdx: number, val: string) {
    const ct = val === '_default' ? null : (val as CalculationType);
    form.setValue(`components.${fieldIdx}.overrideCalculationType`, ct);
    if (!ct) {
      form.setValue(`components.${fieldIdx}.overrideValue`, null);
      form.setValue(`components.${fieldIdx}.overrideFormula`, null);
    }
  }

  function onSubmit(values: PayGroupFormValues) {
    if (isEdit && group) {
      updateMutation.mutate(
        { id: group.id, ...values },
        {
          onSuccess: (updated) => {
            toast.success('Pay group updated');
            onOpenChange(false);
            onSuccess?.(updated.id);
          },
          onError: (err) => {
            const apiErr = (
              err as AxiosError<{ success: false; error: { code: string; message: string } }>
            ).response?.data?.error;
            toast.error(apiErr?.message ?? 'Failed to update pay group');
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: (created) => {
          toast.success('Pay group created');
          onOpenChange(false);
          onSuccess?.(created.id);
        },
        onError: (err) => {
          const apiErr = (
            err as AxiosError<{ success: false; error: { code: string; message: string } }>
          ).response?.data?.error;
          if (apiErr?.code === 'CODE_EXISTS') {
            form.setError('code', { message: 'Code already taken' });
          } else {
            toast.error(apiErr?.message ?? 'Failed to create pay group');
          }
        },
      });
    }
  }

  const activeComponents = allComponents
    .filter((c) => c.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={!isPending}
        className="w-full sm:w-[560px] sm:max-w-[560px] flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-subtle px-6 py-4 shrink-0">
          <SheetTitle>{isEdit ? 'Edit Pay Group' : 'New Pay Group'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
                Basic Information
              </p>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="pg-name">Name</Label>
                <Input
                  id="pg-name"
                  value={form.watch('name')}
                  onChange={handleNameChange}
                  placeholder="e.g. Standard India — Engineering"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="pg-code">Code</Label>
                  <Input
                    id="pg-code"
                    {...form.register('code')}
                    readOnly={isEdit}
                    placeholder="STANDARD_IND_ENG"
                    className={cn('font-mono uppercase', isEdit && 'opacity-60 cursor-not-allowed')}
                  />
                  {form.formState.errors.code && (
                    <p className="text-xs text-danger">{form.formState.errors.code.message}</p>
                  )}
                  {!isEdit && <p className="text-xs text-fg-muted">Immutable after creation</p>}
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <Label htmlFor="pg-currency">Currency (ISO 4217)</Label>
                  <Input
                    id="pg-currency"
                    {...form.register('currency')}
                    placeholder="INR"
                    className="uppercase"
                    maxLength={3}
                  />
                  {form.formState.errors.currency && (
                    <p className="text-xs text-danger">{form.formState.errors.currency.message}</p>
                  )}
                </div>
              </div>

              {/* Pay Schedule */}
              <div className="space-y-1.5">
                <Label htmlFor="pg-schedule">Pay Schedule</Label>
                <Controller
                  control={form.control}
                  name="paySchedule"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="pg-schedule" className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_SCHEDULES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.paySchedule && (
                  <p className="text-xs text-danger">{form.formState.errors.paySchedule.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="pg-desc">
                  Description <span className="font-normal text-fg-muted">(optional)</span>
                </Label>
                <Textarea
                  id="pg-desc"
                  {...form.register('description')}
                  placeholder="Brief description of this pay group"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2.5">
                <Label htmlFor="pg-active" className="cursor-pointer text-sm">
                  Active
                </Label>
                <Controller
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <Switch id="pg-active" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <hr className="border-subtle" />

            {/* Component selection */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
                  Salary Components
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  Select which components are included. Expand a component to override its
                  calculation for this group.
                </p>
              </div>

              {activeComponents.length === 0 ? (
                <p className="text-sm text-fg-muted py-2">
                  No active salary components defined yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeComponents.map((comp) => {
                    const isSelected = selectedComponentIds.has(comp.id);
                    const fieldIdx = getFieldIndex(comp.id);
                    const cfg = COMPONENT_TYPE_CONFIG[comp.type];
                    const isExpanded = expandedOverrides.has(comp.id);
                    const fieldData =
                      isSelected && fieldIdx !== -1 ? watchedComponents[fieldIdx] : null;
                    const hasOverride = fieldData
                      ? fieldData.overrideCalculationType !== null ||
                        fieldData.overrideValue !== null ||
                        fieldData.overrideFormula !== null
                      : false;

                    return (
                      <div
                        key={comp.id}
                        className={cn(
                          'rounded-lg border transition-colors',
                          isSelected
                            ? 'border-ring/40 bg-surface'
                            : 'border-subtle bg-surface-raised/20',
                        )}
                      >
                        {/* Main row */}
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleComponent(comp.id, e.target.checked)}
                            className="size-4 rounded border-input accent-brand cursor-pointer shrink-0"
                            aria-label={`Include ${comp.name}`}
                          />
                          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-sm',
                                isSelected ? 'text-fg font-medium' : 'text-fg-muted',
                              )}
                            >
                              {comp.name}
                            </span>
                            <span className="font-mono text-xs text-fg-muted">{comp.code}</span>
                            <span
                              className={cn(
                                'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                                cfg.color,
                              )}
                            >
                              {cfg.label}
                            </span>
                            {hasOverride && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                                Overridden
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <button
                              type="button"
                              onClick={() => toggleOverrideExpand(comp.id)}
                              className="flex items-center gap-0.5 text-xs text-fg-muted hover:text-fg cursor-pointer shrink-0"
                              aria-expanded={isExpanded}
                            >
                              Override
                              {isExpanded ? (
                                <ChevronDownIcon className="size-3" />
                              ) : (
                                <ChevronRightIcon className="size-3" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Override section (expanded) */}
                        {isSelected && isExpanded && fieldIdx !== -1 && (
                          <div className="border-t border-subtle px-4 py-3 space-y-3 bg-surface-raised/30">
                            <p className="text-xs text-fg-muted">
                              Override the default calculation for this component in this group
                              only. Leave at &quot;Default&quot; to use the component&apos;s global
                              setting.
                            </p>

                            {/* Override calc type */}
                            <div className="space-y-1.5">
                              <Label className="text-xs">Override Calculation Type</Label>
                              <Select
                                value={
                                  watchedComponents[fieldIdx].overrideCalculationType ?? '_default'
                                }
                                onValueChange={(v) =>
                                  setOverrideCalcType(fieldIdx, v ?? '_default')
                                }
                              >
                                <SelectTrigger className="h-8 w-full cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_default">Default (no override)</SelectItem>
                                  {(['FLAT', 'PERCENTAGE', 'FORMULA'] as const).map((ct) => (
                                    <SelectItem key={ct} value={ct}>
                                      {CALCULATION_TYPE_CONFIG[ct].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Override value for FLAT */}
                            {watchedComponents[fieldIdx].overrideCalculationType === 'FLAT' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Override Amount (per month)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="h-8"
                                  placeholder="50000"
                                  value={watchedComponents[fieldIdx].overrideValue ?? ''}
                                  onChange={(e) =>
                                    form.setValue(
                                      `components.${fieldIdx}.overrideValue`,
                                      e.target.value === '' ? null : parseFloat(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            )}

                            {/* Override value for PERCENTAGE */}
                            {watchedComponents[fieldIdx].overrideCalculationType ===
                              'PERCENTAGE' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Override Percentage (%)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  className="h-8"
                                  placeholder="40"
                                  value={watchedComponents[fieldIdx].overrideValue ?? ''}
                                  onChange={(e) =>
                                    form.setValue(
                                      `components.${fieldIdx}.overrideValue`,
                                      e.target.value === '' ? null : parseFloat(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            )}

                            {/* Override formula for FORMULA */}
                            {watchedComponents[fieldIdx].overrideCalculationType === 'FORMULA' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Override Formula</Label>
                                <Input
                                  className="h-8 font-mono text-xs"
                                  placeholder="e.g. BASIC * 0.5"
                                  value={watchedComponents[fieldIdx].overrideFormula ?? ''}
                                  onChange={(e) =>
                                    form.setValue(
                                      `components.${fieldIdx}.overrideFormula`,
                                      e.target.value === '' ? null : e.target.value,
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hidden - needed to satisfy react-hook-form for tracking */}
              {fields.map((field, idx) => (
                <input
                  key={field.id}
                  type="hidden"
                  {...form.register(`components.${idx}.componentId`)}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-subtle px-6 py-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
              {isEdit ? 'Save Changes' : 'Create Pay Group'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
