/** All fields use snake_case — matches wire format exactly. Do NOT normalize. */
export interface TenantSettings {
  company_name: string;
  timezone: string;
  working_hours_start: string;
  working_hours_end: string;
  fiscal_year_start: number;
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
