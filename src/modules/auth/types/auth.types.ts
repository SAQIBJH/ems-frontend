export interface LoginResponse {
  accessToken: string;
}

export interface Session {
  id: string;
  userAgent: string;
  ip: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}
