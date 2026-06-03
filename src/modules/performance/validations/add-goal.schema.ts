import { z } from 'zod';

export const addGoalSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  title: z.string().min(1, 'Goal title is required').max(200, 'Title too long'),
  dueDate: z.string().min(1, 'Due date is required'),
  progressPct: z.number().min(0).max(100),
});

export type AddGoalFormValues = z.infer<typeof addGoalSchema>;
