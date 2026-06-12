import { describe, it, expect } from 'vitest';
import { setPasswordSchema } from './set-password.schema';

describe('setPasswordSchema', () => {
  const ok = { password: 'Passw0rd', confirmPassword: 'Passw0rd' };

  it('accepts a policy-compliant matching password', () => {
    expect(setPasswordSchema.safeParse(ok).success).toBe(true);
  });

  it.each([
    ['too short', 'Pas1', 'at least 8'],
    ['no uppercase', 'passw0rd', 'uppercase'],
    ['no lowercase', 'PASSW0RD', 'lowercase'],
    ['no number', 'Password', 'number'],
  ])('rejects when %s', (_label, password) => {
    const r = setPasswordSchema.safeParse({ password, confirmPassword: password });
    expect(r.success).toBe(false);
  });

  it('rejects when passwords do not match', () => {
    const r = setPasswordSchema.safeParse({ password: 'Passw0rd', confirmPassword: 'Passw0red' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });
});
