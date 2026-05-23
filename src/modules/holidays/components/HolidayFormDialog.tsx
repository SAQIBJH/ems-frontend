'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { ApiError } from '@/types/api';

import { useCreateHoliday, useUpdateHoliday } from '../hooks/useHolidayMutations';
import { holidayFormSchema, type HolidayFormValues } from '../validations/holiday.schema';
import type { Holiday } from '../types/holiday.types';

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  /** When provided the dialog is in edit mode */
  holiday?: Holiday;
}

export function HolidayFormDialog({ open, onOpenChange, year, holiday }: HolidayFormDialogProps) {
  const isEdit = !!holiday;
  const createMutation = useCreateHoliday(year);
  const updateMutation = useUpdateHoliday(year);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: '',
      holidayDate: '',
      location: '',
      isOptional: false,
    },
  });

  // Populate form when switching to edit mode
  useEffect(() => {
    if (holiday) {
      form.reset({
        name: holiday.name,
        holidayDate: format(parseISO(holiday.holidayDate), 'yyyy-MM-dd'),
        location: holiday.location ?? '',
        isOptional: holiday.isOptional,
      });
    } else {
      form.reset({ name: '', holidayDate: '', location: '', isOptional: false });
    }
  }, [holiday, form]);

  function onSubmit(values: HolidayFormValues) {
    const payload = {
      name: values.name,
      holidayDate: values.holidayDate,
      isOptional: values.isOptional,
      ...(values.location ? { location: values.location } : {}),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: holiday.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Holiday updated');
            onOpenChange(false);
          },
          onError: handleError,
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Holiday created');
          onOpenChange(false);
          form.reset();
        },
        onError: handleError,
      });
    }
  }

  function handleError(err: unknown) {
    const axiosErr = err as AxiosError<ApiError>;
    const details = axiosErr.response?.data?.error?.details;
    if (details && Array.isArray(details)) {
      details.forEach(({ field, message }) => {
        form.setError(field as keyof HolidayFormValues, { message });
      });
    } else {
      toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save holiday');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the holiday details.' : `Add a new holiday for ${year}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Independence Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="holidayDate"
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Location <span className="text-xs font-normal text-fg-subtle">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOptional"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isOptional"
                    />
                  </FormControl>
                  <FormLabel htmlFor="isOptional" className="cursor-pointer font-normal">
                    Optional holiday
                  </FormLabel>
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
                {mutation.isPending
                  ? isEdit
                    ? 'Saving…'
                    : 'Adding…'
                  : isEdit
                    ? 'Save Changes'
                    : 'Add Holiday'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
