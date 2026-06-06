'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Switch } from '@/components/ui/switch';
import type { ApiError } from '@/types/api';

import { useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { projectSchema, type ProjectFormValues } from '../validations/project.schema';
import type { Project } from '../types/timesheet.types';

interface ProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Project | null;
}

export function ProjectDrawer({ open, onOpenChange, existing }: ProjectDrawerProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const pending = createProject.isPending || updateProject.isPending;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: existing?.name ?? '',
      code: existing?.code ?? '',
      clientName: existing?.clientName ?? '',
      billable: existing?.billable ?? true,
      defaultRate: existing?.defaultRate ? String(existing.defaultRate) : '0',
    },
  });

  const billable = useWatch({ control: form.control, name: 'billable' });

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: ProjectFormValues) {
    const input = {
      name: values.name,
      code: values.code,
      clientName: values.clientName,
      billable: values.billable,
      defaultRate: values.billable ? Number(values.defaultRate || '0') : 0,
    };
    const onError = (err: unknown) => {
      const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
      const status = (err as AxiosError).response?.status;
      if (status === 409) {
        form.setError('code', { message: 'A project with this code already exists.' });
        return;
      }
      if (status === 422 && Array.isArray(apiErr?.details)) {
        apiErr.details.forEach(({ field, message }) =>
          form.setError(field as keyof ProjectFormValues, { message }),
        );
        return;
      }
      toast.error(apiErr?.message ?? 'Failed to save project');
    };

    if (existing) {
      updateProject.mutate(
        { id: existing.id, input },
        {
          onSuccess: () => {
            toast.success('Project updated');
            handleClose();
          },
          onError,
        },
      );
    } else {
      createProject.mutate(input, {
        onSuccess: (p) => {
          toast.success(`Project ${p.code} created`);
          handleClose();
        },
        onError,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit project' : 'New project'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="prj-name">Project name</Label>
            <Input id="prj-name" placeholder="e.g. Acme Mobile App" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prj-code">Code</Label>
              <Input
                id="prj-code"
                placeholder="AMA"
                className="font-mono"
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-danger">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prj-client">Client</Label>
              <Input id="prj-client" placeholder="Acme Inc" {...form.register('clientName')} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface p-3">
            <div>
              <p className="text-sm font-medium text-fg">Billable</p>
              <p className="text-xs text-fg-muted">
                Hours on this project can be billed to a client.
              </p>
            </div>
            <Switch
              checked={billable}
              onCheckedChange={(v) => form.setValue('billable', v, { shouldValidate: true })}
              aria-label="Billable"
            />
          </div>

          {billable && (
            <div className="space-y-1.5">
              <Label htmlFor="prj-rate">Default rate (per hour)</Label>
              <Input
                id="prj-rate"
                type="number"
                min={0}
                step="0.01"
                {...form.register('defaultRate')}
              />
              {form.formState.errors.defaultRate && (
                <p className="text-xs text-danger">{form.formState.errors.defaultRate.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : existing ? 'Save' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
