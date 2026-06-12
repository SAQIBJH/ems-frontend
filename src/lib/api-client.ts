import axios from 'axios';
import { isPublicPath } from './public-paths';

/* baseURL is our own origin's `/api` — the browser never calls the real
 * backend directly. Requests hit the BFF proxy (src/app/api/[...path]),
 * which forwards them to the backend with the x-tenant-key attached
 * server-side. Auth is entirely cookie-based: the server sets httpOnly
 * accessToken and refreshToken cookies; withCredentials ensures they are
 * sent automatically on every request without any client-side token handling. */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* Separate bare instance for /auth/refresh only — no interceptors,
 * so a failed refresh doesn't recurse into another refresh attempt. */
const _refreshClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Response interceptor — silent cookie refresh on 401 ─────────────────── */
let _isRefreshing = false;
type QueueEntry = { resolve: () => void; reject: (err: unknown) => void };
let _queue: QueueEntry[] = [];

function _drainQueue(error: unknown) {
  _queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  _queue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    // The backend returns 401 for an expired/absent/invalid token on every endpoint
    // (including tenant-scoped ones like /auth/me) — so a plain 401 is the auth-failure
    // signal that drives the silent refresh. (A prior workaround also treated
    // `400 INVALID_TENANT` as auth-failure because tenant resolution used to fail first;
    // the backend now returns 401 directly, so that special case was removed.)
    const status = error.response?.status;
    const isAuthFailure = status === 401;

    if (!isAuthFailure || original._retry) {
      return Promise.reject(error);
    }

    // Don't attempt refresh for auth endpoints — it would be circular.
    const url: string = original.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      // Queue this request until the in-flight refresh completes.
      return new Promise<void>((resolve, reject) => {
        _queue.push({ resolve, reject });
      }).then(() => apiClient(original));
    }

    original._retry = true;
    _isRefreshing = true;

    try {
      // The refreshToken cookie is sent automatically. The server rotates it
      // and sets a fresh accessToken cookie — no body extraction needed.
      await _refreshClient.post('/auth/refresh');
      _drainQueue(null);
      return apiClient(original);
    } catch (refreshError) {
      _drainQueue(refreshError);
      if (typeof window !== 'undefined') {
        // Don't bounce to /login from public (auth) pages — an expected 401 (e.g.
        // the app-boot /auth/me probe) fires there for unauthenticated visitors,
        // such as a new employee landing on /set-password from an activation email.
        // Sourced from a single PUBLIC_PATHS list so the allowlist can't drift again.
        if (!isPublicPath(window.location.pathname)) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?next=${next}`;
        }
      }
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  },
);
