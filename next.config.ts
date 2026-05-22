import type { NextConfig } from 'next';

/**
 * No `rewrites()` here on purpose. Backend traffic is proxied through the BFF
 * route handler at `src/app/api/[...path]/route.ts`, which can inject the
 * `x-tenant-key` header server-side. A rewrite cannot — it would require the
 * tenant key to be a public (browser-visible) value.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
