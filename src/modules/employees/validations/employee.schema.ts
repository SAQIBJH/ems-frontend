import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Used with React Hook Form for both create and edit.
 * All fields are strings so the form's internal state stays uniform.
 * Empty optional fields (managerId, phone, etc.) are sanitised to
 * undefined by prepareEmployeePayload() before hitting the API.
 */
export const employeeCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  workEmail: z.string().min(1, 'Work email is required').email('Invalid email address'),
  employeeCode: z.string().min(2, 'At least 2 characters').max(20),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  joinedOn: z.string().regex(DATE_RE, 'Date must be MM-DD-YYYY'),
  designation: z.string().min(1, 'Designation is required').max(100),
  departmentId: z.string().min(1, 'Department is required'),
  // Optional strings — empty string = not provided
  managerId: z.string(),
  phone: z.string(),
  location: z.string(),
  address: z.string(),
  gender: z.string().refine((v) => !v || ['MALE', 'FEMALE', 'OTHER'].includes(v), 'Invalid gender'),
  dateOfBirth: z.string().refine((v) => !v || DATE_RE.test(v), 'Date must be YYYY-MM-DD'),
  personalEmail: z
    .string()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Invalid email address'),
});

export type EmployeeCreateFormValues = z.infer<typeof employeeCreateSchema>;
// All fields are strings — empty optional fields are sanitised in prepareEmployeePayload().

export const employeeUpdateSchema = employeeCreateSchema;
export type EmployeeUpdateFormValues = EmployeeCreateFormValues;
