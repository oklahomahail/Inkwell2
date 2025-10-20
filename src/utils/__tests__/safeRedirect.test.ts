import { normalizeSafeRedirect } from '../safeRedirect';

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
