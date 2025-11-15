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

  // Skip API routes, auth callbacks, Next.js internals, favicon, and any file with an extension
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/callback') || // allow auth callback to process
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

  // Host-based redirect: migrate from old domain to new domain
  // During transition period, redirect old domain to new domain
  if (hostname === 'inkwell.leadwithnexus.com') {
    const newUrl = new URL(request.url);
    newUrl.hostname = 'writewithinkwell.com';
    return Response.redirect(newUrl.href, 301); // Permanent redirect
  }

  // Redirect root to sign-in for new domain
  if (hostname === 'writewithinkwell.com' && pathname === '/') {
    return Response.redirect(new URL('/sign-in', request.url), 308);
  }

  // Allow auth pages to render normally
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return; // pass through
  }

  // Default: pass through (no redirect needed)
  return;
}
