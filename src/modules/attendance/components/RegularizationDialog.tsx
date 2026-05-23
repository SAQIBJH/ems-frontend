'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useRequestRegularization } from '../hooks/useAttendanceMutations';
import {
  regularizationSchema,
  type RegularizationFormValues,
} from '../validations/attendance.schema';

interface RegularizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}

export function RegularizationDialog({
  open,
  onOpenChange,
  defaultDate,
}: RegularizationDialogProps) {
  const mutation = useRequestRegularization();

  const form = useForm<RegularizationFormValues>({
    resolver: zodResolver(regularizationSchema),
    defaultValues: {
      attendanceDate: defaultDate ?? '',
      reason: '',
    },
  });

  function onSubmit(values: RegularizationFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Regularization request submitted');
        onOpenChange(false);
        form.reset();
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<{
          error: { message: string; details?: { field: string; message: string }[] };
        }>;
        const details = axiosErr.response?.data?.error?.details;
        if (details && Array.isArray(details)) {
          details.forEach(({ field, message }) => {
            form.setError(field as keyof RegularizationFormValues, { message });
          });
        } else {
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to submit request');
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Regularization</DialogTitle>
          <DialogDescription>
            Submit a request to correct your attendance for a specific date.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="attendanceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why your attendance needs correction…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
