// Centralize logic so tests are consistent everywhere.
export function normalizeSafeRedirect(
  raw: string | null | undefined,
  warn: (msg: string, value?: unknown) => void = console.warn,
  fallback = '/dashboard',
): string {
  if (!raw) return fallback;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  warn('Blocked unsafe redirect', raw);
  return fallback;
}
