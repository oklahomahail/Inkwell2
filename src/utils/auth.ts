import { createRouteMatcher } from '@clerk/clerk-react';

export const isPublicRoute = createRouteMatcher([
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
]);
