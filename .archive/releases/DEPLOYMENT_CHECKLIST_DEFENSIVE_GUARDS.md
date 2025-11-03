---
title: Deployment Checklist - Defensive Guards & Asset Fixes
date: 2025-11-03
status: ✅ READY TO DEPLOY
---

# Deployment Checklist

## ✅ Code Implementation - COMPLETE

### Defensive Guards (`src/tour/utils/layoutGuards.ts`)

- [x] `waitForLayoutSettled()` - Waits for fonts, images, layout
- [x] `observeAnchor()` - ResizeObserver + IntersectionObserver
- [x] `createDebouncedMeasure()` - Throttles rapid measurements
- [x] `recordMeasurement()` - Telemetry for initial position
- [x] `recordAdjustment()` - Telemetry for re-measurements
- [x] `isElementInViewport()` - Viewport detection

### Tour Integration (`src/tour/components/TourOrchestrator.tsx`)

- [x] Import all defensive guards
- [x] Call `waitForLayoutSettled()` on step mount
- [x] Record initial measurement with telemetry
- [x] Set up `observeAnchor()` with debounced re-measure
- [x] Track `tour_step_measured` event
- [x] Track `tour_step_adjusted` event
- [x] Proper cleanup on unmount

### Service Worker Cache (`src/main.tsx`)

- [x] SKIP_WAITING promotion logic implemented
- [x] Controller change listener configured
- [x] Debug logging for SW updates

### Asset Paths

- [x] Updated `index.html` - `/brand/` references
- [x] Updated `src/components/Logo.tsx` - `/brand/` references
- [x] Updated `src/components/Auth/AuthHeader.tsx` - `/brand/` references
- [x] Updated `src/pages/AuthPage.tsx` - `/brand/` references
- [x] Updated `src/pages/ForgotPassword.tsx` - `/brand/` references
- [x] Updated `src/pages/UpdatePassword.tsx` - `/brand/` references
- [x] Moved assets to `public/brand/`
- [x] Removed `public/assets/brand/` directory

### Build Configuration (`vite.config.ts`)

- [x] Removed duplicate `site.webmanifest` entries
- [x] Verified Workbox configuration
- [x] Verified VitePWA settings

## ✅ CI/CD & Regression Prevention - COMPLETE

### GitHub Actions (`.github/workflows/check-asset-paths.yml`)

- [x] Workflow configured to run on PR
- [x] Workflow configured to run on push to main/develop
- [x] Git grep check for `/assets/brand/` paths
- [x] Proper exclusions (node_modules, dist, docs)

### Pre-Commit Hook (`.git/hooks/pre-commit`)

- [x] Hook script created and executable
- [x] Blocks commits with `/assets/brand/` in staged files
- [x] Local developer protection

### Check Script (`scripts/check-asset-paths.sh`)

- [x] Manual verification script for developers
- [x] Scans source files only (excludes docs, node_modules)
- [x] Properly formatted error messages
- [x] Executable and tested

## ✅ Testing & Verification - COMPLETE

### Build Tests

- [x] `npm run build` completes successfully
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] PWA plugin generates correctly

### Asset Verification

- [x] `dist/brand/` contains all 4 brand files
- [x] `dist/site.webmanifest` exists
- [x] `dist/sw.js` generated with precache
- [x] No `/assets/brand/` paths in dist

### Layout Guards Tests

- [x] All utility functions exported correctly
- [x] All functions used in TourOrchestrator
- [x] Analytics events properly integrated
- [x] Telemetry types defined

### Asset Path Checks

- [x] Local check: `./scripts/check-asset-paths.sh` passes
- [x] Git grep check: No forbidden paths detected
- [x] Pre-commit hook: Blocks forbidden paths

### Comprehensive Verification

- [x] All 11 checks in `verify-defensive-guards.sh` pass

## ✅ Documentation - COMPLETE

### Implementation Guides

- [x] `DEFENSIVE_GUARDS_COMPLETE.md` - Full technical documentation
- [x] `DEFENSIVE_GUARDS_USAGE_GUIDE.md` - Drop-in usage patterns
- [x] `BEFORE_AFTER_COMPARISON.md` - What changed
- [x] Code comments and JSDoc in implementations

### Analytics Dashboard

- [x] Event definitions: `tour_step_measured`, `tour_step_adjusted`, `tour_step_out_of_view`
- [x] Expected trends documented (adjustments → ~0)
- [x] Regression indicators defined
- [x] Dashboard setup recommendations provided

### Developer Resources

- [x] Usage guide with complete examples
- [x] Common mistakes and fixes
- [x] Testing procedures documented
- [x] Configuration options documented

## 🚀 Pre-Deployment

### Code Review Checklist

- [ ] Code reviewed by peer
- [ ] No security issues identified
- [ ] Performance impact reviewed (minimal)
- [ ] Accessibility impact reviewed (none)
- [ ] Breaking changes: None ✅

### Documentation Review

- [ ] Deployment guide reviewed
- [ ] API documentation updated (if applicable)
- [ ] Team notified of changes
- [ ] Release notes drafted

