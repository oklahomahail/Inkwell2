# Domain Migration Guide

## Moving from inkwell.leadwithnexus.com → writewithinkwell.com

**Status:** ✅ Code Ready for Deployment
**Migration Strategy:** Gradual transition with 60-day overlap
**Last Updated:** November 15, 2025

---

## Overview

This document outlines the complete migration from `inkwell.leadwithnexus.com` to `writewithinkwell.com`. All code changes are complete and ready for deployment.

### Migration Strategy: Option A (Gradual - Recommended)

1. Deploy code with both domains supported
2. Run both domains in parallel for 30 days
3. Add banner on old domain: "We've moved to writewithinkwell.com"
4. Monitor analytics for traffic shift
5. After 30 days, implement 301 redirects
6. After 60 days, sunset old domain

---

## Code Changes Summary

### ✅ Core Files Updated

- [x] `index.html` - Canonical URL, Open Graph, Twitter Cards (4 URLs)
- [x] `public/robots.txt` - Comment and sitemap reference (2 URLs)
- [x] `public/sitemap.xml` - All page locations (3 URLs)
- [x] `middleware.ts` - Host-based redirect logic
- [x] `src/utils/storage/originGuard.ts` - Production origin detection
- [x] `vite.config.ts` - Service worker cache version bump
- [x] `vercel.json` - Added 301 redirect configuration

### ✅ Test Files Updated

- [x] `src/components/Storage/__tests__/StorageHealthWidget.test.tsx`
- [x] `src/utils/storage/__tests__/storageHealth.comprehensive.test.ts`

### ✅ Documentation Updated

- [x] `docs/DEPLOYMENT.md` - Production URL references
- [x] `scripts/setup-supabase.sh` - Auth redirect URLs

### ✅ New Components Created

- [x] `src/components/DomainMigrationBanner.tsx` - User-facing migration notice
- [x] Integrated into `src/App.tsx`

---

## Pre-Deployment Checklist

### 1. Vercel Configuration

**In Vercel Dashboard → Project Settings:**

- [ ] Add `writewithinkwell.com` to project domains
- [ ] Add `www.writewithinkwell.com` to project domains
- [ ] Set `writewithinkwell.com` as **Primary Domain**
- [ ] Update environment variables (Production only):
  ```
  VITE_BASE_URL=https://writewithinkwell.com
  ```

### 2. DNS Configuration (Porkbun)

- [ ] Verify `writewithinkwell.com` ownership
- [ ] Add DNS records:
  ```
  Type    Host    Value
  CNAME   www     cname.vercel-dns.com
  A       @       76.76.21.21
  ```
- [ ] Wait for DNS propagation (~5-60 minutes)

### 3. Supabase Configuration

**In Supabase Dashboard → Authentication → URL Configuration:**

**Site URL:**

```
https://writewithinkwell.com
```

**Add to Redirect URLs:**

```
https://writewithinkwell.com/*
https://writewithinkwell.com/auth/callback
https://writewithinkwell.com/auth/update-password
```

**Keep for backward compatibility (30-60 days):**

```
https://inkwell.leadwithnexus.com/*
https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/auth/update-password
```

**Add to Allowed Origins:**

```
https://writewithinkwell.com
https://www.writewithinkwell.com
```

### 4. Sentry Configuration

**In Sentry → Project Settings → Security → Allowed Domains:**

- [ ] Add `writewithinkwell.com`
- [ ] Add `www.writewithinkwell.com`

### 5. Analytics Provider

- [ ] Add `writewithinkwell.com` to allowed domains
- [ ] Update property settings if domain-specific

---

## Deployment Process

### Step 1: Deploy Updated Code

```bash
# Ensure all tests pass
pnpm test

# Build and verify
pnpm build

# Commit changes
git add .
git commit -m "feat: migrate to writewithinkwell.com domain

- Update all hardcoded domain references
- Add 301 redirects in vercel.json and middleware
- Support legacy domain during transition
- Add user-facing migration banner
- Bump service worker cache version

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger deployment
git push origin main
```

### Step 2: Verify Deployment

After Vercel deployment completes:

1. **Test New Domain**
   - [ ] Visit https://writewithinkwell.com
   - [ ] Verify auth flow works (sign in/out)
   - [ ] Create a test project
   - [ ] Verify autosave works
   - [ ] Check service worker registration
   - [ ] Test PWA installation

2. **Test Legacy Domain**
   - [ ] Visit https://inkwell.leadwithnexus.com
   - [ ] Verify migration banner appears
   - [ ] Verify 301 redirect works (check in Network tab)
   - [ ] Test "Go to New Site" button
   - [ ] Test banner dismissal

