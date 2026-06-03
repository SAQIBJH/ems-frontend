import { z } from 'zod';

export const addAssetSchema = z.object({
  tag: z
    .string()
    .min(1, 'Asset tag is required')
    .regex(/^[A-Z]+-\d+$/, 'Tag must match pattern e.g. LAP-0210'),
  name: z.string().min(1, 'Asset name is required').max(100),
  type: z.enum(['Laptop', 'Monitor', 'Phone', 'Other'] as const, {
    error: 'Select a type',
  }),
});

export type AddAssetFormValues = z.infer<typeof addAssetSchema>;
