import { z } from 'zod';

export const legalEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  country: z
    .string()
    .length(2, 'Country is required')
    .regex(/^[A-Z]{2}$/, 'Must be an ISO 3166-1 alpha-2 code'),
  currency: z
    .string()
    .length(3, 'Currency is required')
    .regex(/^[A-Z]{3}$/, 'Must be an ISO 4217 code'),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  workWeekPattern: z.enum(['MON-FRI', 'MON-SAT']),
  timezone: z.string().min(1, 'Timezone is required').max(60),
  locale: z.string().min(2, 'Locale is required').max(20),
  registrationIds: z.record(z.string(), z.string()),
  active: z.boolean(),
});

export type LegalEntityFormValues = z.infer<typeof legalEntitySchema>;
