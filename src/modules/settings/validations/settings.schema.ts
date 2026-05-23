import { z } from 'zod';

export const tenantSettingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  working_hours_start: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  working_hours_end: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
});

export type TenantSettingsFormValues = z.infer<typeof tenantSettingsSchema>;

export const emailTemplateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;
