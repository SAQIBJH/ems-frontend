import { z } from 'zod';

export const payrollRunSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM format'),
  includeAllActiveEmployees: z.boolean(),
  payGroupIds: z.array(z.string()).optional(),
});

export type PayrollRunFormValues = z.infer<typeof payrollRunSchema>;
