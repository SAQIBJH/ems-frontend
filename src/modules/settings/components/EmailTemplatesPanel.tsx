'use client';

import { useState } from 'react';
import { PencilIcon, MailIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ApiError } from '@/types/api';

import { useEmailTemplates } from '../hooks/useSettings';
import { useUpdateEmailTemplate } from '../hooks/useSettingsMutations';
import { emailTemplateSchema, type EmailTemplateFormValues } from '../validations/settings.schema';
import { EMAIL_TEMPLATE_LABELS } from '../constants';
import type { EmailTemplate, EmailTemplateType } from '../types/settings.types';

function EmailTemplatesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-subtle p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

interface EditDialogProps {
  template: EmailTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditTemplateDialog({ template, open, onOpenChange }: EditDialogProps) {
  const mutation = useUpdateEmailTemplate();
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: { subject: template.subject, body: template.body },
  });

  function onSubmit(values: EmailTemplateFormValues) {
    mutation.mutate(
      { type: template.type as EmailTemplateType, input: values },
      {
        onSuccess: () => {
          toast.success('Email template saved');
          onOpenChange(false);
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save template');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {EMAIL_TEMPLATE_LABELS[template.type] ?? template.type}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...form.register('subject')} placeholder="Email subject line" />
            {form.formState.errors.subject && (
              <p className="text-xs text-danger">{form.formState.errors.subject.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              {...form.register('body')}
              rows={8}
              placeholder="Email body content"
              className="font-mono text-xs"
            />
            {form.formState.errors.body && (
              <p className="text-xs text-danger">{form.formState.errors.body.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EmailTemplatesPanel() {
  const { data: templates, isLoading, isError, refetch } = useEmailTemplates();
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null);

  if (isError) {
    return <ErrorState message="Failed to load email templates." onRetry={() => void refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MailIcon className="size-4 text-fg-subtle" />
            <h2 className="text-sm font-semibold text-fg">Email Templates</h2>
          </div>
          <p className="text-sm text-fg-muted">Customise notification emails sent to employees.</p>
        </div>
        <EmailTemplatesSkeleton />
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <EmptyState
        title="No email templates"
        description="No email templates have been configured for this organisation."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MailIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Email Templates</h2>
        </div>
        <p className="text-sm text-fg-muted">Customise notification emails sent to employees.</p>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border border-subtle bg-surface p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-fg">
                {EMAIL_TEMPLATE_LABELS[template.type] ?? template.type}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setEditTarget(template)}
              >
                <PencilIcon className="size-3.5 mr-1.5" />
                Edit
              </Button>
            </div>
            <p className="text-xs text-fg-muted truncate">Subject: {template.subject}</p>
          </div>
        ))}
      </div>

      {editTarget && (
        <EditTemplateDialog
          key={editTarget.id}
          template={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
