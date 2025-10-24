export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (any path containing a dot followed by characters)
     * The trailing .* after the lookahead consumes the actual path
     */
    '/(?:(?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
};
