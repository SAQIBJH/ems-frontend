import 'server-only';
import { z } from 'zod';

/**
 * Server-only env. The `server-only` import above turns any attempt to import
 * this file from a client component into a build error.
 *
 * API_BASE_URL must NOT carry the `NEXT_PUBLIC_` prefix — that would inline
 * the backend URL into the browser bundle. It is read exclusively by the BFF
 * proxy route handler (`src/app/api/[...path]`).
 *
 * There is NO TENANT_KEY — the JWT cookie carries tenant identity. The backend
 * derives the tenant from the token, not from a header.
 */
const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url(),
});

export const serverEnv = serverEnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
});
