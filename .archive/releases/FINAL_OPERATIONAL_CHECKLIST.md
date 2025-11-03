# Tour Guardrails - Final Operational Checklist

**Status:** ✅ GO FOR DEPLOYMENT  
**Date:** October 27, 2025  
**Decision:** Proceed with phased rollout

---

## ✅ Pre-Flight Verification Complete

### Build Health

- [x] **TypeScript:** Clean (0 errors)
- [x] **Lint:** Clean (406 warnings, all non-blocking console.log)
- [x] **Anchor Tests:** 13/13 passing
- [x] **CLI Verifier:** Working (3 template string "errors" expected)

### Guardrails Deployed

- [x] Feature flags with independent kill switches
- [x] Crash shield (2 failures / 2 seconds threshold)
- [x] Runtime error logging with devLog
- [x] Last tour persistence
- [x] Analytics (completion, drop-off, time-to-first-tour, sparkline)

### Documentation

- [x] `docs/TOUR_POST_DEPLOY_GUARDRAILS.md`
- [x] `docs/PR_TEMPLATE_TOUR_CHECKLIST.md`
- [x] `docs/TOUR_DATA_ATTRIBUTES.md`
- [x] `DEPLOYMENT_CHECKLIST_TOURS.md`
- [x] `TOUR_GUARDRAILS_COMPLETE.md`

### DevTools Helpers

- [x] `src/dev/printTourFlags.ts` - Flag visibility
- [x] `src/dev/tourAnalyticsExport.ts` - CSV export & analytics

---

## 🚀 Phased Rollout Plan

### T0: Launch (Immediate)

**Configuration:**

```typescript
DEFAULT_TOUR_FLAGS = {
  tour_simpleTour: true, // Core tour at 100%
  tour_aiTools: true, // AI Tools ready
  tour_export: true, // Export ready
};
```

**Actions:**

1. Deploy to production
2. Verify deployment successful
3. Run post-deploy smoke tests
4. Monitor for first 2 hours

**DevTools Check:**

```javascript
window.tourFlags.print();
```

---

### T0 + 2h: Canary Export (10%)

**Goal:** Validate export tour with 10% of users

**Implementation:**

```javascript
// Random 10% rollout
if (Math.random() < 0.1) {
  localStorage.setItem('ff:tour_export', 'on');
} else {
  localStorage.setItem('ff:tour_export', 'off');
}
```

**Monitor:**

- [ ] Error rate < 0.5%
- [ ] Completion rate ≥ 60%
- [ ] No crash shield activations
- [ ] Drop-off analysis shows no >40% single step

**Check Command:**

```javascript
window.tourAnalytics.print();
```

---

### T0 + 24h: Full Export + Canary AI Tools (10%)

**Condition:** Export tour stable at 2h mark

**Configuration:**

```javascript
// Export at 100%, AI Tools at 10%
localStorage.setItem('ff:tour_export', 'on'); // All users

if (Math.random() < 0.1) {
  localStorage.setItem('ff:tour_aiTools', 'on');
} else {
  localStorage.setItem('ff:tour_aiTools', 'off');
}
```

**Monitor:**

- [ ] Export tour completion rate maintained
- [ ] AI Tools error rate < 0.5%
- [ ] AI Tools completion rate ≥ 60%
- [ ] Discovery rate tracking

---

### T0 + 48h: Full Rollout

**Condition:** All tours stable at 24h mark

**Configuration:**

```javascript
// All tours at 100%
window.tourFlags.enableAll();
```

**Final Check:**

- [ ] All completion rates ≥ target thresholds
- [ ] Error rates < 0.5%
- [ ] No crash shield pattern
- [ ] Positive user feedback

---

## 📊 Monitoring Dashboard

### Quick Health Check (Console)

```javascript
// Print current flags
window.tourFlags.print();

// Print analytics summary
window.tourAnalytics.print();

// Download CSV for analysis
window.tourAnalytics.downloadCSV();

// Download summary JSON
window.tourAnalytics.downloadSummary();
```

### SLO Thresholds

```javascript
// Week 1 Success Criteria
const SLOs = {
  coreStartRate: 0.35, // 35% of new sessions
  coreCompletionRate: 0.7, // 70% completion
  exportCompletionRate: 0.6, // 60% completion
  aiToolsDiscovery: 0.15, // 15% of core completers
  errorRate: 0.005, // 0.5% of starts
  avgCoreDuration: [60000, 120000], // 60-120 seconds
  avgExportDuration: [30000, 90000], // 30-90 seconds
  maxDropOffSingleStep: 0.4, // 40% max on any step
};
```

### Manual Checks

