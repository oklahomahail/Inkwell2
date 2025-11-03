# Tour Guardrails - Deployment Checklist ✅

**Date:** October 27, 2025  
**Feature:** Post-Deploy Tour Guardrails  
**Status:** Ready for Production

---

## Pre-Deploy Verification ✅

### Build Health

- [x] **TypeScript:** `pnpm typecheck` - ✅ PASSED
- [x] **Linting:** `pnpm lint` - ✅ PASSED (warnings only, no errors)
- [x] **Anchor Tests:** `pnpm test anchors` - ✅ 13/13 PASSED
- [x] **Anchor Verification:** `pnpm verify-tour-anchors` - ✅ Working (expected warnings from template strings)

### Feature Flag Defaults

- [x] `tour_simpleTour`: **true** (Core tour - 100% rollout)
- [x] `tour_aiTools`: **true** (AI Tools tour - canary ready)
- [x] `tour_export`: **true** (Export tour - canary ready)

### Crash Shield

- [x] Threshold: 2 failures within 2 seconds
- [x] Toast message: "Couldn't start the tour. You can still explore via the checklist in Help."
- [x] Auto-reset: 5 seconds after activation
- [x] Session-based tracking (clears on reload)

---

## Deployment Plan 🚀

### Phase 1: T0 (Launch)

**Timeline:** Immediate

```javascript
// All tours enabled by default
DEFAULT_TOUR_FLAGS = {
  tour_simpleTour: true, // Core tour at 100%
  tour_aiTools: true, // AI Tools tour ready
  tour_export: true, // Export tour ready
};
```

**Actions:**

1. Deploy code to production
2. Verify build deploys successfully
3. Run post-deploy checks (see below)

---

### Phase 2: T0 + 2 hours (Canary Export)

**Timeline:** 2 hours after launch

**Canary Configuration (10% rollout):**

```javascript
// Option A: Random 10% rollout
if (Math.random() < 0.1) {
  localStorage.setItem('ff:tour_export', 'on');
}

// Option B: Manual testing with specific users
// Enable for test accounts only
```

**Monitor:**

- Error rate on `tour_export`
- Drop-off rate on export steps
- Completion rate vs. `tour_simpleTour`
- Crash shield activations

**Success Criteria:**

- Error rate < 0.5%
- Completion rate ≥ 60%
- No crash shield activations

---

### Phase 3: T0 + 24 hours (Full Export + Canary AI Tools)

**Timeline:** 1 day after launch (if Phase 2 stable)

**Configuration:**

```javascript
DEFAULT_TOUR_FLAGS = {
  tour_simpleTour: true, // Core at 100%
  tour_export: true, // Export at 100%
  tour_aiTools: true, // AI Tools to 10% canary
};
```

**Monitor:**

- `tour_aiTools` error rate
- Discovery rate (users who start AI Tools tour)
- Completion rate
- Drop-off points

---

### Phase 4: T0 + 48 hours (Full Rollout)

**Timeline:** 2 days after launch (if all stable)

**Configuration:**
All tours at 100% (default state)

---

## Post-Deploy Checks (Immediately After Deploy)

### 1. Verify Anchor CLI

```bash
# SSH into prod or run locally against prod build
cd /path/to/production/build
pnpm verify-tour-anchors:verbose

# Expected: Warnings OK, no critical errors
```

### 2. Manual Spot Checks

#### Start Each Tour

```
✅ Core Tour (Help → Restart Core Tour)
   - Overlay appears < 500ms
   - First step highlights correctly
   - Progress indicator shows

✅ AI Tools Tour (Help → AI Tools Tour)
   - Overlay appears < 500ms
   - All AI elements highlighted
   - Step transitions smooth

✅ Export Tour (Help → Export Tour)
   - Overlay appears < 500ms
   - Export modal opens correctly
   - All format options visible
```

#### Test Keyboard & Accessibility

```
✅ ESC closes tour
✅ Tab stays trapped in tooltip
✅ Arrow keys navigate (if implemented)
✅ Screen reader announces steps (if implemented)
```

#### Test Feature Flags

```javascript
// In browser console
localStorage.setItem(
  'inkwell_feature_flags',
  JSON.stringify({
    flags: { tour_aiTools: false },
  }),
);
location.reload();

// Verify: AI Tools Tour option hidden in Help menu
```

#### Test Crash Shield

```javascript
// In DevTools, temporarily break a selector
document.querySelector('[data-tour-id="export-button"]')?.remove();

// Try to start Export Tour
// Expected: Toast appears after 2 failed attempts
```

---

## Monitoring (First 48 Hours)

### Analytics Dashboard

Open production console:

