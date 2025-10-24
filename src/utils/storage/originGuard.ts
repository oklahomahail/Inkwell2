/**
 * Origin Guard Utilities
 * Detects when app is running on unexpected origins (preview URLs, etc.)
 * This helps identify why data might be missing - different origins have different storage
 */

const EXPECTED_PROD_ORIGIN = 'https://inkwell.leadwithnexus.com';
const EXPECTED_DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export interface OriginInfo {
  current: string;
  expected: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isPreview: boolean;
  isUnexpected: boolean;
  warning?: string;
}

/**
 * Get information about the current origin
 */
export function getOriginInfo(): OriginInfo {
  const current = window.location.origin;
  const isProduction = current === EXPECTED_PROD_ORIGIN;
  const isDevelopment = EXPECTED_DEV_ORIGINS.includes(current);
  const isPreview = current.includes('vercel.app') || current.includes('preview');
  const isUnexpected = import.meta.env.PROD && !isProduction;

  let warning: string | undefined;

  if (isUnexpected) {
    warning = `Running on unexpected origin: ${current}. Local data will be different from production at ${EXPECTED_PROD_ORIGIN}`;
  } else if (isPreview) {
    warning = `Running on preview deployment: ${current}. Each preview has its own isolated storage.`;
  }

  return {
    current,
    expected: import.meta.env.PROD
      ? EXPECTED_PROD_ORIGIN
      : (EXPECTED_DEV_ORIGINS[0] ?? 'http://localhost:5173'),
    isProduction,
    isDevelopment,
    isPreview,
    isUnexpected,
    warning,
  };
}

/**
 * Warn if running on a different origin than expected
 * Call this at app boot in development
 */
export function warnIfDifferentOrigin(): void {
  const info = getOriginInfo();

  if (info.warning) {
    console.warn(`[Inkwell Origin Guard] ${info.warning}`);
  }

  if (import.meta.env.DEV) {
    console.log('[Inkwell Origin Info]', {
      current: info.current,
      expected: info.expected,
      isProduction: info.isProduction,
      isDevelopment: info.isDevelopment,
      isPreview: info.isPreview,
    });
  }
}

/**
 * Get a user-friendly explanation of origin-based storage
 */
export function getOriginStorageExplanation(originInfo: OriginInfo): string {
  if (originInfo.isPreview) {
    return `You're on a preview deployment (${originInfo.current}). Each preview has its own separate storage. Data saved here won't appear on ${originInfo.expected}.`;
  }

  if (originInfo.isUnexpected && originInfo.isProduction) {
    return `This appears to be a production build, but it's running on ${originInfo.current} instead of ${originInfo.expected}. Storage is isolated per origin.`;
  }

  return `Your data is stored locally in your browser for ${originInfo.current}. Switching to a different URL will show different data.`;
}

/**
 * Check if we should show an origin warning to the user
 */
export function shouldShowOriginWarning(): boolean {
  const info = getOriginInfo();
  return info.isUnexpected || info.isPreview;
}
