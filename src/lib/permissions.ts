import type { User } from '@/types/user';

/** Returns true when the given user holds the requested permission string. */
export function can(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}
