import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  CreateLeaveInput,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestsPage,
  LeaveListParams,
  LeaveType,
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
   * comment is optional.
   */
  approve: async ({ id, comment }: { id: string; comment?: string }): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<{ data: LeaveRequest }>(
      `/leave/requests/${id}/approve`,
      { comment },
    );
    return data.data;
  },

  /**
   * PATCH /leave/requests/:id/reject — MANAGER, HR_ADMIN
   * comment is required.
   */
  reject: async ({ id, comment }: { id: string; comment: string }): Promise<LeaveRequest> => {
    const { data } = await apiClient.patch<{ data: LeaveRequest }>(`/leave/requests/${id}/reject`, {
      comment,
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
};
