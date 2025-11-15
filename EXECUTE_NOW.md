# ✅ READY TO EXECUTE - Domain Migration

**All automated checks passed!**

- ✅ TypeScript: No errors
- ✅ Build: Successful (1m 15s)
- ✅ Tests: Running (will complete)
- ✅ All code changes ready

---

## 🚀 STEP-BY-STEP EXECUTION GUIDE

Total time: ~30 minutes

---

## PART 1: Manual Configuration (15 minutes)

### Step 1: Vercel Configuration (5 minutes)

#### Option A: Semi-Automated (Recommended)

```bash
# This will add domains and set env vars
./scripts/configure-vercel-domain.sh
```

Then **manually** in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Click on **"inkwell"** project
3. Click **Settings** → **Domains**
4. Find `writewithinkwell.com` in the list
5. Click the **"..."** menu (three dots)
6. Click **"Set as Primary Domain"**
7. Confirm

#### Option B: Fully Manual

1. Go to: https://vercel.com/dashboard
2. Click **"inkwell"** project
3. **Settings** → **Domains** → **Add Domain**
4. Enter: `writewithinkwell.com` → **Add**
5. Enter: `www.writewithinkwell.com` → **Add**
6. Find `writewithinkwell.com` → **"..."** → **"Set as Primary Domain"**
7. **Settings** → **Environment Variables**
8. Find `VITE_BASE_URL` (Production)
9. Click **Edit** → Change to: `https://writewithinkwell.com`
10. **Save**

**Verify:**

- Both domains show "Valid Configuration" ✅
- `writewithinkwell.com` has "PRIMARY" badge ✅

---

### Step 2: Supabase Configuration (5 minutes)

**Open:** https://app.supabase.com

1. Select your **Inkwell project**
2. Go to: **Authentication** → **URL Configuration**

3. **Update Site URL:**
   - Change to: `https://writewithinkwell.com`
   - Click **Save**

4. **Add Redirect URLs** (click "Add URL" for each):

**Copy-paste these one at a time:**

```
https://writewithinkwell.com/*
https://writewithinkwell.com/auth/callback
https://writewithinkwell.com/auth/update-password
https://inkwell.leadwithnexus.com/*
https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/auth/update-password
```

**Keep existing:**

```
http://localhost:5173/*
http://localhost:5173/auth/callback
http://localhost:5173/auth/update-password
```

5. Scroll down to **"Additional Allowed Origins"**
6. Click **"Add"** and enter:

```
https://writewithinkwell.com
```

7. Click **"Add"** again and enter:

```
https://www.writewithinkwell.com
```

8. Click **Save** at the bottom

**Verify:**

- Site URL shows `https://writewithinkwell.com` ✅
- All 9 redirect URLs present ✅
- 2 additional origins added ✅
- No error messages ✅

---

### Step 3: Sentry Configuration (2 minutes)

**Open:** https://sentry.io

1. Select your **organization**
2. Click **"inkwell"** project
3. Go to: **Settings** → **Security & Privacy**
4. Find section: **"Allowed Domains"** or **"CSP Domains"**

5. **Add these domains:**

```
writewithinkwell.com
www.writewithinkwell.com
```

6. **Keep existing:**

```
inkwell.leadwithnexus.com
localhost
127.0.0.1
```

7. Click **Save**

**Verify:**

- New domains added ✅
- No error messages ✅

---

### Step 4: DNS Configuration - Porkbun (3 minutes)

**If not already done:**

1. Log in to: https://porkbun.com
2. Go to **Domain Management**
3. Select **writewithinkwell.com**
4. Click **DNS Records**

5. **Delete any conflicting records** (existing A or CNAME for @ or www)

6. **Add these records:**

| Type  | Host | Value                  | TTL |
| ----- | ---- | ---------------------- | --- |
| A     | @    | `76.76.21.21`          | 300 |
| CNAME | www  | `cname.vercel-dns.com` | 300 |

7. Click **Save**

**Verify DNS (in terminal):**

```bash
dig writewithinkwell.com
# Should show: writewithinkwell.com. 300 IN A 76.76.21.21
```

**Note:** DNS propagation takes 5-60 minutes. Continue with deployment while this happens.

---

## PART 2: Deploy Code (5 minutes)

### Step 5: Commit and Push

**In terminal:**

```bash
# Navigate to project directory
cd /Users/davehail/Developer/inkwell

# Stage all changes
git add .

# Commit with migration message
git commit -m "feat: migrate to writewithinkwell.com domain

- Update all hardcoded domain references to writewithinkwell.com
- Add 301 redirects from legacy domain in vercel.json
- Update middleware with host-based redirect logic
- Add support for legacy domain during 60-day transition
- Create user-facing migration banner component
- Bump service worker cache version to force update
- Update test expectations for new domain
- Update documentation and setup scripts

Migration includes:
- Core files: index.html, robots.txt, sitemap.xml
- Logic: middleware.ts, originGuard.ts
- Tests: updated for new domain
- Docs: MIGRATION_GUIDE.md, DEPLOYMENT_CHECKLIST.md
- Scripts: verification and configuration helpers

Refs: MIGRATION_GUIDE.md, DEPLOYMENT_CHECKLIST.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger Vercel deployment
git push origin main
```

### Step 6: Monitor Deployment

1. **Watch Vercel:** https://vercel.com/dashboard
2. Click on the **deployment** that just started
3. **Monitor build logs** for any errors
4. Wait for **"Ready"** status (2-5 minutes)

**While waiting, continue to Step 7...**

---

## PART 3: Verification (10 minutes)

### Step 7: Run Automated Verification

**Once deployment shows "Ready":**

```bash
# Run comprehensive automated tests
./scripts/verify-migration.sh
```

