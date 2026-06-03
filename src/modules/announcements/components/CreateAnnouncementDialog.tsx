'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAnnouncement } from '../hooks/useAnnouncements';
import {
  createAnnouncementSchema,
  type CreateAnnouncementFormValues,
} from '../validations/create-announcement.schema';
import { ANNOUNCEMENT_CATEGORIES, AUDIENCE_OPTIONS } from '../constants';
import type { AnnouncementCategory } from '../types/announcements.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAnnouncementDialog({ open, onOpenChange }: Props) {
  const create = useCreateAnnouncement();

  const form = useForm<CreateAnnouncementFormValues>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      title: '',
      body: '',
      category: 'Company' as const,
      audience: 'All employees',
      isPinned: false,
    },
  });

  const watchedCategory = useWatch({ control: form.control, name: 'category' });
  const watchedAudience = useWatch({ control: form.control, name: 'audience' });

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: CreateAnnouncementFormValues) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Announcement posted');
        handleClose();
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<ApiError>;
        const status = axiosErr.response?.status;
        const apiError = axiosErr.response?.data?.error;

        if (status === 422 && Array.isArray(apiError?.details)) {
          apiError.details.forEach(({ field, message }: { field: string; message: string }) => {
            form.setError(field as keyof CreateAnnouncementFormValues, { message });
          });
          return;
        }
        if (status === 403) {
          toast.error("You don't have permission to create announcements");
          return;
        }
        toast.error(apiError?.message ?? 'Failed to post announcement');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              placeholder="e.g. Q3 All-Hands — Friday 4 PM"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              placeholder="Share what's happening…"
              rows={4}
              className="resize-none"
              {...form.register('body')}
            />
            {form.formState.errors.body && (
              <p className="text-xs text-danger">{form.formState.errors.body.message}</p>
            )}
          </div>

          {/* Category + Audience row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={watchedCategory}
                onValueChange={(v) =>
                  form.setValue('category', (v ?? 'Company') as AnnouncementCategory, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-xs text-danger">{form.formState.errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select
                value={watchedAudience}
                onValueChange={(v) =>
                  form.setValue('audience', v ?? 'All employees', { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.audience && (
                <p className="text-xs text-danger">{form.formState.errors.audience.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Posting…' : 'Post announcement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
