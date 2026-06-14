import { z } from 'zod';

export const payGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(30)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be UPPER_SNAKE_CASE'),
  currency: z.string().min(3, 'Currency is required').max(3),
  paySchedule: z.enum(['MONTHLY', 'SEMI_MONTHLY', 'BIWEEKLY', 'WEEKLY']),
  description: z.string().max(500).nullable().optional(),
  active: z.boolean(),
  components: z.array(
    z.object({
      componentId: z.string().min(1),
      overrideCalculationType: z.enum(['FLAT', 'PERCENTAGE', 'FORMULA']).nullable(),
      overrideValue: z.number().nullable(),
      overrideFormula: z.string().nullable(),
    }),
  ),
});

export type PayGroupFormValues = z.infer<typeof payGroupSchema>;
