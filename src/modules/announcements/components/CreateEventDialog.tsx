'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
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
import { useCreateEvent } from '../hooks/useAnnouncements';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required').max(120),
  meta: z.string().min(1, 'Time / location is required').max(120),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({ open, onOpenChange }: Props) {
  const createEvent = useCreateEvent();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: '', title: '', meta: '' },
  });

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: FormValues) {
    createEvent.mutate(values, {
      onSuccess: () => {
        toast.success('Event added');
        handleClose();
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<ApiError>;
        const status = axiosErr.response?.status;
        const apiError = axiosErr.response?.data?.error;

        if (status === 422 && Array.isArray(apiError?.details)) {
          apiError.details.forEach(({ field, message }: { field: string; message: string }) => {
            form.setError(field as keyof FormValues, { message });
          });
          return;
        }
        toast.error(apiError?.message ?? 'Failed to add event');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add upcoming event</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="ev-date">Date</Label>
            <Input
              id="ev-date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...form.register('date')}
            />
            {form.formState.errors.date && (
              <p className="text-xs text-danger">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Event title</Label>
            <Input id="ev-title" placeholder="e.g. Q3 All-Hands" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-meta">Time / location</Label>
            <Input
              id="ev-meta"
              placeholder="e.g. 4:00 PM · Main hall + Zoom"
              {...form.register('meta')}
            />
            {form.formState.errors.meta && (
              <p className="text-xs text-danger">{form.formState.errors.meta.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? 'Adding…' : 'Add event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
