---
title: Defensive Guards - Deployment Checklist
date: 2025-11-03
status: ✅ READY TO DEPLOY
---

# ✅ Defensive Guards - Deployment Ready Checklist

**Status:** 🟢 READY FOR PRODUCTION
**Date:** 2025-11-03
**Verification:** 11/11 checks PASS

---

## 📋 Pre-Deployment Verification

### Code Implementation ✅

- [x] `src/tour/utils/layoutGuards.ts` - All 6 functions implemented
- [x] `src/tour/components/TourOrchestrator.tsx` - Full integration
- [x] `src/main.tsx` - SKIP_WAITING logic added
- [x] Build succeeds: `npm run build`
- [x] No TypeScript errors
- [x] No ESLint errors

### Asset Fixes ✅

- [x] Brand assets moved to `public/brand/`
- [x] All HTML/component references updated
- [x] `dist/brand/` contains 4 files after build
- [x] No `/assets/brand/` paths in source code
- [x] Workbox duplicates removed

### CI/CD Setup ✅

- [x] GitHub Actions workflow configured (`.github/workflows/check-asset-paths.yml`)
- [x] Pre-commit hook installed and executable (`.git/hooks/pre-commit`)
- [x] Asset path check script ready (`scripts/check-asset-paths.sh`)
- [x] Verification script ready (`verify-defensive-guards.sh`)

### Documentation ✅

- [x] DEFENSIVE_GUARDS_INDEX.md (Master index)
- [x] FINAL_SUMMARY.md (Status & overview)
- [x] DEFENSIVE_GUARDS_COMPLETE.md (Full reference)
- [x] DEFENSIVE_GUARDS_USAGE_GUIDE.md (Code examples)
- [x] DEPLOYMENT_CHECKLIST_DEFENSIVE_GUARDS.md (Deploy guide)
- [x] QUICK_REFERENCE.md (Cheat sheet)
- [x] IMPLEMENTATION_SUMMARY.txt (ASCII overview)

### Testing ✅

- [x] Verification script passes: 11/11 checks
- [x] Asset path check clean
- [x] Build successful
- [x] Service worker generated
- [x] Brand assets accessible

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Check (Run Today)

```bash
./verify-defensive-guards.sh
```

**Expected Result:** All 11 checks PASS ✅

### Step 2: Code Review

- [ ] Code reviewed by peer
- [ ] No concerns raised
- [ ] Ready to merge

### Step 3: Deploy to Production

```bash
git push origin main
# GitHub Actions automatically runs checks
# CI/CD pipeline deploys
```

### Step 4: Post-Deployment (Day 1)

- [ ] Monitor error logs for spikes
- [ ] Verify Service Worker updated
- [ ] Manual tour test passes
- [ ] Brand assets load correctly

### Step 5: Post-Deployment (24 Hours)

- [ ] Review analytics dashboard
- [ ] Check `tour_step_adjusted` events
- [ ] Expected: < 1 adjustment per session (mean)
- [ ] Confirm no error spikes

### Step 6: Validation (Week 1)

- [ ] Adjustment metrics trending to ~0
- [ ] No regression in tour completion
- [ ] No increase in error rates
- [ ] User feedback: positive or neutral

---

## 📊 Metrics to Monitor

### Primary Metric: Adjustments per Session

- **Before Fix:** 5-20+ adjustments/session
- **After Fix Goal:** 0-1 adjustment/session
- **Alert Threshold:** > 5 adjustments/session

### Secondary Metrics

- **Out-of-view Events:** Goal < 0.5 per session
- **Tour Completion Rate:** No change expected
- **Error Rate:** No spike expected

### Dashboard Setup

- [ ] Create analytics dashboard
- [ ] Add `tour_step_adjusted` event tracking
- [ ] Add `tour_step_out_of_view` event tracking
- [ ] Set alert thresholds
- [ ] Notify team of monitoring

---

## 🔐 Regression Prevention

### Automated Checks

- ✅ GitHub Actions blocks `/assets/brand/` paths
- ✅ Pre-commit hook prevents commits with bad paths
- ✅ Asset path check script for manual verification

### Manual Checks

- Run `./verify-defensive-guards.sh` anytime
- Run `./scripts/check-asset-paths.sh` before committing
- Review telemetry dashboard weekly

### Continuous Monitoring

