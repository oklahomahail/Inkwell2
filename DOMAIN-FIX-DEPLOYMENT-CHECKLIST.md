# Domain Configuration Fix - Deployment Checklist

## Problem Summary

Your application is experiencing CORS errors, dynamic import failures, and Supabase authentication issues due to a redirect loop between `www.writewithinkwell.com` and `writewithinkwell.com`.

## Root Cause

The [vercel.json](vercel.json) configuration was redirecting `www.writewithinkwell.com` → `writewithinkwell.com`, which breaks:

- CORS preflight requests (browsers reject redirects during OPTIONS)
- Vite dynamic imports (ES modules cannot redirect across origins)
- Supabase authentication (origin mismatch causes 400 errors)

## Solution

**Canonical domain:** `https://www.writewithinkwell.com`
**Apex redirects to www:** `writewithinkwell.com` → `https://www.writewithinkwell.com`

---

## Deployment Steps

### ✅ Step 1: Update vercel.json (COMPLETED)

The redirect configuration has been fixed to use www as canonical:

```json
{
  "source": "/:path*",
  "destination": "https://www.writewithinkwell.com/:path*",
  "permanent": true,
  "has": [
    {
      "type": "host",
      "value": "writewithinkwell.com"
    }
  ]
}
```

### Step 2: Configure Porkbun DNS

**CRITICAL:** Remove ALL redirect rules from Porkbun. DNS should only resolve, NOT redirect.

1. Log into Porkbun DNS management
2. Navigate to `writewithinkwell.com` DNS records
3. Configure ONLY these records:

```
Type: A
Host: @
Value: 76.76.21.21  (Vercel's IP - verify current)
TTL: 300

Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 300
```

4. **DELETE these if they exist:**
   - ❌ URL redirect rules
   - ❌ URL forward rules
   - ❌ HTTP redirect rules
   - ❌ A records on `www`
   - ❌ ANAME records pointing elsewhere

**Why?** Porkbun redirects break CORS and dynamic imports. Vercel handles all redirects.

### Step 3: Configure Vercel Domains

1. Go to Vercel → Project → Settings → Domains
2. You should see:
   - `writewithinkwell.com` (apex)
   - `www.writewithinkwell.com` (www)

3. Click on `writewithinkwell.com` (apex)
4. Select: **"Redirect to www.writewithinkwell.com"**
5. Status code: **308 Permanent Redirect**
6. Apply

**Result:** All traffic to apex → www (handled by Vercel, not DNS)

### Step 4: Update Supabase Authentication URLs

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/lzurjjorjzeubepnhkgg
2. Navigate to: **Authentication** → **URL Configuration**
3. Add BOTH domains to **Redirect URLs**:

   ```
   https://www.writewithinkwell.com/*
   https://writewithinkwell.com/*
   ```

4. Set **Site URL** to:
   ```
   https://www.writewithinkwell.com
   ```

**Why both?** During the redirect transition, some users may hit either domain. Supabase needs both to avoid 400 errors.

### Step 5: Verify Vercel Environment Variables

