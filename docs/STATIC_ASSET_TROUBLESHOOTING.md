# Static Asset Routing Troubleshooting Guide

## Symptoms of Static Asset Routing Problems

When static assets are incorrectly intercepted by middleware or rewrites, you'll typically see:

1. **Browser Console Errors**:
   - `Failed to load module script ... MIME type ''`
   - `Refused to apply style ... MIME type ('')`
   - `React did not mount after 1000ms`
   - `Failed to register a ServiceWorker: TypeError: Failed to fetch`

2. **Network Tab Issues**:
   - JS/CSS files showing Status 200/302 but Content-Type is empty or `text/html`
   - Redirects to `/sign-in` when requesting static assets
   - Service Worker registration failing

## How to Verify Correct Configuration

### DevTools Network Tab

1. Open Chrome DevTools (F12 or Cmd+Option+I on Mac)
2. Select the Network tab
3. Reload the page (Cmd+R)
4. Filter for JS files:
   - Look for any `.js` file
   - Click on it
   - In the Headers tab, ensure Content-Type is `application/javascript`
   - Status should be 200, not 302
   - If Status is 302 and redirects to `/sign-in`, your middleware is intercepting static assets

### Direct Asset Verification

Try accessing a static asset URL directly:

```
https://inkwell.leadwithnexus.com/assets/index-[hash].js
https://inkwell.leadwithnexus.com/registerSW.js
```

If you're redirected to `/sign-in`, your middleware is incorrectly intercepting these requests.

### Using Our Verification Script

Use our provided script to automatically check multiple asset types:

```bash
./scripts/verify_deployment.sh inkwell.leadwithnexus.com
```

## Configuration Best Practices

### 1. Middleware Configuration

The middleware should:

- Only apply to HTML document navigations using the Accept header
- Explicitly skip paths for static assets
- Use a matcher pattern to exclude static asset paths entirely

```typescript
// Good middleware.ts example
export const config = {
  matcher: [
    // Match all paths that are NOT static assets or API routes
    '/((?!api|assets|.*\\.(js|css|png|jpg|jpeg|svg|ico|webp)).*)',
  ],
};

export default function middleware(request: Request) {
  // Additional static asset check
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|svg|ico|webp)$/.test(request.url);
  if (isStaticAsset) return;

  // Middleware logic for HTML routes only...
}
```

### 2. Vercel Rewrites

Rewrites should:

- Handle static assets first (before any catch-all)
- Include explicit paths for key files like `registerSW.js`
- Use a more specific catch-all for HTML navigation

```json
"rewrites": [
  { "source": "/assets/:path*", "destination": "/assets/:path*" },
  { "source": "/registerSW.js", "destination": "/registerSW.js" },
  { "source": "/:path*.js", "destination": "/:path*.js" },
  { "source": "/:path*.css", "destination": "/:path*.css" },
  { "source": "/:path*", "destination": "/index.html" }
]
```

## Quick Fixes for Common Issues

### Service Worker Not Loading

If `registerSW.js` is returning HTML or status 302:

1. Check the Content-Type header for `/registerSW.js`
2. Ensure it's in `/public` directory
3. Add an explicit rewrite for it
4. Ensure middleware isn't catching it

### JS/CSS Files Loading as HTML

If your JS/CSS files are returning HTML:

1. Check vercel.json catch-all rewrite (should exclude static assets)
2. Verify middleware isn't catching them
3. Use `curl -I` to see exact headers
4. Try bypassing middleware temporarily

### HTTP Headers to Set

For optimal performance, set these headers:

```json
"headers": [
  {
    "source": "/assets/(.*)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  },
  {
    "source": "/(.*\\.html|/)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "no-store, must-revalidate"
      }
    ]
  },
  {
    "source": "/site.webmanifest",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/manifest+json"
      }
    ]
  }
]
```

## Advanced Debugging

If issues persist:

1. Temporarily disable middleware (return early with `NextResponse.next()`)
2. Check for conflicting headers in Vercel dashboard
3. Use a production-like environment for testing
4. Try `curl` with `--verbose` to see full request/response cycle
5. Test with the Network tab in "Disable cache" mode

Remember: The goal is to ensure static assets bypass middleware and are served with the correct Content-Type headers.
