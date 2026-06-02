/** All fields use snake_case — matches wire format exactly. Do NOT normalize.
 *  Extended identity fields (camelCase) come from the Tenant model, not TenantConfig. */
export interface TenantSettings {
  company_name: string;
  timezone: string;
  working_hours_start: string;
  working_hours_end: string;
  fiscal_year_start: number;
  /** Tenant identity fields — camelCase per API_MAPPING.md */
  legalName?: string;
  displayName?: string;
  country?: string;
  defaultCurrency?: string;
  primaryContactEmail?: string;
  supportPhone?: string;
  logoUrl?: string | null;
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

/** PATCH /settings/tenant — snake_case operational fields + camelCase identity fields. */
export interface TenantSettingsUpdateInput {
  company_name?: string;
  timezone?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  legalName?: string;
  displayName?: string;
  country?: string;
  defaultCurrency?: string;
  primaryContactEmail?: string;
  supportPhone?: string;
  logoUrl?: string;
}

export type EmailTemplateType = 'LEAVE_APPROVAL' | 'LEAVE_REJECTION' | 'ATTENDANCE_ALERT';

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  subject: string;
  body: string;
  fromAddressOverride?: string | null;
}

export interface EmailTemplatesData {
  templates: EmailTemplate[];
}

export interface EmailTemplateUpdateInput {
  subject: string;
  body: string;
  fromAddressOverride?: string | null;
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

// ── Storage Integration (Phase 2.5 — MSW-backed) ─────────────────────────────

export type StorageProvider = 's3' | 'gcs' | 'azure';
export type DocumentType = 'EMPLOYEE_RECORD' | 'PAYSLIP' | 'CONTRACT' | 'ID_PROOF' | 'OTHER';
export type VirusScanProvider = 'clamav' | 'cloudmind';

export interface StorageIntegrationConfig {
  bucket: string | null;
  region: string | null;
  accessKeyId: string | null;
  projectId: string | null;
  accountName: string | null;
  containerName: string | null;
  versioningEnabled: boolean;
  presignedUrlTtlSeconds: number;
}

export interface RetentionPolicy {
  documentType: DocumentType;
  retentionDays: number;
  autoDeletionEnabled: boolean;
}

export interface VirusScanConfig {
  enabled: boolean;
  provider: VirusScanProvider | null;
  webhookUrl: string | null;
}

export interface StorageIntegration {
  provider: StorageProvider | null;
  status: IntegrationStatus;
  lastTestedAt: string | null;
  config: StorageIntegrationConfig;
  retentionPolicies: RetentionPolicy[];
  virusScan: VirusScanConfig;
}

export interface StorageIntegrationUpdateInput {
  provider: StorageProvider;
  config: Partial<StorageIntegrationConfig> & {
    secretAccessKey?: string;
    serviceAccountJson?: string;
    connectionString?: string;
  };
  retentionPolicies?: Partial<RetentionPolicy>[];
  virusScan?: Partial<VirusScanConfig>;
}

// ── Webhooks (Phase 2.5 — MSW-backed) ────────────────────────────────────────

export type WebhookEvent =
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_TERMINATED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_WITHDRAWN'
  | 'ATTENDANCE_REGULARIZED'
  | 'ATTENDANCE_REGULARIZATION_APPROVED'
  | 'ATTENDANCE_REGULARIZATION_DENIED'
  | 'DEPARTMENT_CREATED'
  | 'DEPARTMENT_UPDATED'
  | 'DEPARTMENT_DELETED'
  | 'PAYROLL_RUN_APPROVED'
  | 'PAYSLIP_GENERATED';

export type WebhookStatus = 'active' | 'disabled';

export interface WebhookLastDelivery {
  timestamp: string;
  statusCode: number;
  success: boolean;
  durationMs: number;
}

export interface Webhook {
  id: string;
  url: string;
  description: string | null;
  events: WebhookEvent[];
  status: WebhookStatus;
  secret: string;
  lastDelivery: WebhookLastDelivery | null;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  url: string;
  requestBody: string;
  responseStatus: number | null;
  responseBody: string | null;
  durationMs: number | null;
  success: boolean;
  timestamp: string;
}

export interface WebhookDeliveriesResponse {
  deliveries: WebhookDelivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebhookCreateInput {
  url: string;
  events: WebhookEvent[];
  description?: string;
  active: boolean;
}

export interface WebhookUpdateInput {
  url?: string;
  events?: WebhookEvent[];
  description?: string;
  active?: boolean;
}

// ── Billing (Phase 2.5 — MSW-backed) ─────────────────────────────────────────

export type PlanCode = 'starter' | 'professional' | 'enterprise';
export type PlanInterval = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due';

export interface BillingPlanSummary {
  code: PlanCode;
  name: string;
  price: number;
  currency: string;
  interval: PlanInterval;
}

export interface BillingSubscription {
  plan: BillingPlanSummary;
  status: SubscriptionStatus;
  seats: { total: number; used: number; available: number };
  usage: {
    apiCalls: { used: number; limit: number };
    storage: { usedBytes: number; limitBytes: number };
  };
  modules: { payroll: boolean; recruitment: boolean; performance: boolean };
  currentPeriod: { start: string; end: string };
  nextRenewalDate: string;
  trialEndsAt: string | null;
}

export interface BillingPlan {
  code: PlanCode;
  name: string;
  price: number | null;
  currency: string;
  interval: PlanInterval;
  seatsIncluded: number | null;
  recommended: boolean;
  features: string[];
  modules: { payroll: boolean; recruitment: boolean; performance: boolean };
}

// ── Billing Invoices (Phase 2.5 — MSW-backed) ────────────────────────────────

export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'void';

export interface Invoice {
  id: string;
  number: string;
  description: string;
  date: string;
  dueDate: string;
  period: { start: string; end: string };
  amount: number;
  currency: string;
  status: InvoiceStatus;
  downloadUrl: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailDeliveryStats {
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  period: 'last_30_days';
}