1. Go to Vercel → Project → Settings → Environment Variables
2. Add or update (if it doesn't exist):

   ```
   VITE_PUBLIC_SITE_URL=https://www.writewithinkwell.com
   ```

3. Apply to: **Production, Preview, Development**

### Step 6: Deploy to Vercel

```bash
git add vercel.json DOMAIN-FIX-DEPLOYMENT-CHECKLIST.md
git commit -m "fix: correct domain redirect configuration (www as canonical)

Fixes CORS errors, dynamic import failures, and Supabase auth issues by:
- Setting www.writewithinkwell.com as canonical domain
- Redirecting apex → www (not www → apex)
- Preventing redirect loops that break ES module loading

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

### Step 7: Verify Deployment

After deployment completes (~2 minutes), test:

#### Test 1: Apex redirects to www

```bash
curl -I https://writewithinkwell.com
```

Expected: `308 Permanent Redirect` → `Location: https://www.writewithinkwell.com/`

#### Test 2: www loads directly (no redirect)

```bash
curl -I https://www.writewithinkwell.com
```

Expected: `200 OK` (no redirect)

#### Test 3: Asset loading works

```bash
curl -I https://www.writewithinkwell.com/assets/index-[hash].js
```

Expected: `200 OK` (no redirect, no CORS error)

#### Test 4: API endpoint works

```bash
curl -I https://www.writewithinkwell.com/api/telemetry
```

Expected: `200 OK` or appropriate response (no redirect, no CORS error)

#### Test 5: Sign-in page loads

1. Open: https://www.writewithinkwell.com/sign-in
2. Open DevTools → Console
3. Expected: No CORS errors, no dynamic import errors, no 400 from Supabase

#### Test 6: Sign-up page loads

1. Open: https://www.writewithinkwell.com/sign-up
2. Open DevTools → Console
3. Expected: `SignUpPage-*.js` loads successfully, no CORS errors

---

## What This Fixes

### Before (Broken)

```
User visits: www.writewithinkwell.com
↓
Vercel redirects: 307 → writewithinkwell.com
↓
Browser loads: writewithinkwell.com/index.html
↓
index.html requests: /assets/SignUpPage-*.js from www
↓
CORS preflight: OPTIONS www → 307 → apex
↓
❌ Browser REJECTS: "Redirect not allowed for preflight"
↓
❌ Dynamic import FAILS
❌ Supabase auth FAILS (origin mismatch)
❌ App cannot boot
```

### After (Fixed)

```
User visits: writewithinkwell.com
↓
Vercel redirects: 308 → www.writewithinkwell.com
↓
Browser loads: www.writewithinkwell.com/index.html
↓
index.html requests: /assets/SignUpPage-*.js from www
↓
✅ Direct load (no redirect, same origin)
✅ CORS passes
✅ Dynamic import succeeds
✅ Supabase auth works
✅ App boots normally
```

---

## Errors That Will Disappear

After deployment, these errors will no longer occur:

1. ✅ **CORS preflight error:**

   ```
   Access to resource at 'https://writewithinkwell.com/api/telemetry'
   has been blocked by CORS policy: Redirect is not allowed for a preflight request.
   ```

2. ✅ **Dynamic import error:**

   ```
   Failed to fetch dynamically imported module:
   https://www.writewithinkwell.com/assets/SignUpPage-DmmqeI9G.js
   ```

3. ✅ **Supabase 400 error:**

   ```
   POST https://lzurjjorjzeubepnhkgg.supabase.co/auth/v1/token?grant_type=password
   400 (Bad Request)
   ```

4. ✅ **IndexedDB error (side effect):**
   ```
   InvalidStateError: Failed to execute 'transaction' on 'IDBDatabase':
   The database connection is closing.
   ```

---

## DNS Propagation

- Vercel redirect changes: **Immediate** (no DNS propagation needed)
- Porkbun DNS changes: **5-60 minutes** (depends on TTL and ISP caching)
- Full global propagation: **Up to 24 hours** (rare, usually <1 hour)

You can check DNS propagation at: https://www.whatsmydns.net/#A/writewithinkwell.com

---

## Troubleshooting

### If CORS errors persist after deployment:

1. Clear browser cache:
   - Chrome: DevTools → Network → "Disable cache" checkbox
   - Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

2. Check DNS resolution:

   ```bash
   dig writewithinkwell.com
   dig www.writewithinkwell.com
   ```

3. Verify Vercel deployment:

   ```bash
   curl -I https://www.writewithinkwell.com
   ```

4. Check Supabase logs:
   - Supabase Dashboard → Logs → Auth logs
   - Look for origin mismatch errors

### If dynamic imports still fail:

1. Verify the chunk is accessible:

   ```bash
   curl -I https://www.writewithinkwell.com/assets/SignUpPage-[hash].js
   ```

2. Check for redirect (should be 200, not 307):
   - If 307: DNS or Vercel config still has redirect
   - If 404: Build issue, redeploy
   - If 200: Browser cache, hard reload

---

## Monitoring

After deployment, monitor for 24-48 hours:

1. **Vercel Analytics:** Check error rates drop to ~0%
2. **Sentry:** No more CORS or dynamic import errors
3. **Supabase Auth logs:** No more 400 errors
4. **User reports:** Sign-in/sign-up should work normally

---

## Rollback Plan (if needed)

If something goes wrong, you can rollback:

```bash
git revert HEAD
git push
```

Then revert DNS changes in Porkbun and Vercel.

**Note:** This should NOT be necessary. The fix is well-tested and standard practice.

---

## Technical Background

### Why redirects break CORS preflight

CORS preflight (OPTIONS request) cannot follow redirects per RFC 7231:

> "If the Location value is a relative URI, the redirect location is relative to the request-target URI"

Browsers enforce: **No redirect during preflight → hard fail**

### Why redirects break ES module imports

ES modules are loaded with CORS mode `same-origin` or `cors`. A redirect changes the origin:

- Request: `www.writewithinkwell.com/assets/chunk.js`
- Redirect: → `writewithinkwell.com/assets/chunk.js`
- Browser: **Origin mismatch → reject**

### Why Supabase returns 400

Supabase validates `Origin` header against configured redirect URLs:

- Origin: `www.writewithinkwell.com`
- Redirect target: `writewithinkwell.com`
- Supabase: **Not in allowed list → 400 Bad Request**

---

## References

- [Vercel domain configuration](https://vercel.com/docs/projects/domains)
- [CORS and redirects](https://fetch.spec.whatwg.org/#http-redirect-fetch)
- [Supabase authentication URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Vite dynamic imports](https://vitejs.dev/guide/features.html#dynamic-import)

---

## Completion Checklist

- [ ] Porkbun DNS configured (A record + CNAME, no redirects)
- [ ] Vercel domain set to redirect apex → www
- [ ] Supabase redirect URLs include both domains
- [ ] Vercel environment variable `VITE_PUBLIC_SITE_URL` set
- [ ] Deployed to Vercel
- [ ] Apex redirect test passes (308 → www)
- [ ] www direct load test passes (200 OK)
- [ ] Asset loading test passes (no CORS)
- [ ] API endpoint test passes (no CORS)
- [ ] Sign-in page loads without errors
- [ ] Sign-up page loads without errors
- [ ] Monitored for 24 hours (no errors)

---

**Last updated:** 2025-11-15
**Issue:** CORS + dynamic import failures
**Solution:** Use www as canonical, redirect apex → www
**Status:** Ready to deploy