```javascript
// Get summary stats
import { getTourSummaryStats } from '@/tour/analytics';
getTourSummaryStats();

// Expected output:
{
  totalStarts: 50+,
  totalCompletions: 35+,
  totalSkips: <15,
  totalErrors: <3,
  overallCompletionRate: 70+
}
```

### Completion Sparkline

```javascript
import { getCompletionSparkline } from '@/tour/analytics';
console.table(getCompletionSparkline(7));

// Monitor: Upward trend, no sudden drops
```

### Drop-off Analysis

```javascript
import { getDropOffAnalysis } from '@/tour/analytics';
const dropOffs = getDropOffAnalysis('core');
console.table(dropOffs.slice(0, 5));

// Alert if: Any step > 40% drop-off
```

### Error Monitoring

```javascript
// Check for tour errors
const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
const errors = events.filter((e) => e.type === 'tour_error');
console.log(`Errors: ${errors.length}`);
console.table(errors.slice(-20));

// Alert if: > 5 errors/hour or 2 crashes/minute
```

### Time to First Tour

```javascript
import { getTimeToFirstTourMetrics, formatDuration } from '@/tour/analytics';
const metrics = getTimeToFirstTourMetrics();
if (metrics) {
  console.log(`
    Average: ${formatDuration(metrics.averageMs)}
    Median: ${formatDuration(metrics.medianMs)}
    Count: ${metrics.count}
  `);
}

// Target: Median < 2 minutes
```

---

## Kill Switches (Emergency)

### Disable All Tours

```javascript
// In browser console (affects only this user)
localStorage.setItem('tour:kill', '1');
location.reload();

// To re-enable:
localStorage.removeItem('tour:kill');
location.reload();
```

### Disable Single Variant

```javascript
// Disable AI Tools Tour
localStorage.setItem('ff:tour_aiTools', 'off');
location.reload();

// Disable Export Tour
localStorage.setItem('ff:tour_export', 'off');
location.reload();
```

### Reset Tour State

```javascript
// Clear completion state for a user
localStorage.removeItem('tour:inkwell-onboarding-v1:done');

// Clear all tour data
['analytics.tour.events', 'tour:last_used'].forEach((k) => {
  localStorage.removeItem(k);
});
sessionStorage.removeItem('inkwell:tour:crash-shield');
```

---

## Success Criteria (Week 1)

### Engagement Metrics

- [ ] Core tour start rate ≥ 35% of new sessions
- [ ] Core completion rate ≥ 70%
- [ ] Export tour completion rate ≥ 60%
- [ ] AI Tools discovery ≥ 15% of core completers

### Quality Metrics

- [ ] Error rate < 0.5% of tour starts
- [ ] Crash shield activations < 0.1% of starts
- [ ] Average core tour duration: 60-120s
- [ ] Average export tour duration: 30-90s

### User Feedback

- [ ] No support tickets about broken tours
- [ ] Positive feedback on tour helpfulness
- [ ] Users discovering features via tours

---

## Rollback Plan 🔄

If critical issues arise:

### Immediate (< 5 minutes)

```javascript
// Disable problematic tour for all users
// Update feature flag service defaults
DEFAULT_TOUR_FLAGS = {
  tour_simpleTour: true,
  tour_aiTools: false, // ← DISABLED
  tour_export: true,
};

// Push config update (no code deploy needed)
```

### Quick (< 30 minutes)

```javascript
// Disable all tours
DEFAULT_TOUR_FLAGS = {
  tour_simpleTour: false,
  tour_aiTools: false,
  tour_export: false,
};
```

### Full Rollback (< 1 hour)

```bash
# Revert to previous deployment
vercel rollback [previous-deployment-id]

# Or git revert
git revert HEAD
git push origin main
```

---

## Follow-up Actions (Week 1)

### Day 1

- [ ] Review first 24h analytics
- [ ] Check error logs
- [ ] Verify crash shield working
- [ ] Monitor completion rates

### Day 3

- [ ] Review drop-off analysis
- [ ] Identify problematic steps
- [ ] Plan copy improvements
- [ ] Check time-to-first-tour metric

### Week 1

- [ ] Full analytics review
- [ ] User feedback compilation
- [ ] Plan iteration improvements
- [ ] Document lessons learned

---

## Contact & Support

**Primary:** GitHub Issues  
**Emergency:** [Your emergency contact]  
**Logs:** Browser DevTools Console  
**Docs:** `docs/TOUR_POST_DEPLOY_GUARDRAILS.md`

---

## Sign-off ✍️

- [ ] Development Team: Ready for deploy
- [ ] QA: Manual tests passed
- [ ] Product: Acceptance criteria met
- [ ] Deploy Engineer: Checklist reviewed

**Deployment Authorization:** **\*\***\_\_\_**\*\***  
**Date:** **\*\***\_\_\_**\*\***

---

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT
