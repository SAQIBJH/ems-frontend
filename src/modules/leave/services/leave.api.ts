import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  BulkLeaveResponse,
  CreateLeaveInput,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestsPage,
  LeaveListParams,
  LeaveType,
  TeamCalendarData,
  TeamCoverageData,
} from '../types/leave.types';

export const leaveApi = {
  /**
   * GET /leave/types
   * Returns data[] — direct array.
   */
  getTypes: async (): Promise<LeaveType[]> => {
    const { data } = await apiClient.get<{ data: LeaveType[] }>('/leave/types');
    return data.data;
  },

  /**
   * GET /leave/balance
   * Returns data: { balances: [] }
   */
  getBalance: async (): Promise<LeaveBalance[]> => {
    const { data } = await apiClient.get<{ data: { balances: LeaveBalance[] } }>('/leave/balance');
    return data.data.balances;
  },

  /**
   * GET /leave/requests
   * Returns data: { requests: [], pagination: {} }
   */
  getRequests: async (params?: LeaveListParams): Promise<LeaveRequestsPage> => {
    const { data } = await apiClient.get<{ data: LeaveRequestsPage }>('/leave/requests', {
      params,
    });
    return data.data;
  },

  /**
   * GET /leave/team/requests — MANAGER, HR_ADMIN only.
   * Same envelope shape as getRequests.
   */
  getTeamRequests: async (params?: LeaveListParams): Promise<LeaveRequestsPage> => {
    const { data } = await apiClient.get<{ data: LeaveRequestsPage }>('/leave/team/requests', {
      params,
    });
    return data.data;
  },

  /**
   * POST /leave/requests → 201, data = LeaveRequest
   * Dates must be YYYY-MM-DD.
   */
  create: async (input: CreateLeaveInput): Promise<LeaveRequest> => {
    const body: CreateLeaveInput = {
      ...input,
      startDate: formatDateForApi(input.startDate),
      endDate: formatDateForApi(input.endDate),
    };
    const { data } = await apiClient.post<{ data: LeaveRequest }>('/leave/requests', body);
    return data.data;
  },

  /**
   * PATCH /leave/requests/:id/approve — MANAGER, HR_ADMIN
   * comment is optional. The live backend's body field is `approverComment` (NOT
   * `comment`); sending `comment` is silently dropped. Verified live 2026-06-10.
   */
  approve: async ({ id, comment }: { id: string; comment?: string }): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<{ data: LeaveRequest }>(
      `/leave/requests/${id}/approve`,
      { approverComment: comment },
    );
    return data.data;
  },

  /**
   * PATCH /leave/requests/:id/reject — MANAGER, HR_ADMIN
   * comment is required. The live backend's body field is `approverComment` (NOT
   * `comment`) — sending `comment` 400s every time (VALIDATION_ERROR: approverComment
   * required). Verified live 2026-06-10.
   */
  reject: async ({ id, comment }: { id: string; comment: string }): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<{ data: LeaveRequest }>(`/leave/requests/${id}/reject`, {
      approverComment: comment,
    });
    return data.data;
  },

  /**
   * GET /leave/team/calendar?month=YYYY-MM — MANAGER, HR_ADMIN
   * Returns { month, employees: [{ id, name, employeeCode, leaves: [...] }] }
   * Live endpoint — shape deviation: employees[].leaves[] (range objects), not per-day grid.
   */
  getTeamCalendar: async (month: string): Promise<TeamCalendarData> => {
    const { data } = await apiClient.get<{ data: TeamCalendarData }>('/leave/team/calendar', {
      params: { month },
    });
    return data.data;
  },

  /**
   * PATCH /leave/requests/:id/withdraw — own PENDING requests only
   */
  withdraw: async (id: string): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<{ data: LeaveRequest }>(
      `/leave/requests/${id}/withdraw`,
    );
    return data.data;
  },

  /**
   * POST /leave/requests/bulk/approve — MANAGER, HR_ADMIN
   * Returns { succeeded: string[], failed: { id, code, message }[] }
   */
  bulkApprove: async ({
    ids,
    comment,
  }: {
    ids: string[];
    comment?: string;
  }): Promise<BulkLeaveResponse> => {
    const { data } = await apiClient.post<{ data: BulkLeaveResponse }>(
      '/leave/requests/bulk/approve',
      { ids, comment },
    );
    return data.data;
  },

  /**
   * POST /leave/requests/bulk/reject — MANAGER, HR_ADMIN
   * Same shape as bulkApprove.
   */
  bulkReject: async ({
    ids,
    comment,
  }: {
    ids: string[];
    comment?: string;
  }): Promise<BulkLeaveResponse> => {
    const { data } = await apiClient.post<{ data: BulkLeaveResponse }>(
      '/leave/requests/bulk/reject',
      { ids, comment },
    );
    return data.data;
  },

  /**
   * GET /leave/team/coverage?date=YYYY-MM-DD — MANAGER, HR_ADMIN, SUPER_ADMIN
   */
  getTeamCoverage: async (date: string, departmentId?: string): Promise<TeamCoverageData> => {
    const { data } = await apiClient.get<{ data: TeamCoverageData }>('/leave/team/coverage', {
      params: { date, ...(departmentId ? { departmentId } : {}) },
    });
    return data.data;
  },
};
