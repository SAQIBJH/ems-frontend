import { apiClient } from '@/lib/api-client';
import type {
  AttendanceRules,
  AttendanceRulesUpdateInput,
  AuditLogsParams,
  AuditLogsResponse,
  AuthSettings,
  AuthSettingsUpdateInput,
  BrandingSettings,
  EmailTemplate,
  EmailTemplatesData,
  EmailTemplateType,
  EmailTemplateUpdateInput,
  LeaveType,
  LeaveTypeCreateInput,
  LeaveTypeUpdateInput,
  NotificationPrefs,
  NotificationPrefsUpdateInput,
  TenantSettings,
  TenantSettingsUpdateInput,
} from '../types/settings.types';

export const settingsApi = {
  /**
   * GET /settings/tenant
   * Returns data: { company_name, timezone, working_hours_start, working_hours_end, fiscal_year_start }
   * All fields are snake_case — do not normalize.
   */
  getTenant: async (): Promise<TenantSettings> => {
    const { data } = await apiClient.get<{ data: TenantSettings }>('/settings/tenant');
    return data.data;
  },

  /**
   * PATCH /settings/tenant — HR_ADMIN, SUPER_ADMIN only.
   * Body must be snake_case. Only these 4 fields are accepted.
   */
  updateTenant: async (input: TenantSettingsUpdateInput): Promise<TenantSettings> => {
    const { data } = await apiClient.patch<{ data: TenantSettings }>('/settings/tenant', input);
    return data.data;
  },

  /**
   * GET /settings/email-templates — HR_ADMIN, SUPER_ADMIN only.
   * Returns data: { templates: [] }
   */
  getEmailTemplates: async (): Promise<EmailTemplate[]> => {
    const { data } = await apiClient.get<{ data: EmailTemplatesData }>('/settings/email-templates');
    return data.data.templates;
  },

  /**
   * PATCH /settings/email-templates/:type — HR_ADMIN, SUPER_ADMIN only.
   * :type is the template type enum (e.g. LEAVE_APPROVAL).
   */
  updateEmailTemplate: async (
    type: EmailTemplateType,
    input: EmailTemplateUpdateInput,
  ): Promise<EmailTemplate> => {
    const { data } = await apiClient.patch<{ data: EmailTemplate }>(
      `/settings/email-templates/${type}`,
      input,
    );
    return data.data;
  },

  /**
   * GET /audit-logs — HR_ADMIN, SUPER_ADMIN only.
   * Returns data: { logs: [], pagination: {} } — shape is data.logs[], not data[].
   * All fields are snake_case (API_MAPPING.md §Audit Logs).
   */
  getAuditLogs: async (params: AuditLogsParams = {}): Promise<AuditLogsResponse> => {
    const { data } = await apiClient.get<{ data: AuditLogsResponse }>('/audit-logs', { params });
    return data.data;
  },

  /**
   * GET /settings/branding — any admin.
   * Returns data: { logo_url, primary_color_hex } — snake_case.
   */
  getBranding: async (): Promise<BrandingSettings> => {
    const { data } = await apiClient.get<{ data: BrandingSettings }>('/settings/branding');
    return data.data;
  },

  /**
   * PATCH /settings/branding — HR_ADMIN, SUPER_ADMIN.
   * Accepts FormData (with `logo` file field) or JSON { primary_color_hex, logo_url }.
   */
  updateBranding: async (
    input: FormData | { primary_color_hex?: string; logo_url?: string },
  ): Promise<BrandingSettings> => {
    const isFormData = input instanceof FormData;
    const { data } = await apiClient.patch<{ data: BrandingSettings }>(
      '/settings/branding',
      input,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    );
    return data.data;
  },

  /**
   * GET /leave/types — all authenticated.
   * Returns data: LeaveType[] — camelCase.
   */
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const { data } = await apiClient.get<{ data: LeaveType[] }>('/leave/types');
    return data.data;
  },

  /**
   * POST /leave/types — HR_ADMIN, SUPER_ADMIN.
   * Errors: DUPLICATE_LEAVE_TYPE_CODE (409).
   */
  createLeaveType: async (input: LeaveTypeCreateInput): Promise<LeaveType> => {
    const { data } = await apiClient.post<{ data: LeaveType }>('/leave/types', input);
    return data.data;
  },

  /**
   * PATCH /leave/types/:id — HR_ADMIN, SUPER_ADMIN.
   */
  updateLeaveType: async (id: string, input: LeaveTypeUpdateInput): Promise<LeaveType> => {
    const { data } = await apiClient.patch<{ data: LeaveType }>(`/leave/types/${id}`, input);
    return data.data;
  },

  /**
   * DELETE /leave/types/:id — HR_ADMIN, SUPER_ADMIN.
   * Soft-deactivate: sets isActive=false. Error: LEAVE_TYPE_IN_USE (409).
   */
  deleteLeaveType: async (id: string): Promise<void> => {
    await apiClient.delete(`/leave/types/${id}`);
  },

  /**
   * GET /settings/attendance-rules — HR_ADMIN, SUPER_ADMIN.
   * Returns data: AttendanceRules — snake_case.
   */
  getAttendanceRules: async (): Promise<AttendanceRules> => {
    const { data } = await apiClient.get<{ data: AttendanceRules }>('/settings/attendance-rules');
    return data.data;
  },

  /**
   * PATCH /settings/attendance-rules — HR_ADMIN, SUPER_ADMIN.
   */
  updateAttendanceRules: async (input: AttendanceRulesUpdateInput): Promise<AttendanceRules> => {
    const { data } = await apiClient.patch<{ data: AttendanceRules }>(
      '/settings/attendance-rules',
      input,
    );
    return data.data;
  },

  /**
   * GET /settings/security/auth — SUPER_ADMIN only.
   * Returns data: AuthSettings — snake_case.
   */
  getAuthSettings: async (): Promise<AuthSettings> => {
    const { data } = await apiClient.get<{ data: AuthSettings }>('/settings/security/auth');
    return data.data;
  },

  /**
   * PATCH /settings/security/auth — SUPER_ADMIN only.
   */
  updateAuthSettings: async (input: AuthSettingsUpdateInput): Promise<AuthSettings> => {
    const { data } = await apiClient.patch<{ data: AuthSettings }>(
      '/settings/security/auth',
      input,
    );
    return data.data;
  },

  /**
   * GET /settings/notifications/preferences — per-caller (user's own prefs).
   */
  getNotificationPrefs: async (): Promise<NotificationPrefs> => {
    const { data } = await apiClient.get<{ data: NotificationPrefs }>(
      '/settings/notifications/preferences',
    );
    return data.data;
  },

  /**
   * PATCH /settings/notifications/preferences — per-caller.
   */
  updateNotificationPrefs: async (
    input: NotificationPrefsUpdateInput,
  ): Promise<NotificationPrefs> => {
    const { data } = await apiClient.patch<{ data: NotificationPrefs }>(
      '/settings/notifications/preferences',
      input,
    );
    return data.data;
  },
};