- Set up alerts for adjustment count spikes
- Monitor error logs daily for first week
- Weekly review of metrics thereafter

---

## 🧪 Quick Test Guide

### Manual Test (5 minutes)

1. Open app in browser
2. Start a tour
3. Resize browser window → tooltip should follow
4. Scroll page → tooltip should stay with element
5. Refresh page → tooltip should appear centered
6. Open DevTools Console → look for `[Tour]` debug logs

### Asset Test (2 minutes)

1. Open DevTools Network tab
2. Refresh page
3. Check `dist/brand/` assets load (4 files)
4. Verify no 404 errors
5. Look for `/brand/` paths (not `/assets/brand/`)

### CI/CD Test (1 minute)

```bash
./verify-defensive-guards.sh
./scripts/check-asset-paths.sh
npm run build
```

All should pass ✅

---

## 📞 Support & Troubleshooting

### If Verification Fails

1. Run: `./verify-defensive-guards.sh` with `bash -x` for debug
2. Check output for which check failed
3. Review corresponding section in this checklist
4. Read detailed docs: `DEFENSIVE_GUARDS_COMPLETE.md`

### If Assets 404

1. Verify: `ls -la public/brand/`
2. Verify: `ls -la dist/brand/`
3. Check browser Network tab for exact path
4. Verify `index.html` uses `/brand/` not `/assets/brand/`

### If Tour Misaligned

1. Check browser console for `[Tour]` logs
2. Verify layout guards functions were called
3. Review `tour_step_measured` telemetry events
4. Check if images/fonts loading slowly

---

## 🎊 Success Criteria

### Deployment Successful If:

- ✅ Build completes with no errors
- ✅ GitHub Actions checks pass
- ✅ No error spike in production logs
- ✅ Service Worker updates correctly
- ✅ Brand assets load without 404s

### Post-Deployment Success If:

- ✅ `tour_step_adjusted` events trending to 0
- ✅ `tour_step_out_of_view` events minimal
- ✅ Tour completion rate unchanged
- ✅ No increase in error rates
- ✅ User feedback: positive

---

## 📅 Timeline

| Time      | Task                 | Owner     | Status       |
| --------- | -------------------- | --------- | ------------ |
| Today     | Pre-deployment check | DevOps    | ⏳ Ready     |
| This week | Code review          | Tech Lead | ⏳ Ready     |
| This week | Deploy               | DevOps    | ⏳ Ready     |
| Day 1     | Monitor errors       | DevOps    | ⏳ Ready     |
| 24h       | Review telemetry     | Tech Lead | ⏳ Ready     |
| Week 1    | Validate metrics     | Team      | ⏳ Ready     |
| Release 4 | Remove SKIP_WAITING  | Dev       | ⏳ Scheduled |

---

## 🔄 Rollback Plan

If major issues occur:

```bash
# Quick rollback to previous version
git revert <commit-hash>
npm run build
# Deploy previous version
# Clear browser cache (SKIP_WAITING handles old SW)
```

**Time to Rollback:** < 5 minutes
**Data Loss:** None
**User Impact:** Minimal (tour assets might be stale briefly)

---

## 🧹 Housekeeping

### Immediate (Ongoing)

- Monitor telemetry dashboard daily for first week
- Review error logs for any issues
- Keep GitHub Actions checks passing

### After 2 More Releases (Release 4)

- [ ] Remove SKIP_WAITING logic from `src/main.tsx`
- [ ] Remove SW controller change listener
- [ ] Test that Service Worker updates correctly
- [ ] Update CHANGELOG
- [ ] Deploy and monitor for 24 hours

### Optional Future Improvements

- Create reusable tour hook: `useTourLayout()`
- Add more granular telemetry
- Auto-retry mechanism for failed measurements
- Extend guards to other components

---

## ✨ Final Checklist Before Deployment

- [ ] All 11 verification checks pass
- [ ] Build succeeds with no errors
- [ ] Code reviewed and approved
- [ ] Analytics dashboard ready
- [ ] Team notified of deployment
- [ ] Rollback plan documented
- [ ] Post-deployment monitoring plan ready

---

## 🟢 Status

**Ready to Deploy:** YES ✅

All systems go! Deploy with confidence.

---

**Last Updated:** 2025-11-03
**Verification Status:** PASS (11/11)
**Build Status:** SUCCESS
**Deployment Status:** 🟢 READY
