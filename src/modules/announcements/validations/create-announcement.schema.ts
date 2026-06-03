import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required').max(2000),
  category: z.enum(['Company', 'People', 'Product', 'IT', 'Office'] as const, {
    error: 'Select a category',
  }),
  audience: z.string().min(1, 'Audience is required'),
  isPinned: z.boolean().optional(),
});

export type CreateAnnouncementFormValues = z.infer<typeof createAnnouncementSchema>;
