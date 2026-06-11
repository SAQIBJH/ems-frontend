import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Avoid pulling in `server-only` (and a real backend URL) during the test.
vi.mock('@/lib/env.server', () => ({
  serverEnv: { API_BASE_URL: 'https://backend.test/api/v1' },
}));

import { POST } from './route';

describe('BFF proxy — request body forwarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards the body byte-for-byte (binary/multipart safe)', async () => {
    // Bytes that are NOT valid UTF-8 — `request.text()` would corrupt these.
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0xff, 0xd8, 0xff, 0xe0]);

    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost:3000/api/employees/e1/documents', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=XYZ' },
      body: bytes,
    });

    await POST(request, { params: Promise.resolve({ path: ['employees', 'e1', 'documents'] }) });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { body: unknown }];

    expect(url).toBe('https://backend.test/api/v1/employees/e1/documents');
    // The fix: body forwarded as raw bytes (ArrayBuffer), not a text() round-trip.
    expect(init.body).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(init.body as ArrayBuffer))).toEqual(Array.from(bytes));
    expect((init.headers as Headers).get('content-type')).toBe('multipart/form-data; boundary=XYZ');
  });
});
