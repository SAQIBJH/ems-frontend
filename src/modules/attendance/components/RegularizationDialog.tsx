'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaperclipIcon, XIcon } from 'lucide-react';
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
import { attendanceApi } from '../services/attendance.api';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<RegularizationFormValues>({
    resolver: zodResolver(regularizationSchema),
    defaultValues: {
      attendanceDate: defaultDate ?? '',
      reason: '',
    },
  });

  // Re-sync defaultDate when dialog opens with a pre-filled date
  const currentDefault = form.getValues('attendanceDate');
  if (open && defaultDate && currentDefault !== defaultDate) {
    form.setValue('attendanceDate', defaultDate);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachedFile(file);
    // reset so re-selecting same file triggers onChange
    e.target.value = '';
  }

  function removeFile() {
    setAttachedFile(null);
  }

  async function onSubmit(values: RegularizationFormValues) {
    mutation.mutate(values, {
      onSuccess: async (record) => {
        // If a supporting document was attached, upload it now
        if (attachedFile) {
          setUploading(true);
          try {
            await attendanceApi.uploadRegularizationDocument(record.id, attachedFile);
          } catch {
            // Non-fatal: request was submitted; doc upload failed
            toast.warning(
              'Request submitted, but document upload failed. You can re-attach later.',
            );
            onOpenChange(false);
            form.reset();
            setAttachedFile(null);
            setUploading(false);
            return;
          }
          setUploading(false);
        }
        toast.success('Regularization request submitted');
        onOpenChange(false);
        form.reset();
        setAttachedFile(null);
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

  const isPending = mutation.isPending || uploading;

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

            {/* Supporting document (optional) */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-fg">Supporting document</p>
              {attachedFile ? (
                <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface-2 px-3 py-2">
                  <PaperclipIcon className="size-4 shrink-0 text-fg-muted" aria-hidden />
                  <span className="flex-1 truncate text-sm text-fg">{attachedFile.name}</span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-fg-muted hover:text-fg"
                    aria-label="Remove attachment"
                  >
                    <XIcon className="size-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className="size-3.5" aria-hidden />
                  Attach file (optional)
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
