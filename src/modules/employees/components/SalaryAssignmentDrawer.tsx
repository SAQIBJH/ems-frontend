'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { usePayGroups, useAssignSalary } from '@/modules/payroll';
import type { EmployeeSalary } from '@/modules/payroll';

/* ── schema ───────────────────────────────────────────────────────────────── */

const salaryAssignmentSchema = z.object({
  payGroupId: z.string().min(1, 'Pay group is required'),
  annualCtc: z.number().min(1, 'CTC must be greater than 0'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  bankAccountName: z.string(),
  bankAccountNumber: z.string(),
  bankIfscCode: z.string(),
  bankName: z.string(),
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
  const assignMutation = useAssignSalary();

  const form = useForm<FormValues>({
    resolver: zodResolver(salaryAssignmentSchema),
    defaultValues: {
      payGroupId: '',
      annualCtc: 0,
      effectiveFrom: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankName: '',
    },
  });

  /* Populate form when editing */
  useEffect(() => {
    if (open && existing) {
      form.reset({
        payGroupId: existing.payGroupId,
        annualCtc: existing.annualCtc,
        effectiveFrom: existing.effectiveFrom,
        bankAccountName: existing.bankAccountName ?? '',
        bankAccountNumber: existing.bankAccountNumber ?? '',
        bankIfscCode: existing.bankIfscCode ?? '',
        bankName: existing.bankName ?? '',
      });
    } else if (open && !existing) {
      form.reset({
        payGroupId: payGroups[0]?.id ?? '',
        annualCtc: 0,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        bankName: '',
      });
    }
  }, [open, existing, payGroups, form]);

  async function onSubmit(values: FormValues) {
    try {
      await assignMutation.mutateAsync({ employeeId, input: values });
      toast.success(isEdit ? 'Salary updated' : 'Salary assigned');
      onOpenChange(false);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to save salary configuration');
    }
  }

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
            <select
              id="sal-paygroup"
              {...form.register('payGroupId')}
              className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
              disabled={groupsLoading}
            >
              <option value="">Select pay group…</option>
              {payGroups
                .filter((g) => g.active)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.currency})
                  </option>
                ))}
            </select>
            {form.formState.errors.payGroupId && (
              <p className="text-xs text-danger">{form.formState.errors.payGroupId.message}</p>
            )}
          </div>

          {/* Annual CTC */}
          <div className="space-y-1.5">
            <Label htmlFor="sal-ctc">Annual CTC *</Label>
            <Input
              id="sal-ctc"
              type="number"
              min={1}
              step={1000}
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

          {/* Bank details section */}
          <div className="rounded-lg border border-subtle p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Bank Details (optional)
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="sal-bank-name">Account Holder Name</Label>
              <Input
                id="sal-bank-name"
                placeholder="e.g. Priya Sharma"
                {...form.register('bankAccountName')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sal-bank-acct">Account Number</Label>
              <Input
                id="sal-bank-acct"
                placeholder="e.g. 1234567890"
                {...form.register('bankAccountNumber')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sal-bank">Bank Name</Label>
                <Input id="sal-bank" placeholder="e.g. HDFC Bank" {...form.register('bankName')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sal-ifsc">IFSC Code</Label>
                <Input
                  id="sal-ifsc"
                  placeholder="e.g. HDFC0001234"
                  {...form.register('bankIfscCode')}
                />
              </div>
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
