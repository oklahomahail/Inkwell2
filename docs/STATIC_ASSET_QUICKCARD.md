# Static Asset Quick Verification Card

## 30-Second Checks

1. **Network Tab (DevTools)**
   - Load app, filter for `.js` and `.css`
   - ✅ Status: 200, Content-Type: application/javascript or text/css
   - ❌ Status: 302 or Content-Type: text/html

2. **Service Worker**
   - Check Application > Service Workers tab
   - ✅ Status: Activated/Running
   - ❌ Status: Redundant/Failed

3. **Direct Asset Access**
   - Visit `/assets/[any-file].js` directly
   - ✅ Shows file content or download dialog
   - ❌ Redirects to sign-in

## CLI Commands

```bash
# Check JS asset
curl -I https://inkwell.leadwithnexus.com/assets/index-[hash].js
# Should show: Content-Type: application/javascript

# Check CSS asset
curl -I https://inkwell.leadwithnexus.com/assets/index-[hash].css
# Should show: Content-Type: text/css

# Check Service Worker
curl -I https://inkwell.leadwithnexus.com/registerSW.js
# Should show: Content-Type: application/javascript

# Check Manifest
curl -I https://inkwell.leadwithnexus.com/site.webmanifest
# Should show: Content-Type: application/manifest+json
```

## Quick Fixes

1. **For middleware issues:**
   - Ensure matcher excludes static paths
   - Add early return for static assets

2. **For rewrite issues:**
   - Put static asset rewrites first
   - Make catch-all more specific

3. **For Service Worker:**
   - Ensure it's in /public
   - Add explicit rewrite

Run verification script:

```bash
./scripts/verify_deployment.sh inkwell.leadwithnexus.com
```

## Regression Guards

- Middleware: Keep Accept: text/html check
- Rewrites: Keep asset-specific rules first
- CI: Run static asset tests
- Post-deploy: Check browser console for errors
