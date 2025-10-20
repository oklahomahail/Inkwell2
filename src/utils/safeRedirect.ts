// Centralize logic so tests are consistent everywhere.
export function normalizeSafeRedirect(
  raw: string | null | undefined,
  warn: (msg: string, value?: unknown) => void = console.warn,
  fallback = '/dashboard',
): string {
  if (!raw) return fallback;

  // Allow only root-relative paths like "/foo" (with optional ?query and #hash)
  const isRootRelative = raw.startsWith('/') && !raw.startsWith('//');

  if (isRootRelative) {
    try {
      const u = new URL(raw, 'http://local.test'); // dummy base
      // Preserve path + query + hash
      const normalized = `${u.pathname}${u.search}${u.hash}`;
      return normalized || fallback;
    } catch {
      warn('Blocked unsafe redirect', raw);
      return fallback;
    }
  }

  // Absolute/protocol-relative/anything else → warn + fallback
  warn('Blocked unsafe redirect', raw);
  return fallback;
}
