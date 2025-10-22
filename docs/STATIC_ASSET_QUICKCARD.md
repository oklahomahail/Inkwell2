# Static Asset Quick Verification Card

## Quick Verification (1-2 minutes)

1. **Network Tab (DevTools)**
   - Load app, filter for `.js` and `.css`
   - ✅ Status: 200, Content-Type: application/javascript or text/css
   - ❌ Status: 302 or Content-Type: text/html

2. **Service Worker**
   - Check `/registerSW.js` has Content-Type: application/javascript
   - Application > Service Workers tab: Status should be Activated/Running
   - ❌ Warning signs: Redundant/Failed or Multiple registrations

3. **HTML-only guarded test**
   - Visit `/assets/[any-file].js` or `/images/[any-file]` directly
   - ✅ Shows file content or download dialog
   - ❌ Redirects to /sign-in (middleware intercept)

## CLI One-liners

```bash
# JS/CSS served as the right type
curl -I https://inkwell.leadwithnexus.com/assets/index-*.js
curl -I https://inkwell.leadwithnexus.com/assets/index-*.css

# SW + manifest
curl -I https://inkwell.leadwithnexus.com/registerSW.js
curl -I https://inkwell.leadwithnexus.com/site.webmanifest
```

Look for:

- JS: Content-Type: application/javascript
- CSS: Content-Type: text/css
- Manifest: Content-Type: application/manifest+json

## Caching Headers

- HTML/doc navigations: Cache-Control: no-store (or short max-age)
- Static assets: Cache-Control: public, max-age=31536000, immutable
- SW/manifest: max-age=86400 (1 day) or similar

## PWA Sanity Check

- Validate site.webmanifest is valid JSON (no trailing commas/comments)
- Application > Service Workers: one active SW, correct scope (/)
- No duplicate registrations

## Prevent Regressions

- **Middleware**: Keep Accept: text/html check and static path exclusions
- **Rewrites**: Asset rewrites first, SPA catch-all last
- **CI**: Run the static asset validation workflow
- **Post-deploy**: Run verification script:

```bash
./scripts/verify_deployment.sh inkwell.leadwithnexus.com
```

## If Something Looks Off

- Clear SW + cache: Application → Unregister SW → Hard reload
- Check headers with `curl -I https://inkwell.leadwithnexus.com/path/with/issue`
- Temporarily bypass middleware (early return NextResponse.next())
