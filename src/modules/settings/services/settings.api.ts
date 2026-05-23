import { apiClient } from '@/lib/api-client';
import type {
  EmailTemplate,
  EmailTemplatesData,
  EmailTemplateType,
  EmailTemplateUpdateInput,
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
};
