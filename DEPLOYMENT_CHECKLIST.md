# Domain Migration Deployment Checklist

**Status:** Ready to deploy
**Estimated Time:** 30-45 minutes
**Date:** ******\_******

---

## Pre-Flight Checks ✈️

### Local Verification

- [ ] All tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Git working tree is clean

### Code Review

- [ ] Review `MIGRATION_GUIDE.md` for understanding
- [ ] Verify all domain references updated
- [ ] Check migration banner component works locally
- [ ] Test redirects in middleware logic

---

## Step 1: Configure External Services (30 minutes)

### 1.1 Vercel Configuration (10 minutes)

**Option A: Using CLI (Automated)**

```bash
./scripts/configure-vercel-domain.sh
```

**Option B: Manual (via Dashboard)**

1. - [ ] Go to https://vercel.com/dashboard
2. - [ ] Select "inkwell" project
3. - [ ] Navigate to Settings → Domains
4. - [ ] Click "Add Domain"
5. - [ ] Enter: `writewithinkwell.com`
6. - [ ] Click "Add Domain"
7. - [ ] Enter: `www.writewithinkwell.com`
8. - [ ] Click "Add Domain"
9. - [ ] Find `writewithinkwell.com` in list → Click "..." → "Set as Primary Domain"
10. - [ ] Go to Settings → Environment Variables
11. - [ ] Update `VITE_BASE_URL` (Production):
    - Value: `https://writewithinkwell.com`

**Verification:**

- [ ] Both domains show "Valid Configuration" status
- [ ] `writewithinkwell.com` marked as primary
- [ ] Environment variable updated

---

### 1.2 DNS Configuration - Porkbun (5 minutes)

**If not already done:**

1. - [ ] Log in to Porkbun
2. - [ ] Navigate to domain management for `writewithinkwell.com`
3. - [ ] Delete any conflicting A or CNAME records
4. - [ ] Add records:

   | Type  | Host | Value                | TTL |
   | ----- | ---- | -------------------- | --- |
   | CNAME | www  | cname.vercel-dns.com | 300 |
   | A     | @    | 76.76.21.21          | 300 |

5. - [ ] Save changes
6. - [ ] Verify DNS with: `dig writewithinkwell.com`

**Expected Output:**

```
writewithinkwell.com. 300 IN A 76.76.21.21
```

**Verification:**

- [ ] DNS records created
- [ ] Propagation started (may take 5-60 minutes)

---

### 1.3 Supabase Configuration (10 minutes)

**Follow guide:** `scripts/configure-supabase.md`

1. - [ ] Navigate to Supabase Dashboard → Auth → URL Configuration
2. - [ ] Update Site URL to: `https://writewithinkwell.com`
3. - [ ] Add Redirect URLs:
   - [ ] `https://writewithinkwell.com/*`
   - [ ] `https://writewithinkwell.com/auth/callback`
   - [ ] `https://writewithinkwell.com/auth/update-password`
   - [ ] `https://inkwell.leadwithnexus.com/*` (legacy)
   - [ ] `https://inkwell.leadwithnexus.com/auth/callback` (legacy)
   - [ ] `https://inkwell.leadwithnexus.com/auth/update-password` (legacy)
4. - [ ] Add Additional Allowed Origins:
   - [ ] `https://writewithinkwell.com`
   - [ ] `https://www.writewithinkwell.com`
5. - [ ] Click "Save"

**Verification:**

- [ ] No validation errors shown
- [ ] All URLs saved correctly
- [ ] Both domains present in configuration

---

### 1.4 Sentry Configuration (5 minutes)

**Follow guide:** `scripts/configure-sentry.md`

1. - [ ] Navigate to Sentry → Settings → Security Headers
2. - [ ] Add Allowed Domains:
   - [ ] `writewithinkwell.com`
   - [ ] `www.writewithinkwell.com`
3. - [ ] Save changes

**Verification:**

- [ ] Domains added successfully
- [ ] No error messages

---

