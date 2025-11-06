import { describe, it, expect, vi } from 'vitest';

import { normalizeSafeRedirect } from '../safeRedirect';

describe('normalizeSafeRedirect', () => {
  it('returns safe path and does not warn', () => {
    const spy = vi.fn();
    const r = normalizeSafeRedirect('/dashboard', spy);
    expect(r).toBe('/dashboard');
    expect(spy).not.toHaveBeenCalled();
  });

  it('blocks absolute URL and warns', () => {
    const spy = vi.fn();
    const r = normalizeSafeRedirect('https://evil.com', spy);
    expect(r).toBe('/dashboard');
    expect(spy).toHaveBeenCalledWith('Blocked unsafe redirect', 'https://evil.com');
  });

  it('blocks protocol-relative URL and warns', () => {
    const spy = vi.fn();
    const r = normalizeSafeRedirect('//evil.com', spy);
    expect(r).toBe('/dashboard');
    expect(spy).toHaveBeenCalled();
  });

  it('returns fallback for null or undefined input', () => {
    const spy = vi.fn();
    expect(normalizeSafeRedirect(null, spy)).toBe('/dashboard');
    expect(normalizeSafeRedirect(undefined, spy)).toBe('/dashboard');
    expect(spy).not.toHaveBeenCalled();
  });

  it('preserves query parameters and hash in safe paths', () => {
    const spy = vi.fn();
    const r = normalizeSafeRedirect('/dashboard?tab=settings#profile', spy);
    expect(r).toBe('/dashboard?tab=settings#profile');
    expect(spy).not.toHaveBeenCalled();
  });

  it('uses custom fallback when provided', () => {
    const spy = vi.fn();
    const r = normalizeSafeRedirect('https://evil.com', spy, '/home');
    expect(r).toBe('/home');
    expect(spy).toHaveBeenCalled();
  });
});
