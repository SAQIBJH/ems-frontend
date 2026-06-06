import { z } from 'zod';

/** Form values are plain numbers/booleans/enums (no transforms) so RHF input === output. */
export const timesheetSettingsSchema = z.object({
  standardWeeklyHours: z
    .number({ message: 'Enter a number' })
    .min(1, 'Must be at least 1')
    .max(168, 'A week has at most 168 hours'),
  overtimeThresholdHours: z
    .number({ message: 'Enter a number' })
    .min(0, 'Cannot be negative')
    .max(168, 'A week has at most 168 hours'),
  roundingMinutes: z.number({ message: 'Enter a number' }).min(0).max(60),
  approvalRequired: z.boolean(),
  unloggedHoursPolicy: z.enum(['IGNORE', 'FLAG', 'DEDUCT']),
  billableDefault: z.boolean(),
});

export type TimesheetSettingsFormValues = z.infer<typeof timesheetSettingsSchema>;
