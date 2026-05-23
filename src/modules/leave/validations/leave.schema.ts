import { z } from 'zod';

export const createLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'Please select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
  })
  .refine((d) => new Date(d.startDate) <= new Date(d.endDate), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export const denyLeaveSchema = z.object({
  comment: z.string().min(1, 'Please provide a reason for denial'),
});

export type CreateLeaveFormValues = z.infer<typeof createLeaveSchema>;
export type DenyLeaveFormValues = z.infer<typeof denyLeaveSchema>;
