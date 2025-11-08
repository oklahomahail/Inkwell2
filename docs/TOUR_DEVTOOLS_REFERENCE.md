# Tour DevTools Quick Reference

**Access in Browser Console (Development Mode Only)**

---

## 🎯 Feature Flag Commands

```javascript
// View all tour flags
window.tourFlags.print();

// Enable all tours
window.tourFlags.enableAll();

// Disable all tours
window.tourFlags.disableAll();

// Enable specific tour
window.tourFlags.enableExport(); // Export tour only
window.tourFlags.enableAITools(); // AI tools tour only

// Disable specific tour
window.tourFlags.disableExport();

// Enable kill switch (disables ALL tours)
localStorage.setItem('tour:kill', '1');

// Disable kill switch
localStorage.removeItem('tour:kill');

// Manual flag override
localStorage.setItem('ff:tour_simpleTour', 'on'); // Enable
localStorage.setItem('ff:tour_simpleTour', 'off'); // Disable
localStorage.removeItem('ff:tour_simpleTour'); // Reset to default
```

---

## 📊 Analytics Commands

```javascript
// View analytics summary in console
window.tourAnalytics.print();

// Download all events as CSV
window.tourAnalytics.downloadCSV();

// Download summary stats as JSON
window.tourAnalytics.downloadSummary();

// Clear analytics (for testing)
localStorage.removeItem('analytics.tour.events');

// View raw events
JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
```

---

## 🔍 Manual Inspection

```javascript
// Check last tour used
localStorage.getItem('tour:lastUsed');

// Check crash shield session failures
sessionStorage.getItem('tour:session-failures');

// Check completion status
localStorage.getItem('tour:inkwell-onboarding-v1:done');

// View all tour-related localStorage keys
Object.keys(localStorage).filter((k) => k.includes('tour'));
```

---

## 🧪 Testing Scenarios

### Test Feature Flags

```javascript
// Canary testing (enable one tour)
window.tourFlags.enableExport();
// Start tour and verify only export tour shows

// Kill switch test
localStorage.setItem('tour:kill', '1');
// Attempt to start any tour - should be blocked
```

### Test Crash Shield

```javascript
// Simulate 3 failures in current session
for (let i = 0; i < 3; i++) {
  sessionStorage.setItem('tour:session-failures', i + 1);
}
// Next tour start should auto-disable
```

### Test Analytics Export

```javascript
// Generate test events
window.inkwellStartTour();
// Navigate through a few steps
// Press ESC to skip
window.tourAnalytics.downloadCSV();
// Verify CSV contains expected events
```

### Test Completion Tracking

```javascript
// Check if user has completed onboarding tour
const completed = localStorage.getItem('tour:inkwell-onboarding-v1:done') === 'true';
console.log('Onboarding tour completed:', completed);
```

---

## 🚨 Emergency Commands

```javascript
// Kill all tours immediately
localStorage.setItem('tour:kill', '1');
window.location.reload();

// Reset all tour state (fresh user)
Object.keys(localStorage)
  .filter((k) => k.startsWith('tour:') || k.startsWith('ff:tour_'))
  .forEach((k) => localStorage.removeItem(k));
sessionStorage.removeItem('tour:session-failures');
window.location.reload();

// Disable specific broken tour
localStorage.setItem('ff:tour_export', 'off');
window.location.reload();
```

---

## 📋 Common Workflows

### Deploy Day Monitoring

```javascript
// Every 2-4 hours:
window.tourAnalytics.print();
// Look for:
// - High crash shield rate (>2%)
// - Low completion rate (<40%)
// - High drop-off on specific steps

// Export for deeper analysis
window.tourAnalytics.downloadCSV();
```

### User Bug Report Investigation

```javascript
// Reproduce user's environment
window.tourFlags.print(); // Check their flag state

// Check for errors
JSON.parse(localStorage.getItem('analytics.tour.events') || '[]').filter(
  (e) => e.type === 'tour_error',
);

// Check crash shield
console.log('Session failures:', sessionStorage.getItem('tour:session-failures'));
```

### A/B Testing Setup

```javascript
// Control group (no tours)
window.tourFlags.disableAll();

// Test group (all tours)
window.tourFlags.enableAll();

// Canary group (specific tour)
window.tourFlags.disableAll();
window.tourFlags.enableExport();
```

---

## 🎓 Pro Tips

1. **DevTools only load in development**  
   If `window.tourFlags` is undefined, you're in production mode.

2. **Changes require reload**  
   Most flag changes take effect on next tour start, but reload ensures clean state.

3. **CSV timestamps are UTC**  
   Export converts timestamps to ISO 8601 format for easy analysis.

4. **Kill switch is global**  
   Setting `tour:kill=1` disables ALL tours, including canary/beta.

5. **Session failures reset on page reload**  
   Crash shield uses `sessionStorage`, so failures don't persist across tabs.

6. **Analytics buffer has no size limit**  
   Consider clearing old events periodically to avoid localStorage bloat.

---

## 🔗 Related Docs

<!-- - [Tour Post-Deploy Guardrails](./TOUR_POST_DEPLOY_GUARDRAILS.md) -->
<!-- - [Production Readiness Report](./TOUR_PRODUCTION_READINESS.md) -->
<!-- - [PR Checklist](./PR_TEMPLATE_TOUR_CHECKLIST.md) -->
<!-- - [Deployment Guide](./DEPLOYMENT_CHECKLIST_TOURS.md) -->

---

**Last Updated:** 2025-01-27  
**Version:** v1.3.2
