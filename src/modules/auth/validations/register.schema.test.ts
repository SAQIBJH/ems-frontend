// src/modules/auth/validations/register.schema.test.ts
import { describe, it, expect } from 'vitest';
import { registerSchema } from './register.schema';

describe('registerSchema', () => {
  const valid = {
    companyName: 'Acme Inc',
    fullName: 'Mohammad Saqib',
    email: 'admin@acme.com',
    password: 'secret',
  };

  it('accepts a fully filled form', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty company name', () => {
    const result = registerSchema.safeParse({ ...valid, companyName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty full name', () => {
    expect(registerSchema.safeParse({ ...valid, fullName: '' }).success).toBe(false);
  });

  it('rejects a malformed email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(registerSchema.safeParse({ ...valid, password: '' }).success).toBe(false);
  });
});
