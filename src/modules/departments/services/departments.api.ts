import { apiClient } from '@/lib/api-client';
import type {
  AddMembersInput,
  AddMembersResult,
  Department,
  DepartmentCreateInput,
  DepartmentDeleteResult,
  DepartmentEmployeesResponse,
  DepartmentUpdateInput,
  ReassignAndDeleteResult,
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

  /**
   * GET /departments/:id/employees
   * Returns double-nested data.data[] + data.pagination.
   * Query params: page, limit, search.
   */
  getDepartmentEmployees: async (
    id: string,
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<DepartmentEmployeesResponse> => {
    const { data } = await apiClient.get<{ data: DepartmentEmployeesResponse }>(
      `/departments/${id}/employees`,
      { params },
    );
    return data.data;
  },

  /**
   * POST /departments/:id/reassign-and-delete
   * Reassigns all active employees to target dept, then soft-deletes source dept.
   */
  reassignAndDelete: async ({
    id,
    reassignEmployeesTo,
  }: {
    id: string;
    reassignEmployeesTo: string;
  }): Promise<ReassignAndDeleteResult> => {
    const { data } = await apiClient.post<{ data: ReassignAndDeleteResult }>(
      `/departments/${id}/reassign-and-delete`,
      { reassignEmployeesTo },
    );
    return data.data;
  },

  /**
   * POST /departments/:id/members → 200 (LIVE as of 2026-06-13)
   * Bulk-assigns existing employees to this department / sub-department.
   * Idempotent — already-members come back as `skipped`. Send only employee ids
   * (the server resolves the department path). `_count.employees` is inclusive.
   */
  addMembers: async ({
    id,
    employeeIds,
  }: { id: string } & AddMembersInput): Promise<AddMembersResult> => {
    const { data } = await apiClient.post<{ data: AddMembersResult }>(
      `/departments/${id}/members`,
      { employeeIds },
    );
    return data.data;
  },
};