## Step 2: Deploy Code (10 minutes)

### 2.1 Final Code Review

- [ ] Review all changed files in git
- [ ] Verify migration banner component included
- [ ] Check vercel.json redirects
- [ ] Verify middleware logic

### 2.2 Commit and Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: migrate to writewithinkwell.com domain

- Update all hardcoded domain references to writewithinkwell.com
- Add 301 redirects from legacy domain in vercel.json
- Update middleware with host-based redirect logic
- Add support for legacy domain during 60-day transition
- Create user-facing migration banner component
- Bump service worker cache version to force update
- Update test expectations for new domain
- Update documentation and setup scripts

Refs: MIGRATION_GUIDE.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger Vercel deployment
git push origin main
```

### 2.3 Monitor Deployment

1. - [ ] Watch Vercel deployment: https://vercel.com/dashboard
2. - [ ] Check build logs for errors
3. - [ ] Wait for "Ready" status
4. - [ ] Note deployment URL

**Estimated Deploy Time:** 2-5 minutes

---

## Step 3: Post-Deployment Verification (15 minutes)

### 3.1 New Domain - Core Functionality

**Visit:** https://writewithinkwell.com

- [ ] Page loads without errors
- [ ] No JavaScript console errors (F12)
- [ ] Service worker registers successfully
- [ ] Favicon and branding appear correctly

### 3.2 Authentication Flow

1. - [ ] Click "Sign In"
2. - [ ] Enter test credentials
3. - [ ] Verify successful login
4. - [ ] Check auth session persists (refresh page)
5. - [ ] Test logout
6. - [ ] Test password reset flow (send email, click link)

### 3.3 Core Features

- [ ] Create new project
- [ ] Open existing project
- [ ] Write in editor (type some text)
- [ ] Verify autosave triggers
- [ ] Check analytics panel loads
- [ ] Test chapter/section navigation

### 3.4 PWA Installation

- [ ] Open browser menu
- [ ] Look for "Install Inkwell" option
- [ ] Install PWA
- [ ] Open from installed app
- [ ] Verify works as standalone app

### 3.5 Legacy Domain - Migration Flow

**Visit:** https://inkwell.leadwithnexus.com

- [ ] Page loads
- [ ] Migration banner appears at top
- [ ] Banner shows correct messaging
- [ ] Click "Go to New Site" button
- [ ] Redirects to https://writewithinkwell.com
- [ ] Path preserved (e.g., /dashboard → writewithinkwell.com/dashboard)

**Test Banner Dismissal:**

- [ ] Visit legacy domain again
- [ ] Click "X" to dismiss banner
- [ ] Refresh page
- [ ] Banner stays dismissed
- [ ] Clear localStorage
- [ ] Banner reappears

### 3.6 Redirect Verification

**Test these URLs redirect correctly:**

| From (Legacy)                                   | To (New)                                   | Status |
| ----------------------------------------------- | ------------------------------------------ | ------ |
| https://inkwell.leadwithnexus.com/              | https://writewithinkwell.com/sign-in       | [ ]    |
| https://inkwell.leadwithnexus.com/dashboard     | https://writewithinkwell.com/dashboard     | [ ]    |
| https://inkwell.leadwithnexus.com/auth/callback | https://writewithinkwell.com/auth/callback | [ ]    |

**Use browser Network tab:**

- [ ] Verify 301 (Permanent Redirect) status codes
- [ ] Check redirect happens server-side (not client-side)

### 3.7 SEO Verification

**Check meta tags on new domain:**

1. - [ ] Right-click → "View Page Source"
2. - [ ] Verify `<link rel="canonical" href="https://writewithinkwell.com" />`
3. - [ ] Verify Open Graph URL: `<meta property="og:url" content="https://writewithinkwell.com" />`
4. - [ ] Verify og:image and twitter:image use new domain
5. - [ ] Check robots.txt: https://writewithinkwell.com/robots.txt
6. - [ ] Check sitemap: https://writewithinkwell.com/sitemap.xml

### 3.8 Error Monitoring

**Check Sentry:**

1. - [ ] Visit https://sentry.io
2. - [ ] Open inkwell project
3. - [ ] Check for new errors after deployment
4. - [ ] Verify errors show correct domain in context
5. - [ ] Confirm no auth-related errors

---

## Step 4: Monitoring Setup (5 minutes)

### 4.1 Analytics Dashboard

- [ ] Log in to analytics provider
- [ ] Create new segment: "New Domain Traffic"
  - Filter: URL contains `writewithinkwell.com`
- [ ] Create comparison: New vs Legacy domain traffic
- [ ] Set up daily email report

### 4.2 Error Alerts

**In Sentry:**

- [ ] Create alert rule: "High error rate on new domain"
  - Condition: >10 errors in 5 minutes
  - Filter: URL contains `writewithinkwell.com`
  - Action: Email notification

### 4.3 Uptime Monitoring (Optional)

**Using UptimeRobot or similar:**

- [ ] Add monitor: https://writewithinkwell.com/health
- [ ] Check interval: 5 minutes
- [ ] Alert on downtime

---

## Step 5: User Communication (Optional)

### Email to Active Users (Template)

```
Subject: Inkwell Has a New Home - writewithinkwell.com

