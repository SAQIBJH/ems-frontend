import 'server-only';
import { z } from 'zod';

/**
 * Server-only env. The `server-only` import above turns any attempt to import
 * this file from a client component into a build error.
 *
 * API_BASE_URL and TENANT_KEY must NOT carry the `NEXT_PUBLIC_` prefix — that
 * would inline them into the browser bundle and leak the tenant key. They are
 * read exclusively by the BFF proxy route handler (`src/app/api/[...path]`).
 */
const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url(),
  TENANT_KEY: z.string().min(1),
});

export const serverEnv = serverEnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  TENANT_KEY: process.env.TENANT_KEY,
});
