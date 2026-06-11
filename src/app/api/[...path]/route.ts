import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';

/**
 * BFF (Backend-for-Frontend) proxy.
 *
 * The browser only ever calls our own origin at `/api/*`. This handler catches
 * those calls and forwards them to the real backend. The backend URL never
 * reaches the browser.
 *
 *   browser  ──►  Next.js /api/*  ──►  ${API_BASE_URL}/*
 *
 * Auth is entirely cookie-based. The browser's httpOnly accessToken and
 * refreshToken cookies are forwarded unchanged. There is no x-tenant-key —
 * the JWT itself carries the tenant identity.
 */

// This route depends on per-request headers/body — never statically cached.
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

/** Strip the `Domain=` attribute so backend cookies bind to our own origin. */
function rewriteSetCookie(value: string): string {
  return value.replace(/;\s*Domain=[^;]*/i, '');
}

async function proxy(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;

  const base = serverEnv.API_BASE_URL.replace(/\/+$/, '');
  const targetUrl = `${base}/${path.join('/')}${request.nextUrl.search}`;

  // Build the outbound header set explicitly — only forward what's needed.
  const headers = new Headers();
  headers.set('accept', 'application/json');

  const auth = request.headers.get('authorization');
  if (auth) headers.set('authorization', auth);

  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let body: ArrayBuffer | undefined;
  if (hasBody) {
    // Forward the body as raw bytes — NOT request.text(). Reading the body as text
    // UTF-8-decodes it, which corrupts binary/multipart payloads (file uploads),
    // making the backend reject them as "not multipart". arrayBuffer() preserves the
    // exact bytes (and is equally correct for JSON).
    body = await request.arrayBuffer();
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? body : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    // Backend unreachable (DNS, connection refused, timeout). Return our
    // standard error envelope rather than letting the request crash.
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPSTREAM_UNREACHABLE',
          message: 'Unable to reach the backend service. Please try again.',
          details: {},
          requestId: crypto.randomUUID(),
        },
      },
      { status: 502 },
    );
  }

  // Relay status and body unchanged.
  const responseBody = await backendResponse.text();
  const response = new NextResponse(responseBody, { status: backendResponse.status });

  const contentType = backendResponse.headers.get('content-type');
  if (contentType) response.headers.set('content-type', contentType);

  // Pass Set-Cookie through so the HttpOnly refresh-token cookie reaches the
  // browser, rebound to our origin.
  for (const value of backendResponse.headers.getSetCookie()) {
    response.headers.append('set-cookie', rewriteSetCookie(value));
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
