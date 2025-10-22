// Vercel Edge Middleware for host-based redirects
// This file will be loaded automatically by Vercel's Edge platform

export const config = {
  // Only apply middleware to HTML document navigations - skip for all static assets
  matcher: [
    // Match all paths that are NOT static assets or API routes
    '/((?!api|_next|assets|brand|icons|logo|.*\\.(js|json|css|png|jpg|jpeg|svg|ico|webp|webmanifest|map|txt)).*)',
  ],
};

export default function middleware(request: Request) {
  // Get hostname (e.g. inkwell.leadwithnexus.com, www.mysite.com, etc.)
  const hostname = request.headers.get('host');
  const url = new URL(request.url);
  const { pathname } = url;

  // Static asset detection (additional protection)
  const isStaticAsset =
    /\.(js|css|png|jpg|jpeg|svg|ico|webp|webmanifest|map|txt|json)$/.test(pathname) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/logo/') ||
    pathname === '/registerSW.js' ||
    pathname === '/sw.js' ||
    pathname.includes('workbox-');

  // Skip middleware for all static assets (fallback protection)
  if (isStaticAsset) {
    return;
  }

  // Handle specific host redirects
  if (hostname === 'inkwell.leadwithnexus.com' && pathname === '/') {
    return Response.redirect(new URL('/sign-in', request.url), 308);
  }

  // Fix for sign-in page rendering issues - don't process these paths
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    // Skip middleware processing for sign-in and sign-up pages
    return;
  }

  // No redirect needed, continue to the destination
  return new Response(null);
}
