# Static Asset Routing Verification Checklist

This document outlines the verification steps to ensure static assets are correctly served with the proper Content-Type headers and not intercepted by middleware/rewrites.

## Quick Verification (1-2 minutes)

### Network Tab Check

Open browser DevTools > Network tab and reload the application:

- [ ] JS chunks show status 200 and Content-Type: application/javascript
- [ ] CSS chunks show status 200 and Content-Type: text/css
- [ ] No 302 redirects for static assets to /sign-in

### Service Worker Check

- [ ] /registerSW.js loads with Content-Type: application/javascript
- [ ] Service Worker is activated and controlling the page (check Application > Service Workers)

### Direct Asset Access

Verify direct asset URLs bypass middleware and authentication guards:

- [ ] Accessing `/assets/[any-file].js` directly loads the file (not redirected)
- [ ] Accessing `/images/[any-file].png` directly loads the file (not redirected)

## Command-Line Verification (1-2 minutes)

Run these curl commands to verify correct Content-Type headers:

```bash
# JS/CSS served with correct type
curl -I https://inkwell.leadwithnexus.com/assets/index-*.js
curl -I https://inkwell.leadwithnexus.com/assets/index-*.css

# Service Worker and manifest
curl -I https://inkwell.leadwithnexus.com/registerSW.js
curl -I https://inkwell.leadwithnexus.com/site.webmanifest
```

Expected headers:

- JS files: `Content-Type: application/javascript`
- CSS files: `Content-Type: text/css`
- Manifest: `Content-Type: application/manifest+json`

## Cache Header Verification

Check that appropriate caching headers are set:

- HTML/document navigations: `Cache-Control: no-store` or short max-age
- Static assets: `Cache-Control: public, max-age=31536000, immutable`
- Service Worker/manifest: Reasonable max-age (e.g., 1h-1d)

## PWA Validation

- [ ] Validate site.webmanifest is valid JSON (no trailing commas/comments)
- [ ] In DevTools > Application > Service Workers: confirm one active SW
- [ ] Verify correct scope (/) and no duplicate registrations
- [ ] Check Manifest tab for proper loading without errors

## Regression Prevention

### Middleware Guard Rules

Always ensure middleware.ts maintains:

- HTML-only check via Accept header (`Accept: text/html`)
- Static path exclusions (assets, images, etc.)
- File extension exclusions (.js, .css, .png, etc.)

### Vercel Rewrite Rules

Always maintain this order in vercel.json:

1. Asset-specific rewrites first
2. SPA catch-all rewrite last

## Troubleshooting

If issues are detected:

1. Clear Service Worker and cache:
   - Application tab → Service Workers → Unregister
   - Clear Site Data → Hard reload

2. Check Vercel deployment headers for problematic paths:

   ```bash
   curl -I https://inkwell.leadwithnexus.com/path/with/issue
   ```

3. Temporarily bypass middleware to isolate the issue:

   ```typescript
   // In middleware.ts
   export default function middleware(request: Request) {
     return new Response(null); // Bypass all middleware logic
   }
   ```

4. Verify Content-Types in Vercel dashboard:
   - Check Settings → Headers for any conflicting rules
   - Ensure no old output directory caching from previous builds

## CI Integration

Consider adding these Playwright tests:

```typescript
test('Static assets have correct content types', async ({ page, request }) => {
  // Test HTML route
  await page.goto('/sign-in');
  const htmlResponse = await request.get('/sign-in');
  expect(htmlResponse.headers()['content-type']).toContain('text/html');

  // Test CSS asset
  const cssResponse = await request.get('/assets/index-[hash].css');
  expect(cssResponse.headers()['content-type']).toContain('text/css');

  // Test JS asset
  const jsResponse = await request.get('/assets/index-[hash].js');
  expect(jsResponse.headers()['content-type']).toContain('application/javascript');

  // Test Service Worker
  const swResponse = await request.get('/registerSW.js');
  expect(swResponse.headers()['content-type']).toContain('application/javascript');

  // Test manifest
  const manifestResponse = await request.get('/site.webmanifest');
  expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');
});
```

**Note:** This verification should be performed after each deployment, especially if changes were made to middleware.ts or vercel.json.
