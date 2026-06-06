'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ApiError } from '@/types/api';

import { useMyProjects, useTasks } from '../hooks/useProjects';
import { useUpsertTimeEntry } from '../hooks/useTimesheets';
import { timeEntrySchema, type TimeEntryFormValues } from '../validations/timeEntry.schema';
import type { TimeEntry } from '../types/timesheet.types';

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Monday of the week being edited. */
  week: string;
  employeeId?: string;
  /** The 7 day strings (Mon→Sun) selectable for this week. */
  weekDays: string[];
  /** When editing an existing cell. */
  existing?: TimeEntry | null;
  /** Prefill for a fresh entry (e.g. the clicked cell's project/task/date). */
  prefill?: { projectId?: string; taskId?: string; date?: string };
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  week,
  employeeId,
  weekDays,
  existing,
  prefill,
}: TimeEntryDialogProps) {
  const { data: projects = [] } = useMyProjects(employeeId);
  const upsert = useUpsertTimeEntry(week, employeeId);

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      projectId: existing?.projectId ?? prefill?.projectId ?? '',
      taskId: existing?.taskId ?? prefill?.taskId ?? '',
      date: existing?.date ?? prefill?.date ?? weekDays[0] ?? '',
      hours: existing ? String(existing.hours) : '',
      billable: existing?.billable ?? true,
      note: existing?.note ?? '',
    },
  });

  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const taskId = useWatch({ control: form.control, name: 'taskId' });
  const date = useWatch({ control: form.control, name: 'date' });
  const billable = useWatch({ control: form.control, name: 'billable' });
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(projectId || null);

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const activeTasks = tasks.filter((t) => t.active);

  // When the project changes (new entry), default billable from the project and
  // clear a task that no longer belongs to the selected project.
  useEffect(() => {
    if (!projectId) return;
    const current = form.getValues('taskId');
    if (current && !tasks.some((t) => t.id === current)) {
      form.setValue('taskId', '');
    }
    if (!existing) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) form.setValue('billable', proj.billable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, tasks]);

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: TimeEntryFormValues) {
    upsert.mutate(
      {
        id: existing?.id,
        input: {
          weekStart: week,
          projectId: values.projectId,
          taskId: values.taskId,
          date: values.date,
          hours: Number(values.hours),
          billable: values.billable,
          note: values.note,
        },
      },
      {
        onSuccess: () => {
          toast.success(existing ? 'Entry updated' : 'Time logged');
          handleClose();
        },
        onError: (err: unknown) => {
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          const status = (err as AxiosError).response?.status;
          if (status === 422 && Array.isArray(apiErr?.details)) {
            apiErr.details.forEach(({ field, message }) =>
              form.setError(field as keyof TimeEntryFormValues, { message }),
            );
            return;
          }
          toast.error(apiErr?.message ?? 'Failed to save entry');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit time entry' : 'Log time'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="te-project">Project</Label>
            <Select
              value={projectId}
              onValueChange={(v) => form.setValue('projectId', v ?? '', { shouldValidate: true })}
            >
              <SelectTrigger id="te-project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    <span className="ml-1.5 font-mono text-xs text-fg-muted">{p.code}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.projectId && (
              <p className="text-xs text-danger">{form.formState.errors.projectId.message}</p>
            )}
          </div>

          {/* Task */}
          <div className="space-y-1.5">
            <Label htmlFor="te-task">Task</Label>
            <Select
              value={taskId}
              onValueChange={(v) => form.setValue('taskId', v ?? '', { shouldValidate: true })}
              disabled={!projectId || tasksLoading}
            >
              <SelectTrigger id="te-task">
                <SelectValue
                  placeholder={
                    !projectId
                      ? 'Select a project first'
                      : tasksLoading
                        ? 'Loading tasks…'
                        : 'Select a task'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {activeTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.taskId && (
              <p className="text-xs text-danger">{form.formState.errors.taskId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Day */}
            <div className="space-y-1.5">
              <Label htmlFor="te-date">Day</Label>
              <Select
                value={date}
                onValueChange={(v) => form.setValue('date', v ?? '', { shouldValidate: true })}
              >
                <SelectTrigger id="te-date">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((d) => (
                    <SelectItem key={d} value={d}>
                      {format(parseISO(d), 'EEE, MMM d')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.date && (
                <p className="text-xs text-danger">{form.formState.errors.date.message}</p>
              )}
            </div>

            {/* Hours */}
            <div className="space-y-1.5">
              <Label htmlFor="te-hours">Hours</Label>
              <Input
                id="te-hours"
                type="number"
                min={0}
                max={24}
                step="0.25"
                placeholder="7.5"
                {...form.register('hours')}
              />
              {form.formState.errors.hours && (
                <p className="text-xs text-danger">{form.formState.errors.hours.message}</p>
              )}
            </div>
          </div>

          {/* Billable */}
          <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface p-3">
            <div>
              <p className="text-sm font-medium text-fg">Billable</p>
              <p className="text-xs text-fg-muted">Count these hours toward client billing.</p>
            </div>
            <Switch
              checked={billable}
              onCheckedChange={(v) => form.setValue('billable', v, { shouldValidate: true })}
              aria-label="Billable"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="te-note">Note (optional)</Label>
            <Input id="te-note" placeholder="What did you work on?" {...form.register('note')} />
            {form.formState.errors.note && (
              <p className="text-xs text-danger">{form.formState.errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? 'Saving…' : existing ? 'Save' : 'Log time'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
