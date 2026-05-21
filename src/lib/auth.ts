/* In-memory access token store.
 * Access tokens MUST NOT be persisted to localStorage or cookies.
 * Refresh tokens live in HttpOnly cookies set by the server. */

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}
