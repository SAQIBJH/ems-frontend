/** All fields use snake_case — matches wire format exactly. Do NOT normalize. */
export interface TenantSettings {
  company_name: string;
  timezone: string;
  working_hours_start: string;
  working_hours_end: string;
  fiscal_year_start: number;
}

/** Audit log entry — all fields are snake_case (API_MAPPING.md §Audit Logs). */
export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuditLogsParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
}

/** Only these four fields are accepted by PATCH /settings/tenant. */
export interface TenantSettingsUpdateInput {
  company_name?: string;
  timezone?: string;
  working_hours_start?: string;
  working_hours_end?: string;
}

export type EmailTemplateType = 'LEAVE_APPROVAL' | 'LEAVE_REJECTION' | 'ATTENDANCE_ALERT';

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  subject: string;
  body: string;
}

export interface EmailTemplatesData {
  templates: EmailTemplate[];
}

export interface EmailTemplateUpdateInput {
  subject: string;
  body: string;
}
