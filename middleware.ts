import { authMiddleware, createRouteMatcher } from '@clerk/nextjs';

const isPublic = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/favicon.ico',
  '/robots.txt',
  '/site.webmanifest',
  '/_next/(.*)',
  '/images/(.*)',
  '/assets/(.*)',
  '/fonts/(.*)',
  '/static/(.*)',
]);

export default authMiddleware({
  publicRoutes: isPublic,
});

export const config = {
  matcher: ['/((?!api/webhooks|.*\\..*).*)'],
};
