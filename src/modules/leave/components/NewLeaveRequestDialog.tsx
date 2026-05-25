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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ApiError } from '@/types/api';

import { useLeaveTypes } from '../hooks/useLeave';
import { useCreateLeaveRequest } from '../hooks/useLeaveMutations';
import { createLeaveSchema, type CreateLeaveFormValues } from '../validations/leave.schema';

interface NewLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewLeaveRequestDialog({ open, onOpenChange }: NewLeaveRequestDialogProps) {
  const { data: leaveTypes = [] } = useLeaveTypes();
  const mutation = useCreateLeaveRequest();

  const form = useForm<CreateLeaveFormValues>({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  function onSubmit(values: CreateLeaveFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Leave request submitted');
        onOpenChange(false);
        form.reset();
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<ApiError>;
        const details = axiosErr.response?.data?.error?.details;
        if (details && Array.isArray(details)) {
          details.forEach(({ field, message }) => {
            form.setError(field as keyof CreateLeaveFormValues, { message });
          });
        } else {
          const code = axiosErr.response?.data?.error?.code;
          const message = axiosErr.response?.data?.error?.message;
          if (code === 'NO_LEAVE_BALANCE') {
            toast.error('No leave balance available for this type');
          } else if (code === 'OVERLAPPING_LEAVE') {
            toast.error('You already have a leave request for these dates');
          } else if (code === 'INSUFFICIENT_BALANCE') {
            toast.error('Insufficient leave balance for the requested days');
          } else {
            toast.error(message ?? 'Failed to submit leave request');
          }
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
          <DialogDescription>
            Submit a leave request for your manager&apos;s approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type">
                          {(v) => {
                            const lt = leaveTypes.find((t) => t.id === v);
                            return lt ? `${lt.name}${lt.isPaid ? '' : ' (Unpaid)'}` : v;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                          {lt.isPaid ? '' : ' (Unpaid)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe the reason for your leave…"
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
