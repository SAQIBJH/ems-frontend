/**
 * Public routes reachable while unauthenticated. These mirror the segments under
 * `src/app/(auth)/`. A visitor can legitimately land on any of them with no
 * session (e.g. a new employee opening `/set-password` from an activation email,
 * or a user opening `/reset-password` from a forgot-password email).
 *
 * Single-sourced on purpose: the axios 401 interceptor previously kept its own
 * hardcoded copy of this list, which drifted when `/reset-password` and
 * `/set-password` were added to the (auth) group — so the expected app-boot
 * `/auth/me` 401 bounced those pages to `/login`. Keep this in sync with the
 * (auth) route group and nothing else needs touching.
 */
export const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/otp-verification',
  '/reset-password',
  '/set-password',
] as const;

/**
 * True when `pathname` is a public (auth) route, or nested under one. Matches the
 * exact path or a `/`-delimited child — deliberately stricter than a bare
 * `startsWith`, so `/login-as-x` or `/set-password-reset` are NOT treated as
 * public. `pathname` should be `window.location.pathname` (no query string).
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
