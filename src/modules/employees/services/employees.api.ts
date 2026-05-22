import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  EmployeeCreateInput,
  EmployeeDeleteResult,
  EmployeeDetail,
  EmployeeListParams,
  EmployeesPage,
  EmployeeUpdateInput,
} from '../types/employee.types';

export const employeesApi = {
  /**
   * GET /employees
   * Returns double-nested payload: { data: Employee[], pagination: {} }
   */
  list: async (params?: EmployeeListParams): Promise<EmployeesPage> => {
    const { data } = await apiClient.get<{ data: EmployeesPage }>('/employees', { params });
    return data.data;
  },

  /**
   * GET /employees/:id
   * Returns full employee with leaveBalances and documents.
   */
  get: async (id: string): Promise<EmployeeDetail> => {
    const { data } = await apiClient.get<{ data: EmployeeDetail }>(`/employees/${id}`);
    return data.data;
  },

  /**
   * POST /employees → 201
   * Dates must be YYYY-MM-DD — formatDateForApi normalises whatever string arrives.
   */
  create: async (input: EmployeeCreateInput): Promise<EmployeeDetail> => {
    const body: EmployeeCreateInput = {
      ...input,
      joinedOn: formatDateForApi(input.joinedOn),
      ...(input.dateOfBirth && { dateOfBirth: formatDateForApi(input.dateOfBirth) }),
    };
    const { data } = await apiClient.post<{ data: EmployeeDetail }>('/employees', body);
    return data.data;
  },

  /**
   * PATCH /employees/:id → 200
   */
  update: async ({
    id,
    ...body
  }: { id: string } & EmployeeUpdateInput): Promise<EmployeeDetail> => {
    const patch: EmployeeUpdateInput = {
      ...body,
      ...(body.joinedOn && { joinedOn: formatDateForApi(body.joinedOn) }),
      ...(body.dateOfBirth && { dateOfBirth: formatDateForApi(body.dateOfBirth) }),
    };
    const { data } = await apiClient.patch<{ data: EmployeeDetail }>(`/employees/${id}`, patch);
    return data.data;
  },

  /**
   * DELETE /employees/:id → 200
   * Soft-delete: sets employmentStatus = TERMINATED.
   */
  remove: async (id: string): Promise<EmployeeDeleteResult> => {
    const { data } = await apiClient.delete<{ data: EmployeeDeleteResult }>(`/employees/${id}`);
    return data.data;
  },
};
