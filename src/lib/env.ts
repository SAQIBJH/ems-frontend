import { z } from 'zod';

/**
 * Public env — safe to expose to the browser. Only `NEXT_PUBLIC_*` vars belong
 * here, and this file may be imported from client components.
 *
 * Server-only secrets (API_BASE_URL, TENANT_KEY) live in `env.server.ts` and
 * must NEVER be added here or given a `NEXT_PUBLIC_` prefix.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_USE_MOCKS: z.enum(['true', 'false']).transform((v) => v === 'true'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
