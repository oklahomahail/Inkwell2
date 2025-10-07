// api/edge-auth.ts
export const config = { runtime: 'edge' };

const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/manifest.json',
  '/robots.txt',
  '/sw.js',
  '/workbox-',
  '/assets', // Vite assets
  '/icons', // if you emit any
  '/vite.svg', // default Vite icon if present
  '/health', // health check route
];

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Local dev bypass (optional)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return fetch(req);
  }

  // Allow public routes and static assets through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return fetch(req);
  }

  // Check cookie
  const cookie = getCookie(req.headers.get('cookie') || '', 'inkwell_auth');
  if (cookie === 'ok') {
    return fetch(req);
  }

  // Not authenticated → send to /login with next=…
  const loginUrl = new URL('/login', url.origin);
  loginUrl.searchParams.set('next', pathname + url.search);
  return Response.redirect(loginUrl, 302);
}

function getCookie(cookieHeader: string, key: string) {
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [k, ...rest] = part.split('=');
    if (k === key) return rest.join('=');
  }
  return null;
}
