// Simple string matching for public routes - no regex needed
const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
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

  // Check path prefixes (e.g., /sign-in/something, /assets/something)
  if (
    path.startsWith('/sign-in') ||
    path.startsWith('/sign-up') ||
    publicPrefixes.some((prefix) => path.startsWith(prefix))
  ) {
    return true;
  }

  // Check file extensions
  if (publicExtensions.some((ext) => path.endsWith(ext))) {
    return true;
  }

  return false;
};
