// src/api/__tests__/edge-auth.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

import handler from '../../../api/edge-auth';

describe('Edge Auth Middleware', () => {
  // Setup mock Request objects
  const createRequest = (path: string, headers = {}) =>
    new Request(`https://inkwell.example.com${path}`, {
      headers: new Headers(headers),
    });

  beforeEach(() => {
    // Mock Response.redirect
    vi.spyOn(Response, 'redirect').mockImplementation(
      (url) => new Response(null, { status: 302, headers: { Location: String(url) } }),
    );

    // Mock fetch global
    global.fetch = vi.fn().mockResolvedValue(new Response('OK'));
  });

  it('allows public paths without auth', async () => {
    // Test multiple public paths
    const publicPaths = ['/login', '/api/login', '/favicon.ico', '/assets/main.js', '/health'];

    for (const path of publicPaths) {
      const req = createRequest(path);
      await handler(req);
      expect(global.fetch).toHaveBeenCalledWith(req);
    }
  });

  it('redirects protected paths to login when not authenticated', async () => {
    const req = createRequest('/dashboard');
    await handler(req);

    expect(Response.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?next=/dashboard'),
      302,
    );
  });

  it('allows authenticated requests to protected paths', async () => {
    const req = createRequest('/dashboard', {
      cookie: 'inkwell_auth=ok',
    });

    await handler(req);
    expect(global.fetch).toHaveBeenCalledWith(req);
  });

  it('properly encodes query parameters in redirect URL', async () => {
    const req = createRequest('/projects/123?view=writing');
    await handler(req);

    expect(Response.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?next=/projects/123?view=writing'),
      302,
    );
  });

  it('bypasses auth for localhost development', async () => {
    const req = new Request('http://localhost:3000/dashboard');
    await handler(req);

    expect(global.fetch).toHaveBeenCalledWith(req);
  });
});