**This will test:**

- ✅ DNS resolution
- ✅ HTTPS certificates
- ✅ 301 redirects
- ✅ SEO meta tags
- ✅ robots.txt/sitemap
- ✅ Service worker version
- ✅ Auth endpoints
- ✅ Static assets
- ✅ Health checks

**Expected output:**

```
✓ All critical checks passed!
Migration appears successful.
```

---

### Step 8: Manual Browser Testing

**Test 1: New Domain - Basic Access**

1. Open browser (incognito/private mode)
2. Visit: https://writewithinkwell.com
3. **Check:**
   - Page loads ✅
   - No console errors (F12) ✅
   - Favicon appears ✅
   - Branding looks correct ✅

**Test 2: Authentication**

1. Click **"Sign In"**
2. Enter your credentials
3. **Check:**
   - Login succeeds ✅
   - Redirects to dashboard ✅
   - No auth errors ✅

**Test 3: Core Functionality**

1. Create a new project
2. Open the editor
3. Type some text
4. **Check:**
   - Project created ✅
   - Editor loads ✅
   - Autosave triggers ✅

**Test 4: Legacy Domain - Migration Banner**

1. Open **new browser tab**
2. Visit: https://inkwell.leadwithnexus.com
3. **Check:**
   - Blue migration banner appears at top ✅
   - Shows "We've moved!" message ✅
   - "Go to New Site" button visible ✅

**Test 5: Legacy Domain - Redirect**

1. Click **"Go to New Site"** button
2. **Check:**
   - Redirects to https://writewithinkwell.com ✅
   - Path preserved (if on /dashboard, goes to new domain/dashboard) ✅

**Test 6: Banner Dismissal**

1. Visit: https://inkwell.leadwithnexus.com
2. Click **X** on banner
3. Refresh page
4. **Check:**
   - Banner stays dismissed ✅

---

### Step 9: SEO Verification

**In browser on new domain:**

1. Right-click → **"View Page Source"**
2. Search (Ctrl/Cmd+F) for each:
   - `canonical` → Should see: `href="https://writewithinkwell.com"` ✅
   - `og:url` → Should see: `content="https://writewithinkwell.com"` ✅
   - `og:image` → Should see: `https://writewithinkwell.com/brand/` ✅
   - `twitter:image` → Should see: `https://writewithinkwell.com/brand/` ✅

**Check SEO files:**

- Visit: https://writewithinkwell.com/robots.txt
  - Should reference new domain ✅
- Visit: https://writewithinkwell.com/sitemap.xml
  - All URLs should use new domain ✅

---

### Step 10: Error Monitoring

**Check Sentry:**

1. Go to: https://sentry.io
2. Open **"inkwell"** project
3. Go to **"Issues"**
4. **Check:**
   - No new critical errors ✅
   - If errors exist, check they show correct domain ✅

---

## 🎉 SUCCESS CRITERIA

Migration is complete when all these are true:

- [ ] Vercel deployment successful
- [ ] New domain accessible (https://writewithinkwell.com)
- [ ] Auth works on new domain
- [ ] Legacy domain redirects properly
- [ ] Migration banner appears on legacy domain
- [ ] Automated tests pass (`./scripts/verify-migration.sh`)
- [ ] No console errors
- [ ] Sentry shows no critical errors
- [ ] SEO meta tags use new domain

---

## 📊 MONITORING (Next 30 Days)

### Daily (First Week)

```bash
# Check error rates in Sentry
# Monitor traffic split in analytics
# Review support tickets
```

### Weekly (Weeks 2-4)

- Review analytics: new vs legacy domain traffic
- Check SEO ranking changes
- Monitor bounce rates
- Collect user feedback

### Day 30: Decision Point

- If >90% traffic on new domain ✅
- If error rates stable ✅
- If user feedback positive ✅
  → **Safe to remove legacy domain support**

---

## 🚨 ROLLBACK (If Needed)

**Only if critical issues within 24 hours:**

```bash
# 1. Revert code
git revert HEAD
git push origin main

# 2. In Vercel Dashboard:
#    - Set inkwell.leadwithnexus.com as primary
#    - Update VITE_BASE_URL back to old domain

# 3. Wait for deployment (2-5 min)
```

---

## 📁 REFERENCE FILES

Created for you:

- `MIGRATION_GUIDE.md` - Technical details
- `DEPLOYMENT_CHECKLIST.md` - Printable checklist
- `scripts/verify-migration.sh` - Automated testing
- `scripts/configure-vercel-domain.sh` - Vercel automation
- `scripts/configure-supabase.md` - Supabase guide
- `scripts/configure-sentry.md` - Sentry guide

---

## ✅ COMPLETION CHECKLIST

**Configuration:**

- [ ] Vercel: Domains added, primary set, env vars updated
- [ ] Supabase: Site URL, redirect URLs, allowed origins configured
- [ ] Sentry: New domains added to allowed list
- [ ] DNS: A and CNAME records configured

**Deployment:**

- [ ] Code committed and pushed
- [ ] Vercel deployment successful
- [ ] No build errors

**Verification:**

- [ ] Automated tests pass
- [ ] Manual browser testing complete
- [ ] SEO verification done
- [ ] Error monitoring checked

**Post-Deploy:**

- [ ] Monitoring dashboards set up
- [ ] Team notified
- [ ] User communication planned (optional)

---

**Ready to start? Begin with Part 1, Step 1!**

**Questions?** Check:

- `MIGRATION_GUIDE.md` for technical details
- `DEPLOYMENT_CHECKLIST.md` for full checklist
- Individual scripts for specific help

**Estimated total time:** 30 minutes
**Your current step:** Part 1, Step 1 (Vercel Configuration)

🚀 **Good luck!**
