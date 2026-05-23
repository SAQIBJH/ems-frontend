import { z } from 'zod';

export const checkInSchema = z.object({
  workMode: z.enum(['OFFICE', 'WFH', 'HYBRID']),
  notes: z.string().optional(),
});

export const regularizationSchema = z.object({
  attendanceDate: z.string().min(1, 'Date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type CheckInFormValues = z.infer<typeof checkInSchema>;
export type RegularizationFormValues = z.infer<typeof regularizationSchema>;
