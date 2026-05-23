import { z } from 'zod';

export const holidayFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  /** Must be YYYY-MM-DD — server uses z.string().date() which rejects full ISO strings. */
  holidayDate: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  isOptional: z.boolean(),
});

export type HolidayFormValues = z.infer<typeof holidayFormSchema>;