Hi [Name],

We've got some exciting news! Inkwell has moved to a new domain:

🎉 writewithinkwell.com

What this means for you:
✅ Your data is safe and will transfer automatically
✅ You'll be redirected from the old domain
✅ Please update your bookmarks

What to do:
1. Visit writewithinkwell.com
2. Sign in with your existing credentials
3. Everything will work as before

Why the change?
[Your reason - branding, clarity, etc.]

Questions? Reply to this email or visit our help center.

Thanks for writing with Inkwell!

[Your team]
```

- [ ] Draft email
- [ ] Send to active users
- [ ] Post update on social media
- [ ] Update website footer/about page

---

## Rollback Plan (If Needed)

**If critical issues occur within 24 hours:**

### Immediate Rollback

```bash
# 1. Revert code changes
git revert HEAD
git push origin main

# 2. In Vercel Dashboard:
#    - Set inkwell.leadwithnexus.com as primary domain
#    - Update VITE_BASE_URL back to old domain

# 3. Wait for deployment to complete
```

**Post-Rollback:**

- [ ] Verify old domain works
- [ ] Check auth flow
- [ ] Review error logs
- [ ] Determine root cause
- [ ] Plan remediation

---

## Success Criteria ✅

Migration is successful when:

- [ ] New domain accessible and fully functional
- [ ] Auth works on new domain
- [ ] Legacy domain redirects properly
- [ ] No increase in error rates
- [ ] Migration banner appears and works
- [ ] SEO elements point to new domain
- [ ] All third-party integrations configured
- [ ] Monitoring dashboards set up

---

## Post-Migration Monitoring (Next 30 Days)

### Daily (First Week)

- [ ] Check error rates in Sentry
- [ ] Monitor traffic split (new vs legacy)
- [ ] Review user support tickets
- [ ] Verify auth conversion rates

### Weekly (Weeks 2-4)

- [ ] Review analytics trends
- [ ] Check SEO ranking changes
- [ ] Monitor bounce rates
- [ ] Survey user feedback

### Day 30 Review

- [ ] Assess migration success
- [ ] Decide on timeline for legacy domain sunset
- [ ] Plan removal of legacy support code
- [ ] Document lessons learned

---

## Completion Sign-Off

**Deployed By:** ******\_\_\_******
**Date:** ******\_\_\_******
**Time:** ******\_\_\_******

**Verification:**

- [ ] All checks passed
- [ ] No critical errors
- [ ] Monitoring configured
- [ ] Team notified

**Notes:**

```
[Any observations, issues, or special notes]
```

---

**For detailed technical information, see:** `MIGRATION_GUIDE.md`
**For configuration guides, see:** `scripts/configure-*.md`
