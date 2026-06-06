import { z } from 'zod';

/** Form values are all plain (no transforms) so RHF input === output. The numeric
 *  rate is a string in the form and converted to a number at submit. */
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(80),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(12, 'Keep the code short')
    .regex(/^[A-Za-z0-9-]+$/, 'Letters, numbers and dashes only'),
  clientName: z.string().max(80),
  billable: z.boolean(),
  defaultRate: z.string().regex(/^\d*(\.\d{1,2})?$/, 'Enter a valid rate'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