### Analytics Setup

- [ ] Telemetry infrastructure ready
- [ ] Event receivers configured
- [ ] Dashboard created for monitoring
- [ ] Alert thresholds set
  - [ ] Alert: tour_step_adjusted count > 5 per session
  - [ ] Alert: tour_step_out_of_view count > 2 per session

### Staging Test

- [ ] Deploy to staging environment
- [ ] Run full tour on staging
- [ ] Verify brand assets load correctly
- [ ] Verify no console errors
- [ ] Monitor telemetry events
- [ ] Check responsive design (mobile, tablet, desktop)

## 📋 Deployment Steps

### 1. Pre-Deployment

```bash
# Final verification
./verify-defensive-guards.sh

# Check build artifacts
npm run build
ls -la dist/brand/
```

### 2. Deployment

```bash
# Deploy to production (your deployment process)
# Example: git push to main, CI/CD triggers
# Example: npm run deploy
```

### 3. Post-Deployment (First Hour)

- [ ] Monitor real-time logs for errors
- [ ] Check browser console for warnings
- [ ] Verify Service Worker updates
- [ ] Spot-check tour functionality

### 4. Post-Deployment (24 Hours)

- [ ] Review telemetry events dashboard
- [ ] Check adjustment trends
  - Expected: Mean adjustments per session < 1
  - Alert threshold: > 5 adjustments per session
- [ ] Check out-of-view events
  - Expected: Minimal, < 2 per session
- [ ] Monitor error rates in Sentry
- [ ] Check user feedback channels

## 🔄 Rollback Plan

If issues arise:

```bash
# Quick rollback to previous version
git revert <commit-hash>
npm run build
# Deploy previous version
```

**Specific rollback steps:**

1. Revert asset path changes (`/brand/` → `/assets/brand/`)
2. Restore old `public/assets/brand/` directory
3. Revert Workbox config changes
4. Clear Service Worker cache on clients (SKIP_WAITING handles this)

## 📊 Success Metrics

### Immediate (Day 1)

- [ ] Build succeeds in CI
- [ ] No spike in error rates
- [ ] Service Worker updates correctly
- [ ] Brand assets load (verify with dev tools)

### Short-term (Week 1)

- [ ] tour_step_adjusted events < 1 per session (mean)
- [ ] tour_step_out_of_view events < 0.5 per session (mean)
- [ ] No regression in tour completion rate
- [ ] No increase in tour abandon rate

### Medium-term (Release 2 & 3)

- [ ] Maintain adjustment trends
- [ ] Collect full release cycle metrics
- [ ] Plan SKIP_WAITING removal for Release 4

## ✨ Housekeeping (After 2 More Releases)

### Release 4 Checklist

- [ ] Remove SKIP_WAITING logic from `src/main.tsx`
  - Remove SW controller change listener
  - Remove SW registration check and message
- [ ] Test that Service Worker still updates correctly
- [ ] Verify build completes
- [ ] Update changelog
- [ ] Deploy and monitor for 24 hours

### Optional Future Improvements

- [ ] Extend defensive guards to other components
- [ ] Create reusable tour hook: `useTourLayout()`
- [ ] Add more granular telemetry (CSS transition detection)
- [ ] Auto-retry mechanism for failed measurements

## 📞 Support & Troubleshooting

### During Deployment

**Issue:** Build fails

- Run `npm run build` locally to debug
- Check for TypeScript errors: `npx tsc --noEmit`
- Check for ESLint errors: `npm run lint`

**Issue:** Assets 404s

- Verify `public/brand/` exists with 4 files
- Check Vite dev server and dist build
- Verify `index.html` uses `/brand/` paths
- Check browser Network tab for exact 404 paths

**Issue:** Service Worker not updating

- Clear browser cache manually
- Check DevTools Application tab for SW
- Look for SKIP_WAITING messages in console
- Verify `src/main.tsx` has promotion logic

### Post-Deployment

**Issue:** Tour tooltips misaligned

- Check browser console for layout guard logs
- Verify telemetry events are firing
- Check if images/fonts are loading slowly
- Review tour_step_adjusted event frequency

**Issue:** High adjustment count

- Could indicate: slow image loading, CSS transitions, dynamic layout
- Review images on target elements
- Check for CSS animations affecting position
- Look at isInViewport flag in telemetry

## ✅ Final Checklist

Before clicking "Deploy":

- [ ] All code changes reviewed and approved
- [ ] All tests passing (local and CI)
- [ ] Build artifacts verified
- [ ] Analytics dashboard ready
- [ ] Team notified
- [ ] Rollback plan understood
- [ ] Post-deployment monitoring plan in place

---

**Deployment Status: READY ✅**

**Last Verified:** 2025-11-03
**Verification Script:** All 11 checks PASS
**Build Status:** Successful
**Asset Paths:** Clean (no /assets/brand/ in source)

**Deployed By:** [Your Name]
**Deployment Date:** [To be filled]
**Deployment Environment:** [production/staging]
