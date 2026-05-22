import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const employeeCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  workEmail: z.string().min(1, 'Work email is required').email('Invalid email address'),
  employeeCode: z.string().min(2, 'At least 2 characters').max(20),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  joinedOn: dateString,
  designation: z.string().min(1, 'Designation is required').max(100),
  departmentId: z.string().min(1, 'Department is required'),
  managerId: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: dateString.optional(),
  personalEmail: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
});

export type EmployeeCreateFormValues = z.infer<typeof employeeCreateSchema>;

export const employeeUpdateSchema = employeeCreateSchema.partial();

export type EmployeeUpdateFormValues = z.infer<typeof employeeUpdateSchema>;
