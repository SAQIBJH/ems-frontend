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

/** Branding — snake_case (settings domain convention). */
export interface BrandingSettings {
  logo_url: string | null;
  primary_color_hex: string | null;
}

export interface BrandingUpdateInput {
  primary_color_hex?: string;
  logo_url?: string;
}

/** Leave types — camelCase (leave domain convention). */
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  annualAllowance: number;
  carryForwardAllowed: boolean;
  isPaid: boolean;
  color?: string;
}

export interface LeaveTypeCreateInput {
  name: string;
  code: string;
  annualAllowance: number;
  isPaid: boolean;
  carryForwardAllowed: boolean;
  color?: string;
}

export type LeaveTypeUpdateInput = Partial<LeaveTypeCreateInput>;

/** Attendance rules — snake_case (settings domain). */
export interface AttendanceRules {
  work_week_days: string[];
  late_after: string;
  half_day_threshold_minutes: number;
  full_day_threshold_minutes: number;
  regularization_window_days: number;
  geo_fencing_enabled: boolean;
}

export type AttendanceRulesUpdateInput = Partial<AttendanceRules>;

/** Authentication / security settings — snake_case, SUPER_ADMIN only. */
export interface AuthSettings {
  password_min_length: number;
  password_require_symbol: boolean;
  password_require_number: boolean;
  session_idle_timeout_minutes: number;
  mfa_policy: 'OPTIONAL' | 'REQUIRED_ADMINS' | 'REQUIRED_ALL';
  sso_enabled: boolean;
}

export type AuthSettingsUpdateInput = Partial<AuthSettings>;

export type NotifChannel = 'in_app' | 'email';

/** Notification preferences — per-caller, snake_case. */
export interface NotificationPrefs {
  channels: { in_app: boolean; email: boolean };
  events: {
    leave_approved: NotifChannel[];
    leave_rejected: NotifChannel[];
    leave_requested: NotifChannel[];
    attendance_regularization: NotifChannel[];
  };
}

export type NotificationPrefsUpdateInput = Partial<NotificationPrefs>;

// ── Email Integration (Phase 2.5 — MSW-backed) ────────────────────────────────

export type EmailProvider = 'resend' | 'sendgrid' | 'ses' | 'smtp';
export type IntegrationStatus = 'connected' | 'error' | 'unconfigured';
export type SmtpEncryption = 'tls' | 'starttls' | 'none';

export interface EmailIntegrationConfig {
  apiKey: string | null;
  region: string | null;
  accessKeyId: string | null;
  host: string | null;
  port: number | null;
  username: string | null;
  encryption: SmtpEncryption | null;
}

export interface EmailIntegration {
  provider: EmailProvider | null;
  fromAddress: string;
  fromName: string;
  status: IntegrationStatus;
  lastTestedAt: string | null;
  config: EmailIntegrationConfig;
}

export interface EmailIntegrationUpdateInput {
  provider: EmailProvider;
  fromAddress: string;
  fromName: string;
  config: Partial<EmailIntegrationConfig> & {
    secretAccessKey?: string;
    password?: string;
  };
}
