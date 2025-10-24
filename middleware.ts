// Vercel Edge Middleware for host-based redirects
// This file will be loaded automatically by Vercel's Edge platform

export const config = {
  // Match everything - exclusions are handled in code (more reliable on Vercel)
  matcher: ['/:path*'],
};

export default function middleware(request: Request) {
  const hostname = request.headers.get('host') ?? '';
  const url = new URL(request.url);
  const { pathname } = url;

  // Skip API routes, Next.js internals, favicon, and any file with an extension
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.') || // any file with an extension (images, fonts, JS, CSS, etc.)
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/logo/') ||
    pathname === '/registerSW.js' ||
    pathname === '/sw.js' ||
    pathname.includes('workbox-')
  ) {
    return; // pass through - no middleware processing
  }

  // Host-based redirect for inkwell.leadwithnexus.com
  if (hostname === 'inkwell.leadwithnexus.com' && pathname === '/') {
    return Response.redirect(new URL('/sign-in', request.url), 308);
  }

  // Allow auth pages to render normally
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return; // pass through
  }

  // Default: pass through (no redirect needed)
  return;
}
