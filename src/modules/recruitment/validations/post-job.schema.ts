import { z } from 'zod';

export const postJobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
});

export type PostJobFormValues = z.infer<typeof postJobSchema>;
