import { z } from 'zod';

/** Form values are plain (no transforms) so RHF input === output. `hours` is a
 *  string in the form and converted to a number at submit. */
export const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  taskId: z.string().min(1, 'Select a task'),
  date: z.string().min(1, 'Select a day'),
  hours: z
    .string()
    .min(1, 'Enter hours')
    .regex(/^\d*(\.\d{1,2})?$/, 'Enter valid hours (e.g. 7.5)')
    .refine((v) => Number(v) > 0, 'Hours must be greater than 0')
    .refine((v) => Number(v) <= 24, 'A day has at most 24 hours'),
  billable: z.boolean(),
  note: z.string().max(200, 'Keep the note under 200 characters'),
});

export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;
