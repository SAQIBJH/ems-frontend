'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import {
  usePayGroups,
  useAssignSalary,
  useCountries,
  useBankSchema,
  useLegalEntities,
} from '@/modules/payroll';
import { usePayrollStore } from '@/store/payroll.store';
import type { EmployeeSalary } from '@/modules/payroll';

/* ── schema ───────────────────────────────────────────────────────────────── */

const salaryAssignmentSchema = z.object({
  payGroupId: z.string().min(1, 'Pay group is required'),
  annualCtc: z.number().min(1, 'CTC must be greater than 0'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  country: z.string().min(2, 'Country is required'),
  residenceJurisdiction: z.string(),
  bankAccount: z.record(z.string(), z.string()),
});

type FormValues = z.infer<typeof salaryAssignmentSchema>;

/* ── component ────────────────────────────────────────────────────────────── */

interface SalaryAssignmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  existing: EmployeeSalary | null;
}

export function SalaryAssignmentDrawer({
  open,
  onOpenChange,
  employeeId,
  existing,
}: SalaryAssignmentDrawerProps) {
  const isEdit = !!existing;

  const { data: payGroups = [], isLoading: groupsLoading } = usePayGroups();
  const { data: countries = [] } = useCountries();
  const { data: entities = [] } = useLegalEntities();
  const activeEntityId = usePayrollStore((s) => s.activeLegalEntityId);
  const assignMutation = useAssignSalary();

  const defaultCountry =
    entities.find((e) => e.id === activeEntityId)?.country ?? entities[0]?.country ?? 'IN';

  const form = useForm<FormValues>({
    resolver: zodResolver(salaryAssignmentSchema),
    defaultValues: {
      payGroupId: '',
      annualCtc: 0,
      effectiveFrom: '',
      country: 'IN',
      residenceJurisdiction: '',
      bankAccount: {},
    },
  });

  const country = form.watch('country');
  const { data: bankSchema = [], isLoading: schemaLoading } = useBankSchema(country);

  /* Populate form when opening */
  useEffect(() => {
    if (!open) return;
    if (existing) {
      form.reset({
        payGroupId: existing.payGroupId,
        annualCtc: existing.annualCtc,
        effectiveFrom: existing.effectiveFrom,
        country: existing.country || defaultCountry,
        residenceJurisdiction: existing.residenceJurisdiction ?? '',
        bankAccount: existing.bankAccount ?? {},
      });
    } else {
      form.reset({
        payGroupId: payGroups[0]?.id ?? '',
        annualCtc: 0,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        country: defaultCountry,
        residenceJurisdiction: '',
        bankAccount: {},
      });
    }
  }, [open, existing, payGroups, defaultCountry, form]);

  function handleCountryChange(value: string) {
    form.setValue('country', value);
    form.setValue('bankAccount', {});
    form.clearErrors('bankAccount');
  }

  async function onSubmit(values: FormValues) {
    // Validate bank fields against the country schema (required + regex).
    form.clearErrors('bankAccount');
    let hasError = false;
    for (const field of bankSchema) {
      const value = (values.bankAccount[field.key] ?? '').trim();
      const path = `bankAccount.${field.key}` as Path<FormValues>;
      if (field.required && !value) {
        form.setError(path, { message: `${field.label} is required` });
        hasError = true;
      } else if (value && field.regex && !new RegExp(field.regex).test(value)) {
        form.setError(path, { message: `Invalid ${field.label.toLowerCase()}` });
        hasError = true;
      }
    }
    if (hasError) return;

    const residence = values.residenceJurisdiction.trim();
    const input = {
      ...values,
      residenceJurisdiction: residence || undefined,
      // Work locations default to the residence jurisdiction (single-location demo);
      // the engine taxes the resolved set, so multi-location is a data change only.
      workLocations: residence ? [{ jurisdiction: residence, allocationPct: 100 }] : undefined,
    };

    try {
      await assignMutation.mutateAsync({ employeeId, input });
      toast.success(isEdit ? 'Salary updated' : 'Salary assigned');
      onOpenChange(false);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to save salary configuration');
    }
  }

  const bankErrors = form.formState.errors.bankAccount as
    | Record<string, { message?: string }>
    | undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEdit ? 'Edit Salary Configuration' : 'Assign Salary'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Pay Group */}
          <div className="space-y-1.5">
            <Label htmlFor="sal-paygroup">Pay Group *</Label>
            <Controller
              control={form.control}
              name="payGroupId"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="sal-paygroup"
                    className="w-full cursor-pointer"
                    disabled={groupsLoading}
                  >
                    <SelectValue placeholder="Select pay group…" />
                  </SelectTrigger>
                  <SelectContent>
                    {payGroups
                      .filter((g) => g.active)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} ({g.currency})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.payGroupId && (
              <p className="text-xs text-danger">{form.formState.errors.payGroupId.message}</p>
            )}
          </div>

          {/* Annual CTC */}
          <div className="space-y-1.5">
            <Label htmlFor="sal-ctc">Annual CTC *</Label>
            {/* step must stay "any": a fixed step (e.g. 1000) makes the browser's native
               number validation reject round CTCs like 1200000 (only 1+1000·n pass),
               which silently blocks the form's submit event before RHF/Zod ever run. */}
            <Input
              id="sal-ctc"
              type="number"
              min={1}
              step="any"
              placeholder="e.g. 1200000"
              {...form.register('annualCtc', { valueAsNumber: true })}
            />
            {form.formState.errors.annualCtc && (
              <p className="text-xs text-danger">{form.formState.errors.annualCtc.message}</p>
            )}
          </div>

          {/* Effective From */}
          <div className="space-y-1.5">
            <Label htmlFor="sal-date">Effective From *</Label>
            <Input id="sal-date" type="date" {...form.register('effectiveFrom')} />
            {form.formState.errors.effectiveFrom && (
              <p className="text-xs text-danger">{form.formState.errors.effectiveFrom.message}</p>
            )}
          </div>

          {/* Tax residence jurisdiction — drives multi-jurisdiction local taxes */}
          <div className="space-y-1.5">
            <Label htmlFor="sal-jurisdiction">
              Tax residence <span className="font-normal text-fg-muted">(ISO 3166-2)</span>
            </Label>
            <Input
              id="sal-jurisdiction"
              placeholder="e.g. IN-MH"
              className="font-mono uppercase"
              {...form.register('residenceJurisdiction', {
                setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
              })}
            />
            <p className="text-xs text-fg-muted">
              Resolves local taxes (e.g. professional tax) from the statutory pack.
            </p>
          </div>

          {/* Bank details section — fields driven by the country schema */}
          <div className="space-y-4 rounded-lg border border-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                Bank Details
              </p>
              <Controller
                control={form.control}
                name="country"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => handleCountryChange(v ?? '')}
                  >
                    <SelectTrigger className="h-7 w-[140px] cursor-pointer text-xs">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div key={country} className="space-y-4">
              {schemaLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                  ))}
                </div>
              ) : (
                bankSchema.map((bf) => (
                  <div key={bf.key} className="space-y-1.5">
                    <Label htmlFor={`sal-bank-${bf.key}`}>
                      {bf.label}
                      {bf.required && ' *'}
                    </Label>
                    <Input
                      id={`sal-bank-${bf.key}`}
                      placeholder={bf.placeholder}
                      {...form.register(`bankAccount.${bf.key}` as Path<FormValues>)}
                    />
                    {bankErrors?.[bf.key]?.message && (
                      <p className="text-xs text-danger">{bankErrors[bf.key]?.message}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="default" disabled={assignMutation.isPending}>
              {assignMutation.isPending && (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              )}
              {isEdit ? 'Update' : 'Assign'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
