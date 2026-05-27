'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAdjustPayslip } from '@/modules/payroll';

const schema = z.object({
  type: z.enum(['addition', 'deduction']),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
});

type FormValues = z.infer<typeof schema>;

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  payslipId: string;
  employeeName: string;
}

export function AdjustmentDialog({
  open,
  onOpenChange,
  runId,
  payslipId,
  employeeName,
}: AdjustmentDialogProps) {
  const adjustMutation = useAdjustPayslip();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'addition', description: '', amount: undefined },
  });

  const adjType = watch('type');

  async function onSubmit(values: FormValues) {
    try {
      await adjustMutation.mutateAsync({
        runId,
        payslipId,
        body: {
          oneTimeAdditions:
            values.type === 'addition'
              ? [{ description: values.description, amount: values.amount }]
              : [],
          oneTimeDeductions:
            values.type === 'deduction'
              ? [{ description: values.description, amount: values.amount }]
              : [],
        },
      });
      toast.success('Adjustment added');
      reset();
      onOpenChange(false);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to add adjustment');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Adjustment — {employeeName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              {(['addition', 'deduction'] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value={t}
                    checked={adjType === t}
                    onChange={() => setValue('type', t)}
                    className="accent-brand"
                  />
                  <span className="text-sm capitalize text-fg">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-desc">Description</Label>
            <Input
              id="adj-desc"
              {...register('description')}
              placeholder="e.g. Performance Bonus Q1"
            />
            {errors.description && (
              <p className="text-xs text-danger">{errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="adj-amount">Amount</Label>
            <Input
              id="adj-amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={adjustMutation.isPending}>
              {adjustMutation.isPending && (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              )}
              Add {adjType === 'addition' ? 'Addition' : 'Deduction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
