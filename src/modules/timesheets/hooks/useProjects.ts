import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../services/projects.api';
import type { ProjectInput, TaskInput } from '../types/timesheet.types';

export const TIMESHEET_KEYS = {
  projects: ['timesheets', 'projects'] as const,
  tasks: (projectId: string) => ['timesheets', 'tasks', projectId] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: TIMESHEET_KEYS.projects,
    queryFn: () => projectsApi.listProjects(),
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
