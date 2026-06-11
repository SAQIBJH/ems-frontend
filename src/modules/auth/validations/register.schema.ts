// src/modules/auth/validations/register.schema.ts
import { z } from 'zod';

// Minimal validation by design — strict rules (password strength, length limits,
// duplicate-company prevention) are deferred. See
// docs/COMPANY_ONBOARDING_VALIDATION_ROADMAP.md.
export const registerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  fullName: z.string().min(1, 'Your name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
