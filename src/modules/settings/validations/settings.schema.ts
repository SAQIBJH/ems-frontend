import { z } from 'zod';

export const tenantSettingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  working_hours_start: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  working_hours_end: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  /** Extended identity fields — all optional */
  legalName: z.string().optional(),
  displayName: z.string().optional(),
  country: z.string().optional(),
  defaultCurrency: z.string().max(3, 'ISO 4217 code, e.g. INR').optional(),
  primaryContactEmail: z.string().email('Must be a valid email').or(z.literal('')).optional(),
  supportPhone: z.string().optional(),
});

export type TenantSettingsFormValues = z.infer<typeof tenantSettingsSchema>;

export const emailTemplateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  fromAddressOverride: z.string().email('Must be a valid email').or(z.literal('')).optional(),
});

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;

export const brandingSchema = z.object({
  primary_color_hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color e.g. #3b5cff')
    .or(z.literal(''))
    .optional(),
});

export type BrandingFormValues = z.infer<typeof brandingSchema>;

export const attendanceRulesSchema = z.object({
  work_week_days: z.array(z.string()).min(1, 'Select at least one working day'),
  late_after: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  half_day_threshold_minutes: z
    .number({ message: 'Must be a number' })
    .int()
    .min(1, 'Must be at least 1 minute')
    .max(720, 'Cannot exceed 720 minutes'),
  full_day_threshold_minutes: z
    .number({ message: 'Must be a number' })
    .int()
    .min(1, 'Must be at least 1 minute')
    .max(1440, 'Cannot exceed 1440 minutes'),
  regularization_window_days: z
    .number({ message: 'Must be a number' })
    .int()
    .min(1, 'Must be at least 1 day')
    .max(90, 'Cannot exceed 90 days'),
  geo_fencing_enabled: z.boolean(),
});

export type AttendanceRulesFormValues = z.infer<typeof attendanceRulesSchema>;

export const authSettingsSchema = z.object({
  password_min_length: z
    .number({ message: 'Must be a number' })
    .int()
    .min(8, 'Minimum 8')
    .max(128, 'Maximum 128'),
  password_require_symbol: z.boolean(),
  password_require_number: z.boolean(),
  session_idle_timeout_minutes: z
    .number({ message: 'Must be a number' })
    .int()
    .min(5, 'Minimum 5 minutes')
    .max(10080, 'Maximum 10080 minutes (1 week)'),
  mfa_policy: z.enum(['OPTIONAL', 'REQUIRED_ADMINS', 'REQUIRED_ALL']),
  sso_enabled: z.boolean(),
});

export type AuthSettingsFormValues = z.infer<typeof authSettingsSchema>;

export const notificationPrefsSchema = z.object({
  channels: z.object({
    in_app: z.boolean(),
    email: z.boolean(),
  }),
  events: z.object({
    leave_approved: z.array(z.enum(['in_app', 'email'])),
    leave_rejected: z.array(z.enum(['in_app', 'email'])),
    leave_requested: z.array(z.enum(['in_app', 'email'])),
    attendance_regularization: z.array(z.enum(['in_app', 'email'])),
  }),
});

export type NotificationPrefsFormValues = z.infer<typeof notificationPrefsSchema>;

export const localeTimezoneSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
});

export type LocaleTimezoneFormValues = z.infer<typeof localeTimezoneSchema>;

export const workingHoursSchema = z
  .object({
    working_hours_start: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    working_hours_end: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  })
  .superRefine((val, ctx) => {
    if (val.working_hours_start >= val.working_hours_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['working_hours_end'],
        message: 'End time must be after start time',
      });
    }
  });

export type WorkingHoursFormValues = z.infer<typeof workingHoursSchema>;

export const leaveTypeSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(50),
  code: z
    .string()
    .min(2, 'At least 2 characters')
    .max(20)
    .regex(/^[A-Z0-9_]+$/, 'Uppercase letters, numbers, underscores only'),
  annualAllowance: z
    .number({ message: 'Must be a number' })
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(365, 'Cannot exceed 365 days'),
  isPaid: z.boolean(),
  carryForwardAllowed: z.boolean(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .or(z.literal(''))
    .optional(),
});

export type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;
