import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Avoid pulling in `server-only` (and a real backend URL) during the test.
vi.mock('@/lib/env.server', () => ({
  serverEnv: { API_BASE_URL: 'https://backend.test/api/v1' },
}));

import { GET, POST } from './route';

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

    const fetchMock = vi.fn().mockResolvedValue(
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

  it('relays a binary response body byte-for-byte (downloads/PDFs safe)', async () => {
    // %PDF magic + non-UTF-8 bytes — `backendResponse.text()` would corrupt these.
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0xff, 0x00, 0xfe]);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest(
      'http://localhost:3000/api/employees/e1/documents/d1/download',
      { method: 'GET' },
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ['employees', 'e1', 'documents', 'd1', 'download'] }),
    });

    const out = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(out)).toEqual(Array.from(pdfBytes));
    expect(response.headers.get('content-type')).toBe('application/pdf');
  });
});
