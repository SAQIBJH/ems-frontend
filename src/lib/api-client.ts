import axios from 'axios';
import { env } from './env';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* Separate bare instance used only for /auth/refresh — no interceptors,
 * so a failed refresh doesn't trigger another refresh attempt. */
const _refreshClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor ──────────────────────────────────────────────── */
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-tenant-key'] = env.NEXT_PUBLIC_TENANT_KEY;
  return config;
});

/* ── Response interceptor — refresh on 401 ────────────────────────────── */
let _isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let _queue: QueueEntry[] = [];

function _drainQueue(error: unknown, token: string | null = null) {
  _queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  _queue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        _queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    _isRefreshing = true;

    try {
      const { data } = await _refreshClient.post<{ data: { accessToken: string } }>(
        '/auth/refresh',
      );
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      _drainQueue(null, newToken);
      return apiClient(original);
    } catch (refreshError) {
      _drainQueue(refreshError);
      clearAccessToken();
      if (typeof window !== 'undefined') {
        const isAuthPage =
          window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/forgot-password') ||
          window.location.pathname.startsWith('/otp-verification');
        if (!isAuthPage) {
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
