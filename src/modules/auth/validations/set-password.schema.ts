import { z } from 'zod';

/**
 * Account-activation password policy — mirrors the backend exactly:
 * min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 number.
 * (Backend rejects weaker passwords with 422 WEAK_PASSWORD as a backstop.)
 */
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
