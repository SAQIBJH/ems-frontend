import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  BulkDeactivateResult,
  BulkExportResult,
  EmployeeCreateInput,
  EmployeeDeleteResult,
  EmployeeDetail,
  EmployeeInviteResult,
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
   * `includeTerminated` lets HR_ADMIN/SUPER_ADMIN open a terminated (soft-deleted)
   * employee's profile (BE-3 fixed 2026-06-10; the backend ignores the flag for
   * other roles, so passing it is always safe). Without it, terminated → 404.
   */
  get: async (id: string, includeTerminated = false): Promise<EmployeeDetail> => {
    const { data } = await apiClient.get<{ data: EmployeeDetail }>(`/employees/${id}`, {
      params: includeTerminated ? { includeTerminated: true } : undefined,
    });
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

  /**
   * GET /employees/export/csv → triggers a file download.
   * Returns a Blob; caller must create an object URL and click a hidden anchor.
   */
  exportCsv: async (): Promise<Blob> => {
    const response = await apiClient.get('/employees/export/csv', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * POST /employees/bulk/deactivate → 200
   * Soft-deactivates multiple employees; returns per-id success/failure.
   */
  bulkDeactivate: async (ids: string[]): Promise<BulkDeactivateResult> => {
    const { data } = await apiClient.post<{ data: BulkDeactivateResult }>(
      '/employees/bulk/deactivate',
      { ids },
    );
    return data.data;
  },

  /**
   * POST /employees/bulk/export → 200
   * Enqueues a bulk CSV export job; returns the job ID.
   */
  bulkExport: async (ids: string[]): Promise<BulkExportResult> => {
    const { data } = await apiClient.post<{ data: BulkExportResult }>('/employees/bulk/export', {
      ids,
      format: 'csv',
    });
    return data.data;
  },

  /**
   * GET /employees/next-code → { nextCode: "EMP-0081" }
   * Live endpoint — shape deviation: field is "nextCode", not "code".
   */
  getNextCode: async (): Promise<string> => {
    const { data } = await apiClient.get<{ data: { code: string } }>('/employees/next-code');
    return data.data.code;
  },

  /**
   * POST /employees/:id/invite → 200
   * Send/resend the account-activation invite. Invalidates prior unused tokens.
   * `emailTarget` omitted → backend uses the tenant `invite_email_target` setting.
   */
  invite: async ({
    id,
    emailTarget,
  }: {
    id: string;
    emailTarget?: 'PERSONAL' | 'WORK';
  }): Promise<EmployeeInviteResult> => {
    const { data } = await apiClient.post<{ data: EmployeeInviteResult }>(
      `/employees/${id}/invite`,
      emailTarget ? { emailTarget } : {},
    );
    return data.data;
  },
};
