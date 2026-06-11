import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture what documentsApi hands to the axios instance.
const post = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}));

import { documentsApi } from './documents.api';

describe('documentsApi.upload', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { data: { id: 'doc1' } } });
  });

  it('sends the file as multipart/form-data, not JSON', async () => {
    const file = new File(['hello'], 'id.pdf', { type: 'application/pdf' });

    await documentsApi.upload('emp1', file, 'ID_PROOF');

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0] as [
      string,
      FormData,
      { headers?: Record<string, string> } | undefined,
    ];

    expect(url).toBe('/employees/emp1/documents');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(body.get('documentType')).toBe('ID_PROOF');

    // Root cause of Bug A: the axios instance forces `Content-Type: application/json`.
    // With that default, axios 1.x converts a FormData body to JSON (File -> {}), so the
    // file never gets sent. The upload MUST override the content-type to multipart so
    // axios passes the FormData through and the platform sets the boundary.
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data');
  });
});
