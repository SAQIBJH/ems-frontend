'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SearchIcon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useEmployees } from '@/modules/employees';
import { useDebounce } from '@/hooks/useDebounce';
import type { ApiError } from '@/types/api';

import { useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { projectSchema, type ProjectFormValues } from '../validations/project.schema';
import type { Project } from '../types/timesheet.types';
import { ProjectTasksSection } from './ProjectTasksSection';

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
      memberIds: existing?.memberIds ?? [],
    },
  });

  const billable = useWatch({ control: form.control, name: 'billable' });
  const memberIds = useWatch({ control: form.control, name: 'memberIds' }) ?? [];

  const [memberSearch, setMemberSearch] = useState('');
  const debouncedSearch = useDebounce(memberSearch, 300);
  const { data: employeesPage, isLoading: employeesLoading } = useEmployees({
    limit: 100,
    search: debouncedSearch.trim() || undefined,
  });
  const employees = employeesPage?.data ?? [];

  function toggleMember(id: string, checked: boolean) {
    const current = form.getValues('memberIds');
    form.setValue('memberIds', checked ? [...current, id] : current.filter((m) => m !== id), {
      shouldDirty: true,
    });
  }

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
      memberIds: values.memberIds,
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
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
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

          {/* Tasks — optional breakdown (design M1). Only on an existing project, since
              a task needs a saved projectId; on create we show a hint instead. */}
          {existing ? (
            <ProjectTasksSection projectId={existing.id} projectBillable={billable} />
          ) : (
            <div className="space-y-1.5">
              <Label>Tasks</Label>
              <p className="rounded-lg border border-dashed border-subtle bg-surface px-3 py-2.5 text-xs text-fg-muted">
                Save the project first, then reopen it to add tasks. Tasks are optional — employees
                can log against the project directly.
              </p>
            </div>
          )}

          {/* Members — who can log time. Empty = everyone (Step T3.1). */}
          <div className="space-y-1.5">
            <Label>Members</Label>
            <p className="text-xs text-fg-muted">
              {memberIds.length === 0
                ? 'Open to everyone. Select employees to restrict who can log time.'
                : `${memberIds.length} member${memberIds.length === 1 ? '' : 's'} can log time on this project.`}
            </p>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted"
                aria-hidden
              />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search employees…"
                className="h-8 pl-8 text-sm"
                aria-label="Search employees"
              />
            </div>
            <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-subtle bg-surface p-1">
              {employeesLoading ? (
                <p className="px-2 py-3 text-xs text-fg-muted">Loading employees…</p>
              ) : employees.length === 0 ? (
                <p className="px-2 py-3 text-xs text-fg-muted">
                  {debouncedSearch.trim()
                    ? `No employees match “${debouncedSearch.trim()}”.`
                    : 'No employees found.'}
                </p>
              ) : (
                employees.map((emp) => {
                  const checked = memberIds.includes(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-raised"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleMember(emp.id, v === true)}
                        aria-label={`${emp.firstName} ${emp.lastName}`}
                      />
                      <span className="text-sm text-fg">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="ml-auto font-mono text-xs text-fg-muted">
                        {emp.employeeCode}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

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
