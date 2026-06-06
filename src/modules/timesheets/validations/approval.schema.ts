import { z } from 'zod';

/** A rejection requires a reason; the employee sees it and can resubmit. */
export const rejectTimesheetSchema = z.object({
  comment: z
    .string()
    .min(1, 'Provide a reason for the rejection')
    .max(300, 'Keep it under 300 characters'),
});

export type RejectTimesheetFormValues = z.infer<typeof rejectTimesheetSchema>;
