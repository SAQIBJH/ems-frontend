'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
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
  useCreateComponent,
  useUpdateComponent,
  COMPONENT_TYPE_CONFIG,
  CALCULATION_TYPE_CONFIG,
  computeComponentBreakdown,
  validateFormula,
  salaryComponentSchema,
} from '../index';
import type { SalaryComponent, ComponentType } from '../types/payroll.types';
import type { SalaryComponentFormValues } from '../validations/salary-component.schema';

const SAMPLE_CTC = 1_200_000;

const COMPONENT_TYPES: ComponentType[] = ['EARNING', 'DEDUCTION', 'BENEFIT', 'REIMBURSEMENT'];

interface FormulaPreviewTableProps {
  formula: string;
  currentCode: string;
  allComponents: SalaryComponent[];
}

function FormulaPreviewTable({ formula, currentCode, allComponents }: FormulaPreviewTableProps) {
  const breakdown = useMemo(() => {
    if (!formula.trim()) return null;
    const previewCode = currentCode.trim() || '_PREVIEW';
    const modified: SalaryComponent[] = [
      ...allComponents.filter((c) => c.code !== previewCode),
      {
        id: '_preview',
        name: 'This Component',
        code: previewCode,
        type: 'EARNING',
        calculationType: 'FORMULA',
        value: null,
        basisCode: null,
        formula,
        taxable: true,
        active: true,
        displayOrder: 999,
        description: null,
        createdAt: '',
        updatedAt: '',
      },
    ];
    try {
      return computeComponentBreakdown(modified, SAMPLE_CTC);
    } catch {
      return null;
    }
  }, [formula, currentCode, allComponents]);

  if (!breakdown) return null;

  return (
    <div className="mt-2 rounded-lg border border-subtle bg-surface-raised overflow-hidden">
      <div className="px-3 py-2 text-xs font-medium text-fg-muted border-b border-subtle">
        Preview — Sample Annual CTC ₹12,00,000
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-subtle">
            <th className="text-left px-3 py-1.5 font-medium text-fg-muted">Code</th>
            <th className="text-left px-3 py-1.5 font-medium text-fg-muted">Name</th>
            <th className="text-right px-3 py-1.5 font-medium text-fg-muted">Monthly</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((item) => (
            <tr
              key={item.code}
              className={cn(
                'border-b border-subtle last:border-0',
                item.code === (currentCode.trim() || '_PREVIEW') && 'bg-brand/5 font-medium',
              )}
            >
              <td className="px-3 py-1.5 font-mono text-fg-muted">{item.code}</td>
              <td className="px-3 py-1.5 text-fg">{item.name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-fg">
                ₹{item.monthlyAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SalaryComponentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: SalaryComponent | null;
  allComponents: SalaryComponent[];
}

export function SalaryComponentDrawer({
  open,
  onOpenChange,
  component,
  allComponents,
}: SalaryComponentDrawerProps) {
  const isEdit = !!component;
  const createMutation = useCreateComponent();
  const updateMutation = useUpdateComponent();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [formulaError, setFormulaError] = useState<string | null>(null);

  const otherComponents = useMemo(
    () => (isEdit ? allComponents.filter((c) => c.id !== component?.id) : allComponents),
    [allComponents, isEdit, component],
  );

  const form = useForm<SalaryComponentFormValues>({
    resolver: zodResolver(salaryComponentSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'EARNING',
      calculationType: 'FLAT',
      value: null,
      basisCode: null,
      formula: null,
      taxable: true,
      active: true,
      displayOrder: 1,
      description: null,
    },
  });

  const calculationType = form.watch('calculationType');
  const formulaValue = form.watch('formula') ?? '';
  const codeValue = form.watch('code') ?? '';

  useEffect(() => {
    if (!open) return;
    setFormulaError(null);
    if (component) {
      form.reset({
        name: component.name,
        code: component.code,
        type: component.type,
        calculationType: component.calculationType,
        value: component.value,
        basisCode: component.basisCode,
        formula: component.formula,
        taxable: component.taxable,
        active: component.active,
        displayOrder: component.displayOrder,
        description: component.description ?? null,
      });
    } else {
      const maxOrder =
        allComponents.length > 0 ? Math.max(...allComponents.map((c) => c.displayOrder)) + 1 : 1;
      form.reset({
        name: '',
        code: '',
        type: 'EARNING',
        calculationType: 'FLAT',
        value: null,
        basisCode: null,
        formula: null,
        taxable: true,
        active: true,
        displayOrder: maxOrder,
        description: null,
      });
    }
  }, [open, component]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleFormulaBlur() {
    const formula = form.getValues('formula');
    if (!formula) {
      setFormulaError(null);
      return;
    }
    const knownCodes = otherComponents.map((c) => c.code);
    const result = validateFormula(formula, knownCodes);
    setFormulaError(result.valid ? null : (result.error ?? 'Invalid formula'));
  }

  function onSubmit(values: SalaryComponentFormValues) {
    // Clear irrelevant fields per calculation type
    if (values.calculationType === 'FLAT') {
      values.basisCode = null;
      values.formula = null;
    } else if (values.calculationType === 'PERCENTAGE') {
      values.formula = null;
    } else {
      values.value = null;
      values.basisCode = null;
    }
    values.description = values.description || null;

    if (isEdit && component) {
      updateMutation.mutate(
        { id: component.id, ...values },
        {
          onSuccess: () => {
            toast.success('Component updated');
            onOpenChange(false);
          },
          onError: (err) => {
            const apiErr = (
              err as AxiosError<{ success: false; error: { code: string; message: string } }>
            ).response?.data?.error;
            if (apiErr?.code === 'INVALID_FORMULA') {
              form.setError('formula', { message: 'Invalid formula or circular dependency' });
            } else {
              toast.error(apiErr?.message ?? 'Failed to update component');
            }
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Component created');
          onOpenChange(false);
        },
        onError: (err) => {
          const apiErr = (
            err as AxiosError<{ success: false; error: { code: string; message: string } }>
          ).response?.data?.error;
          if (apiErr?.code === 'CODE_EXISTS') {
            form.setError('code', { message: 'Code already taken' });
          } else if (apiErr?.code === 'INVALID_FORMULA') {
            form.setError('formula', { message: 'Invalid formula or circular dependency' });
          } else {
            toast.error(apiErr?.message ?? 'Failed to create component');
          }
        },
      });
    }
  }

  const earningComponents = otherComponents.filter((c) => c.type === 'EARNING' && c.active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={!isPending}
        className="w-full sm:w-[540px] sm:max-w-[540px] flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-subtle px-6 py-4 shrink-0">
          <SheetTitle>{isEdit ? 'Edit Salary Component' : 'New Salary Component'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Section 1 — Basic Information */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
                Basic Information
              </p>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="comp-name">Name</Label>
                <Input
                  id="comp-name"
                  value={form.watch('name')}
                  onChange={handleNameChange}
                  placeholder="e.g. Basic Salary"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="comp-code">Code</Label>
                  <Input
                    id="comp-code"
                    {...form.register('code')}
                    readOnly={isEdit}
                    placeholder="BASIC_SALARY"
                    className={cn('font-mono uppercase', isEdit && 'opacity-60 cursor-not-allowed')}
                  />
                  {form.formState.errors.code && (
                    <p className="text-xs text-danger">{form.formState.errors.code.message}</p>
                  )}
                  {!isEdit && <p className="text-xs text-fg-muted">Immutable after creation</p>}
                </div>

                {/* Display Order */}
                <div className="space-y-1.5">
                  <Label htmlFor="comp-order">Display Order</Label>
                  <Input
                    id="comp-order"
                    type="number"
                    min={1}
                    {...form.register('displayOrder', { valueAsNumber: true })}
                  />
                  {form.formState.errors.displayOrder && (
                    <p className="text-xs text-danger">
                      {form.formState.errors.displayOrder.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label htmlFor="comp-type">Type</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="comp-type" className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPONENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {COMPONENT_TYPE_CONFIG[t].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.type && (
                  <p className="text-xs text-danger">{form.formState.errors.type.message}</p>
                )}
              </div>

              {/* Taxable + Active toggles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2.5">
                  <Label htmlFor="comp-taxable" className="cursor-pointer text-sm">
                    Taxable
                  </Label>
                  <Controller
                    control={form.control}
                    name="taxable"
                    render={({ field }) => (
                      <Switch
                        id="comp-taxable"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2.5">
                  <Label htmlFor="comp-active" className="cursor-pointer text-sm">
                    Active
                  </Label>
                  <Controller
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <Switch
                        id="comp-active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="comp-desc">
                  Description <span className="font-normal text-fg-muted">(optional)</span>
                </Label>
                <Textarea
                  id="comp-desc"
                  {...form.register('description')}
                  placeholder="Brief description of this component"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            <hr className="border-subtle" />

            {/* Section 2 — Calculation */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
                Calculation
              </p>

              {/* Calculation type selector */}
              <div className="space-y-1.5">
                <Label>Calculation Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FLAT', 'PERCENTAGE', 'FORMULA'] as const).map((ct) => {
                    const config = CALCULATION_TYPE_CONFIG[ct];
                    const checked = calculationType === ct;
                    return (
                      <label
                        key={ct}
                        className={cn(
                          'flex flex-col gap-0.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors select-none',
                          checked
                            ? 'border-ring bg-brand/5 text-fg'
                            : 'border-subtle hover:border-ring/40 text-fg-muted',
                        )}
                      >
                        <input
                          type="radio"
                          value={ct}
                          {...form.register('calculationType')}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{config.label}</span>
                        <span className="text-xs leading-tight">{config.description}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* FLAT: amount */}
              {calculationType === 'FLAT' && (
                <div className="space-y-1.5">
                  <Label htmlFor="comp-value">Amount (per month)</Label>
                  <Input
                    id="comp-value"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="50000"
                    {...form.register('value', {
                      setValueAs: (v: string) => (v === '' || v === null ? null : parseFloat(v)),
                    })}
                  />
                  {form.formState.errors.value && (
                    <p className="text-xs text-danger">{form.formState.errors.value.message}</p>
                  )}
                </div>
              )}

              {/* PERCENTAGE: % + basis */}
              {calculationType === 'PERCENTAGE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-pct">Percentage (%)</Label>
                    <Input
                      id="comp-pct"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      placeholder="40"
                      {...form.register('value', {
                        setValueAs: (v: string) => (v === '' || v === null ? null : parseFloat(v)),
                      })}
                    />
                    {form.formState.errors.value && (
                      <p className="text-xs text-danger">{form.formState.errors.value.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-basis">Basis Component</Label>
                    <Controller
                      control={form.control}
                      name="basisCode"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={(v) => field.onChange(v || null)}
                        >
                          <SelectTrigger id="comp-basis" className="w-full cursor-pointer">
                            <SelectValue placeholder="Select component" />
                          </SelectTrigger>
                          <SelectContent>
                            {earningComponents.map((c) => (
                              <SelectItem key={c.id} value={c.code}>
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.basisCode && (
                      <p className="text-xs text-danger">
                        {form.formState.errors.basisCode.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* FORMULA: textarea + reference + preview */}
              {calculationType === 'FORMULA' && (
                <div className="space-y-2">
                  <Label htmlFor="comp-formula">Formula</Label>
                  <Textarea
                    id="comp-formula"
                    {...form.register('formula')}
                    onBlur={handleFormulaBlur}
                    placeholder="e.g. BASIC * 0.4"
                    rows={2}
                    className={cn(
                      'resize-none font-mono text-sm',
                      formulaError && 'border-destructive',
                    )}
                  />
                  {(formulaError ?? form.formState.errors.formula) && (
                    <p className="text-xs text-danger">
                      {formulaError ?? form.formState.errors.formula?.message}
                    </p>
                  )}

                  <details className="group">
                    <summary className="cursor-pointer text-xs text-fg-muted hover:text-fg">
                      Available variables
                    </summary>
                    <div className="mt-1.5 rounded-lg bg-surface-raised px-3 py-2 text-xs font-mono text-fg-muted space-y-0.5">
                      <p>
                        <span className="text-fg">CTC</span> — monthly CTC
                      </p>
                      <p>
                        <span className="text-fg">GROSS</span> — sum of earnings
                      </p>
                      <p>
                        <span className="text-fg">NET</span> — GROSS minus deductions
                      </p>
                      {otherComponents
                        .filter((c) => c.active)
                        .map((c) => (
                          <p key={c.code}>
                            <span className="text-fg">{c.code}</span> — {c.name}
                          </p>
                        ))}
                    </div>
                  </details>

                  <FormulaPreviewTable
                    formula={formulaValue}
                    currentCode={codeValue}
                    allComponents={otherComponents}
                  />
                </div>
              )}
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
              {isEdit ? 'Save Changes' : 'Create Component'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
