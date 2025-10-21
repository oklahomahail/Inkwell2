// Simple string matching for public routes - no regex needed
const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/auth/forgot-password',
  '/auth/update-password',
  '/favicon.ico',
  '/robots.txt',
  '/site.webmanifest',
];

const publicPrefixes = ['/assets/', '/images/', '/fonts/', '/static/', '/_next/'];

const publicExtensions = ['.css', '.js', '.map', '.json'];

export const isPublicRoute = (path: string): boolean => {
  // Check exact matches
  if (publicPaths.includes(path)) {
    return true;
  }

  // Check exact auth routes
  if (
    path === '/sign-in' ||
    path === '/sign-up' ||
    path === '/auth/forgot-password' ||
    path === '/auth/update-password' ||
    path === '/auth/callback' // Allow auth callback for magic link and password reset
  ) {
    return true;
  }

  // Check asset prefixes
  if (publicPrefixes.some((prefix) => path.startsWith(prefix))) {
    return true;
  }

  // Check file extensions
  if (publicExtensions.some((ext) => path.endsWith(ext))) {
    return true;
  }

  return false;
};
