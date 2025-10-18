import { match } from 'path-to-regexp';

const publicPaths = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/favicon.ico',
  '/robots.txt',
  '/site.webmanifest',
  '/assets/(.*)',
  '/images/(.*)',
  '/fonts/(.*)',
  '/static/(.*)',
  '/*.css',
  '/*.js',
  '/*.map',
  '/*.json',
  '/_next/(.*)',
];

// Create matcher functions for each path pattern
const publicPathMatchers = publicPaths.map((path) => match(path, { end: false }));

export const isPublicRoute = (path: string): boolean => {
  return publicPathMatchers.some((matcher) => matcher(path) !== null);
};
