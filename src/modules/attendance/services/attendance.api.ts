import { apiClient } from '@/lib/api-client';
import { formatDateForApi } from '@/lib/date';
import type {
  AttendanceRecord,
  AttendanceRecordsPage,
  AttendanceRecordsParams,
  AttendanceSummary,
  CheckInInput,
  CheckOutInput,
  RegularizationInput,
  RegularizationRecord,
} from '../types/attendance.types';

export const attendanceApi = {
  /**
   * GET /attendance/today
   * Returns today's attendance record or null if not checked in yet.
   */
  getToday: async (): Promise<AttendanceRecord | null> => {
    const { data } = await apiClient.get<{ data: AttendanceRecord | null }>('/attendance/today');
    return data.data;
  },

  /**
   * GET /attendance/records
   * Returns { records: [...], pagination: {} }
   */
  getRecords: async (params?: AttendanceRecordsParams): Promise<AttendanceRecordsPage> => {
    const { data } = await apiClient.get<{ data: AttendanceRecordsPage }>('/attendance/records', {
      params,
    });
    return data.data;
  },

  /**
   * GET /attendance/team/records — MANAGER, HR_ADMIN
   * Same envelope shape as getRecords: { records: [...], pagination: {} }
   */
  getTeamRecords: async (params?: AttendanceRecordsParams): Promise<AttendanceRecordsPage> => {
    const { data } = await apiClient.get<{ data: AttendanceRecordsPage }>(
      '/attendance/team/records',
      { params },
    );
    return data.data;
  },

  /**
   * GET /attendance/summary
   * Returns { period, totalDays, present, absent, leave, wfh, halfDay, holiday, late, attendancePercentage }
   */
  getSummary: async (): Promise<AttendanceSummary> => {
    const { data } = await apiClient.get<{ data: AttendanceSummary }>('/attendance/summary');
    return data.data;
  },

  /**
   * POST /attendance/check-in
   */
  checkIn: async (input: CheckInInput): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post<{ data: AttendanceRecord }>(
      '/attendance/check-in',
      input,
    );
    return data.data;
  },

  /**
   * POST /attendance/check-out
   */
  checkOut: async (input?: CheckOutInput): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post<{ data: AttendanceRecord }>(
      '/attendance/check-out',
      input ?? {},
    );
    return data.data;
  },

  /**
   * POST /attendance/regularization
   * attendanceDate must be YYYY-MM-DD
   */
  requestRegularization: async (input: RegularizationInput): Promise<RegularizationRecord> => {
    const body: RegularizationInput = {
      ...input,
      attendanceDate: formatDateForApi(input.attendanceDate),
    };
    const { data } = await apiClient.post<{ data: RegularizationRecord }>(
      '/attendance/regularization',
      body,
    );
    return data.data;
  },

  /**
   * GET /attendance/regularization — own requests
   */
  getRegularizations: async (): Promise<RegularizationRecord[]> => {
    const { data } = await apiClient.get<{ data: RegularizationRecord[] }>(
      '/attendance/regularization',
    );
    return data.data;
  },

  /**
   * PATCH /attendance/regularization/:id/approve — MANAGER, HR_ADMIN
   */
  approveRegularization: async ({
    id,
    comment,
  }: {
    id: string;
    comment?: string;
  }): Promise<RegularizationRecord> => {
    const { data } = await apiClient.patch<{ data: RegularizationRecord }>(
      `/attendance/regularization/${id}/approve`,
      { comment },
    );
    return data.data;
  },

  /**
   * PATCH /attendance/regularization/:id/deny — MANAGER, HR_ADMIN
   */
  denyRegularization: async ({
    id,
    comment,
  }: {
    id: string;
    comment?: string;
  }): Promise<RegularizationRecord> => {
    const { data } = await apiClient.patch<{ data: RegularizationRecord }>(
      `/attendance/regularization/${id}/deny`,
      { comment },
    );
    return data.data;
  },

  /**
   * POST /attendance/regularization/:id/documents
   * Uploads a supporting document (multipart/form-data) for a regularization request.
   * MSW-served — backend endpoint not yet live.
   */
  uploadRegularizationDocument: async (
    id: string,
    file: File,
  ): Promise<{ documentUrl: string }> => {
    const form = new FormData();
    form.append('document', file);
    const { data } = await apiClient.post<{ data: { documentUrl: string } }>(
      `/attendance/regularization/${id}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },
};
