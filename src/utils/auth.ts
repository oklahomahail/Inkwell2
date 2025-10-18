import { match } from 'path-to-regexp';

const publicPaths = [
  '/',
  '/sign-in/:path*',
  '/sign-up/:path*',
  '/favicon.ico',
  '/robots.txt',
  '/site.webmanifest',
  '/assets/:path*',
  '/images/:path*',
  '/fonts/:path*',
  '/static/:path*',
  '/*.css',
  '/*.js',
  '/*.map',
  '/*.json',
  '/_next/:path*',
];

// Create matcher functions for each path pattern
const publicPathMatchers = publicPaths.map((path) => match(path, { end: false }));

export const isPublicRoute = (path: string): boolean => {
  return publicPathMatchers.some((matcher) => matcher(path) !== null);
};
