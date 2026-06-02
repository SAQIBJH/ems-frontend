import { z } from 'zod';

export const departmentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  departmentCode: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be at most 10 characters'),
  parentId: z.string().optional(),
  headEmployeeId: z.string().optional(),
});

export type DepartmentCreateFormValues = z.infer<typeof departmentCreateSchema>;

export const departmentUpdateSchema = departmentCreateSchema;
export type DepartmentUpdateFormValues = DepartmentCreateFormValues;
