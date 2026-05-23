import { apiClient } from '@/lib/api-client';
import type {
  Department,
  DepartmentCreateInput,
  DepartmentDeleteResult,
  DepartmentUpdateInput,
} from '../types/department.types';

export const departmentsApi = {
  /**
   * GET /departments
   * Returns flat array of root departments; each node has children[] pre-built by the server.
   * Do NOT reconstruct the tree client-side from parentId — render what the server returns.
   */
  list: async (): Promise<Department[]> => {
    const { data } = await apiClient.get<{ data: Department[] }>('/departments');
    return data.data;
  },

  /**
   * POST /departments → 201
   * Do NOT send a budget field — it does not exist in the schema.
   */
  create: async (input: DepartmentCreateInput): Promise<Department> => {
    const { data } = await apiClient.post<{ data: Department }>('/departments', input);
    return data.data;
  },

  /**
   * PATCH /departments/:id → 200
   */
  update: async ({ id, ...body }: { id: string } & DepartmentUpdateInput): Promise<Department> => {
    const { data } = await apiClient.patch<{ data: Department }>(`/departments/${id}`, body);
    return data.data;
  },

  /**
   * DELETE /departments/:id → 200
   * Fails with DEPARTMENT_NOT_EMPTY (409) if dept has employees or sub-departments.
   */
  remove: async (id: string): Promise<DepartmentDeleteResult> => {
    const { data } = await apiClient.delete<{ data: DepartmentDeleteResult }>(`/departments/${id}`);
    return data.data;
  },
};
