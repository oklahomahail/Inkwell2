// Vercel Edge Middleware for host-based redirects
// This file will be loaded automatically by Vercel's Edge platform

export default function middleware(request: Request) {
  // Get hostname (e.g. inkwel.leadwithnexus.com, www.mysite.com, etc.)
  const hostname = request.headers.get('host');
  const url = new URL(request.url);
  const { pathname } = url;

  // Handle specific host redirects
  if (hostname === 'inkwell.leadwithnexus.com' && pathname === '/') {
    return Response.redirect(new URL('/sign-in', request.url), 308);
  }

  // No redirect needed, continue to the destination
  return new Response(null);
}
