import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../services/projects.api';
import type { ProjectInput, TaskInput } from '../types/timesheet.types';

export const TIMESHEET_KEYS = {
  projects: ['timesheets', 'projects'] as const,
  myProjects: (memberId?: string) =>
    ['timesheets', 'projects', 'member', memberId ?? 'self'] as const,
  tasks: (projectId: string) => ['timesheets', 'tasks', projectId] as const,
  week: (week: string, employeeId?: string) =>
    ['timesheets', 'week', week, employeeId ?? 'self'] as const,
  approvals: (status: string) => ['timesheets', 'approvals', status] as const,
};

/** The full project list (admin / management view — includes archived). */
export function useProjects() {
  return useQuery({
    queryKey: TIMESHEET_KEYS.projects,
    queryFn: () => projectsApi.listProjects(),
  });
}

/**
 * Projects the given employee may log time against (Step T3.1) — open projects plus
 * those they're a member of. Used by the Log-time picker and the weekly grid.
 */
export function useMyProjects(employeeId?: string) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.myProjects(employeeId),
    queryFn: () => projectsApi.listProjects(employeeId ?? 'self'),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.createProject(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.projects }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectInput> }) =>
      projectsApi.updateProject(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.projects }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.projects }),
  });
}

export function useTasks(projectId: string | null) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.tasks(projectId ?? ''),
    queryFn: () => projectsApi.listTasks(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: TaskInput }) =>
      projectsApi.createTask(projectId, input),
    onSuccess: (_data, { projectId }) =>
      void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.tasks(projectId) }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; projectId: string; input: Partial<TaskInput> }) =>
      projectsApi.updateTask(id, input),
    onSuccess: (_data, { projectId }) =>
      void qc.invalidateQueries({ queryKey: TIMESHEET_KEYS.tasks(projectId) }),
  });
}
