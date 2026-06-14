'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { ApiError } from '@/types/api';

import { useTasks, useCreateTask, useUpdateTask } from '../hooks/useProjects';

interface ProjectTasksSectionProps {
  projectId: string;
  /** Whether the project itself is billable — new tasks default to this. */
  projectBillable: boolean;
}

/**
 * Tasks CRUD for an existing project (Step TS-A / design M1). Tasks are OPTIONAL — a
 * project with zero tasks is still loggable against directly (the timer/entry treat
 * task as optional). This panel only lets `timesheets:admin` shape the task list.
 */
export function ProjectTasksSection({ projectId, projectBillable }: ProjectTasksSectionProps) {
  const { data: tasks, isLoading, isError, refetch } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [name, setName] = useState('');

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Enter a task name');
      return;
    }
    createTask.mutate(
      { projectId, input: { name: trimmed, billable: projectBillable, active: true } },
      {
        onSuccess: () => setName(''),
        onError: (err: unknown) => {
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          toast.error(apiErr?.message ?? 'Failed to add task');
        },
      },
    );
  }

  function toggleActive(id: string, active: boolean) {
    updateTask.mutate(
      { id, projectId, input: { active } },
      {
        onError: (err: unknown) => {
          const apiErr = (err as AxiosError<ApiError>).response?.data?.error;
          toast.error(apiErr?.message ?? 'Failed to update task');
        },
      },
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>Tasks</Label>
      <p className="text-xs text-fg-muted">
        Optional. Break the project into tasks employees can log against. Projects with no tasks can
        still be logged against directly.
      </p>

      <div className="space-y-0.5 rounded-lg border border-subtle bg-surface p-1">
        {isLoading ? (
          <div className="space-y-1 p-1" aria-hidden>
            <div className="h-7 animate-pulse rounded-md bg-surface-raised" />
            <div className="h-7 w-3/4 animate-pulse rounded-md bg-surface-raised" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-between px-2 py-3">
            <p className="text-xs text-danger">Couldn’t load tasks.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <p className="px-2 py-3 text-xs text-fg-muted">
            No tasks yet. Add one below, or leave empty to log against the project directly.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-raised"
            >
              <span
                className={task.active ? 'text-sm text-fg' : 'text-sm text-fg-muted line-through'}
              >
                {task.name}
              </span>
              {task.billable && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  Billable
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] text-fg-muted">
                  {task.active ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={task.active}
                  onCheckedChange={(v) => toggleActive(task.id, v === true)}
                  aria-label={`${task.name} active`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="New task name"
          className="h-8 text-sm"
          aria-label="New task name"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={handleAdd}
          disabled={createTask.isPending}
        >
          <PlusIcon className="size-3.5" aria-hidden />
          {createTask.isPending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </div>
  );
}
