import { describe, expect, it } from 'vitest';
import { isPublicPath, PUBLIC_PATHS } from './public-paths';

describe('isPublicPath', () => {
  it('treats every (auth) route as public', () => {
    for (const p of PUBLIC_PATHS) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it('returns true for /set-password and /reset-password (the reported bug)', () => {
    expect(isPublicPath('/set-password')).toBe(true);
    expect(isPublicPath('/reset-password')).toBe(true);
  });

  it('returns false for protected app routes', () => {
    for (const p of ['/', '/dashboard', '/employees', '/employees/123', '/settings']) {
      expect(isPublicPath(p)).toBe(false);
    }
  });

  it('does not match look-alike prefixes', () => {
    expect(isPublicPath('/login-as-admin')).toBe(false);
    expect(isPublicPath('/set-password-reset')).toBe(false);
  });
});