3. **Test Cross-Origin Storage**
   - [ ] Sign in on old domain
   - [ ] Note projects/data visible
   - [ ] Click migration banner → go to new domain
   - [ ] Verify same auth session (should be logged in)
   - [ ] Note: Local IndexedDB data won't transfer (origin-scoped)

---

## Post-Deployment Monitoring

### Week 1: Monitor Traffic Shift

```bash
# Monitor analytics for:
- Traffic split between domains
- Auth success rates on both domains
- Error rates (especially auth/storage errors)
- User engagement with migration banner
```

**Key Metrics:**

- New domain traffic should grow daily
- Legacy domain traffic should decline
- Auth conversion rates should remain stable
- No increase in error rates

### Week 2-4: Gradual Transition

- Send email to active users about domain change
- Update social media links
- Update any external references (if applicable)
- Monitor support tickets for migration issues

### Day 30: Implement Full Redirects

If traffic has shifted successfully:

- Remove `has` condition from vercel.json redirect (redirect all traffic)
- Remove migration banner code (optional - can keep for a few more weeks)
- Update documentation to remove legacy references

### Day 60: Sunset Legacy Domain

- Remove `inkwell.leadwithnexus.com` from Vercel domains
- Remove from Supabase redirect URLs
- Remove legacy origin support from `originGuard.ts`
- Archive migration banner component

---

## Rollback Procedures

If critical issues arise:

### Immediate Rollback (< 24 hours)

1. In Vercel Dashboard:
   - Set `inkwell.leadwithnexus.com` back as primary domain
   - Revert `VITE_BASE_URL` environment variable

2. Revert commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

### Partial Rollback (24-72 hours)

Keep both domains active but pause migration:

- Remove migration banner (set `isDismissed` to always true)
- Keep both domains in parallel indefinitely
- Investigate issues before resuming

---

## Known Issues & Solutions

### Issue: User loses data when switching domains

**Cause:** IndexedDB is origin-scoped
**Solution:** Expected behavior. Cloud sync (if enabled) will restore data. For local-only users, they need to export from old domain first.

### Issue: Auth session doesn't transfer between domains

**Cause:** Cookies are domain-scoped
**Solution:** User needs to sign in again on new domain. This is expected and by design.

### Issue: PWA needs reinstallation

**Cause:** Service workers are origin-scoped
**Solution:** Users need to reinstall PWA on new domain. The cache version bump ensures clean installation.

---

## Technical Details

### Redirect Logic

**Vercel (vercel.json):**

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://writewithinkwell.com/:path*",
      "permanent": true,
      "has": [{ "type": "host", "value": "inkwell.leadwithnexus.com" }]
    }
  ]
}
```

**Edge Middleware (middleware.ts):**

```typescript
if (hostname === 'inkwell.leadwithnexus.com') {
  const newUrl = new URL(request.url);
  newUrl.hostname = 'writewithinkwell.com';
  return Response.redirect(newUrl.href, 301);
}
```

### Origin Detection

**Production Origin Detection (originGuard.ts):**

```typescript
const EXPECTED_PROD_ORIGIN = 'https://writewithinkwell.com';
const LEGACY_PROD_ORIGIN = 'https://inkwell.leadwithnexus.com'; // During transition
```

---

## Files Changed

### Core Application

- `index.html` - Meta tags and canonical URL
- `middleware.ts` - Host-based redirects
- `src/utils/storage/originGuard.ts` - Origin detection
- `src/App.tsx` - Migration banner integration
- `vercel.json` - 301 redirects

### Assets

- `public/robots.txt` - Sitemap reference
- `public/sitemap.xml` - Page URLs

### Configuration

- `vite.config.ts` - Service worker cache version

### Tests

- `src/components/Storage/__tests__/StorageHealthWidget.test.tsx`
- `src/utils/storage/__tests__/storageHealth.comprehensive.test.ts`

### Documentation

- `docs/DEPLOYMENT.md` - Deployment URL
- `scripts/setup-supabase.sh` - Auth URLs

### New Files

- `src/components/DomainMigrationBanner.tsx` - User migration notice
- `MIGRATION_GUIDE.md` - This file

---

## Support Resources

- **Migration Issues:** Check browser console for errors
- **Auth Problems:** Verify Supabase redirect URLs are configured
- **Data Loss Concerns:** Export projects before switching domains (if local-only)
- **General Questions:** See docs/DEPLOYMENT.md

---

## Success Criteria

✅ Migration is successful when:

- [ ] New domain receives >90% of traffic
- [ ] Auth conversion rates unchanged
- [ ] No increase in error rates
- [ ] User support tickets minimal (<5% of active users)
- [ ] All critical features work on new domain
- [ ] SEO ranking stabilizes (allow 2-4 weeks)

---

_Generated with Claude Code on November 15, 2025_
