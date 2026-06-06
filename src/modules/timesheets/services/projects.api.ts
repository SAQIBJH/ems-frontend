import { apiClient } from '@/lib/api-client';
import type { Project, ProjectInput, Task, TaskInput } from '../types/timesheet.types';

export const projectsApi = {
  listProjects: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<{ data: Project[] }>('/timesheets/projects');
    return data.data;
  },

  createProject: async (input: ProjectInput): Promise<Project> => {
    const { data } = await apiClient.post<{ data: Project }>('/timesheets/projects', input);
    return data.data;
  },

  updateProject: async (id: string, input: Partial<ProjectInput>): Promise<Project> => {
    const { data } = await apiClient.patch<{ data: Project }>(`/timesheets/projects/${id}`, input);
    return data.data;
  },

  deleteProject: async (id: string): Promise<{ id: string; status: string }> => {
    const { data } = await apiClient.delete<{ data: { id: string; status: string } }>(
      `/timesheets/projects/${id}`,
    );
    return data.data;
  },

  listTasks: async (projectId: string): Promise<Task[]> => {
    const { data } = await apiClient.get<{ data: Task[] }>(
      `/timesheets/projects/${projectId}/tasks`,
    );
    return data.data;
  },

  createTask: async (projectId: string, input: TaskInput): Promise<Task> => {
    const { data } = await apiClient.post<{ data: Task }>(
      `/timesheets/projects/${projectId}/tasks`,
      input,
    );
    return data.data;
  },

  updateTask: async (id: string, input: Partial<TaskInput>): Promise<Task> => {
    const { data } = await apiClient.patch<{ data: Task }>(`/timesheets/tasks/${id}`, input);
    return data.data;
  },
};