```javascript
// Check for errors
const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
const errors = events.filter((e) => e.type === 'tour_error');
console.log(`Error count: ${errors.length}`);
console.table(errors.slice(-20));

// Check crash shield state
const crashShield = JSON.parse(sessionStorage.getItem('inkwell:tour:crash-shield') || '{}');
console.log('Crash shield:', crashShield);

// Check completion rates
import { getTourCompletionRate } from '@/tour/analytics';
['core', 'export', 'ai-tools'].forEach((tourId) => {
  const rate = getTourCompletionRate(tourId);
  console.log(`${tourId}: ${rate.completed}/${rate.started} = ${rate.rate.toFixed(1)}%`);
});
```

---

## 🚨 Incident Playbook

### Symptom: Overlay not appearing within 500ms

**Actions:**

1. Flip kill switch: `localStorage.setItem('tour:kill', '1'); location.reload();`
2. Collect errors: Check `analytics.tour.events` for `tour_error` types
3. Run verifier: `pnpm verify-tour-anchors:verbose`
4. Check anchor visibility with DevTools
5. Review crash shield logs

### Symptom: Spike in drop-offs at specific step

**Actions:**

1. Run drop-off analysis: `getDropOffAnalysis('core')`
2. Identify problem step index
3. Validate `data-tour-id` still exists in DOM
4. Check z-index and visibility
5. Test on different screen sizes
6. Review step copy and timing

### Symptom: High error rate (>0.5%)

**Actions:**

1. Download analytics: `window.tourAnalytics.downloadCSV()`
2. Group errors by message
3. Check for common pattern (browser, timing, etc.)
4. Disable affected tour variant
5. Deploy hotfix
6. Re-enable gradually

---

## ✅ Done-Done Criteria

### Phase Execution

- [ ] T0 launch completed and logged
- [ ] T0+2h canary check completed
- [ ] T0+24h expansion check completed
- [ ] T0+48h full rollout check completed
- [ ] All phases documented in `RELEASE_NOTES_v1.3.2.md`

### Flag Status

- [ ] Flags at intended percentages
- [ ] `printTourFlags()` output verified
- [ ] Kill switches tested and working
- [ ] Main feature flag service aligned

### Analytics Validation

- [ ] Analytics widget showing real-world data
- [ ] CSV download tested and data looks correct
- [ ] Summary stats calculated accurately
- [ ] Drop-off analysis identifying patterns

### Quality Gates

- [ ] Completion rates meet thresholds
- [ ] Error rates below SLOs
- [ ] No crash shield pattern detected
- [ ] User feedback positive

---

## 🎯 Quick Wins (This Week)

### DevTools Helpers ✅

- [x] `printTourFlags()` - Flag matrix visibility
- [x] `downloadTourCSV()` - One-liner CSV export
- [x] `printTourAnalytics()` - Console summary

### Next Week

- [ ] CI smoke E2E test (headless tour start → ESC close)
- [ ] Lint hygiene pass (strip console.\* in production)
- [ ] SLO monitoring widget in analytics dashboard
- [ ] Incident playbook expansion

### Future

- [ ] Server-side analytics aggregation
- [ ] Automated SLO alerts
- [ ] A/B testing framework
- [ ] Mobile responsive tweaks

---

## 📞 Support Resources

**Quick Commands:**

```bash
# Verify build
pnpm typecheck && pnpm test anchors

# Verify anchors
pnpm verify-tour-anchors:verbose

# Run full checks
pnpm ci
```

**Browser Console:**

```javascript
// Flags
window.tourFlags.print();
window.tourFlags.disableAITools();
window.tourFlags.enableAll();

// Analytics
window.tourAnalytics.print();
window.tourAnalytics.downloadCSV();
```

**Documentation:**

- Full guide: `docs/TOUR_POST_DEPLOY_GUARDRAILS.md`
- Deployment: `DEPLOYMENT_CHECKLIST_TOURS.md`
- Anchors: `docs/TOUR_DATA_ATTRIBUTES.md`
- PR guide: `docs/PR_TEMPLATE_TOUR_CHECKLIST.md`

---

## ✍️ Sign-Off

- [x] **Development Lead:** All guardrails implemented and tested
- [x] **QA:** Manual smoke tests passed
- [x] **Product:** Acceptance criteria met, phased rollout approved
- [x] **DevOps:** Ready to deploy, rollback plan in place

**Deployment Authorized:** ✅  
**Deployment Date:** October 27, 2025  
**Deployment Engineer:** **\*\***\_**\*\***

---

**STATUS: 🚀 CLEARED FOR LAUNCH**

All systems go for phased production rollout with comprehensive guardrails and monitoring in place.
