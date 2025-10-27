# Tour Post-Deploy Guardrails Implementation

This document describes the post-deployment guardrails, monitoring, and safety features implemented for the tour system.

## 🛡️ Feature Flags & Canary Deployment

### Tour Feature Flags

Three independent feature flags control tour variants for safe gradual rollout:

- **`tour_simpleTour`** - Core/default tour (enabled by default)
- **`tour_aiTools`** - AI Tools tour variant (enabled by default)
- **`tour_export`** - Export workflow tour (enabled by default)

**Location:** `src/services/featureFlagService.ts`

### Usage

```typescript
import { featureFlagService } from '@/services/featureFlagService';

// Check if a tour variant is enabled
if (featureFlagService.isEnabled('tour_aiTools')) {
  // Launch AI tools tour
}
```

### Disabling a Variant in Production

If issues arise, disable a variant without code changes:

```javascript
// In browser console (production)
localStorage.setItem(
  'inkwell_feature_flags',
  JSON.stringify({
    flags: {
      tour_aiTools: false, // Disable AI tools tour
    },
  }),
);
location.reload();
```

## 🔍 Runtime Logging

### Tour Error Logging

**Location:** `src/tour/adapters/analyticsAdapter.ts`

New `logTourError()` function for remote debugging:

```typescript
import { tourAnalytics } from '@/tour/adapters/analyticsAdapter';

// Log tour errors with context
tourAnalytics.logTourError('Overlay mount failed', {
  tourId: 'core',
  attemptCount: 2,
  elementFound: false,
});
```

Errors are:

- Logged to console in development
- Persisted to localStorage for analytics
- Tracked via analytics service
- Include timestamps for correlation

## 🛡️ Crash Shield

### Soft Crash Protection

**Location:** `src/tour/crashShield.ts`

Automatically prevents cascading failures when tours repeatedly fail:

**Features:**

- Tracks failure count and timing
- Activates after 2 failures within 2 seconds
- Shows user-friendly toast message
- Auto-resets after 5 seconds

### Usage

```typescript
import { withCrashShield, recordTourFailure } from '@/tour/crashShield';

// Wrap tour initialization
const result = await withCrashShield(
  'core',
  async () => {
    // Tour initialization code
    return await initializeTour();
  },
  (error) => {
    console.error('Tour failed:', error);
  },
);

// Or manually record failures
try {
  mountOverlay();
} catch (error) {
  recordTourFailure('core', 'Overlay mount failed');
}
```

### Toast Fallback

When shield activates, users see:

> "Couldn't start the tour. You can still explore via the checklist in Help."

## 💾 Last Tour Used

### Persistence

**Location:** `src/tour/tourStorage.ts`

Tracks the last tour variant used for convenience:

```typescript
import { getLastTourUsed, setLastTourUsed } from '@/tour/tourStorage';

// Get last tour
const last = getLastTourUsed(); // 'core' | 'ai-tools' | 'export' | null

// Set last tour
setLastTourUsed('ai-tools');
```

### Help Menu Integration

**Location:** `src/components/Navigation/HelpMenu.tsx`

The Help menu now shows:

- **"Restart [Last Tour Name]"** - Highlighted at top (if user has taken a tour)
- "Restart Core Tour"
- "Feature Tour"
- "AI Tools Tour"
- "Export Tour"

## 📊 Analytics Dashboard

### New Metrics

**Location:** `src/tour/analytics.ts`

#### 1. Completion Sparkline

14-day completion trend:

```typescript
import { getCompletionSparkline } from '@/tour/analytics';

const sparkline = getCompletionSparkline(14);
// Returns: [{ date: '2025-10-13', count: 5 }, ...]
```

#### 2. Drop-off Analysis

Identify where users abandon tours:

```typescript
import { getDropOffAnalysis } from '@/tour/analytics';

const dropOffs = getDropOffAnalysis('core');
// Returns: [{ stepIndex: 3, stepId: 'ai-tools', count: 12, percentage: 45.5 }, ...]
```

#### 3. Time to First Tour

Measure onboarding effectiveness:

```typescript
import { getTimeToFirstTourMetrics } from '@/tour/analytics';

const metrics = getTimeToFirstTourMetrics();
// Returns: { averageMs: 120000, medianMs: 95000, count: 50 }
```

#### 4. Completion Rate

```typescript
import { getTourCompletionRate } from '@/tour/analytics';

const rate = getTourCompletionRate('core');
// Returns: { started: 100, completed: 75, rate: 75 }
```

#### 5. Average Duration

```typescript
import { getAverageTourDuration, formatDuration } from '@/tour/analytics';

const avgMs = getAverageTourDuration('core');
const formatted = formatDuration(avgMs); // "2m 30s"
```

## ✅ Anchor Tests

### Unit Tests for Tour Anchors

**Location:** `src/tour/__tests__/anchors.test.ts`

Fast CI tests verify tour anchors exist:

```bash
npm test anchors
```

Tests verify:

- All documented tour IDs follow kebab-case
- No invalid ID formats (PascalCase, snake_case)
- Anchor documentation is maintained

### Running Tests

```bash
# Run all anchor tests
npm test src/tour/__tests__/anchors.test.ts

# Run in watch mode
npm test -- --watch anchors
```

## ♿ Accessibility (Next Iteration)

Planned improvements:

- [ ] Keyboard-accessible "Close tour" button in tooltips
- [ ] `aria-live="polite"` announcements for tour events
- [ ] Visible "Skip tour" control on every step
- [ ] Screen reader announcements for progress

## 📋 Maintenance Checklist

### Daily

- [ ] Monitor tour error logs in analytics
- [ ] Check crash shield activation frequency

### Weekly

- [ ] Review completion sparkline for anomalies
- [ ] Check drop-off analysis for problem steps

### Monthly

- [ ] Review time-to-first-tour metrics
- [ ] Analyze completion rates by tour variant

### Quarterly

- [ ] Run anchor audit script
- [ ] Update TOUR_DATA_ATTRIBUTES.md
- [ ] Review and archive old analytics events
- [ ] Check for orphaned tour anchors

## 🔧 Troubleshooting

### Tour won't start

1. Check feature flag: `featureFlagService.isEnabled('tour_simpleTour')`
2. Check crash shield: Open DevTools → Application → Session Storage → `inkwell:tour:crash-shield`
3. Reset shield: `sessionStorage.removeItem('inkwell:tour:crash-shield')`

### High drop-off rate

1. Run drop-off analysis: `getDropOffAnalysis('core')`
2. Check for missing anchors in problematic steps
3. Review step content and complexity
4. Test on different screen sizes

### Analytics not tracking

1. Check localStorage quota
2. Verify analytics service is enabled
3. Check browser console for errors
4. Inspect `analytics.tour.events` in localStorage

## 📦 Files Added/Modified

### New Files

- `src/tour/config/tourFeatureFlags.ts` - Feature flag utilities
- `src/tour/crashShield.ts` - Crash protection system
- `src/tour/tourStorage.ts` - Tour persistence utilities
- `src/tour/analytics.ts` - Analytics dashboard utilities
- `src/tour/__tests__/anchors.test.ts` - Anchor verification tests
- `docs/TOUR_POST_DEPLOY_GUARDRAILS.md` - This document

### Modified Files

- `src/tour/adapters/analyticsAdapter.ts` - Added `logTourError()`
- `src/services/featureFlagService.ts` - Added tour variant flags
- `src/components/Navigation/HelpMenu.tsx` - Added last tour tracking
- `src/utils/devLog.ts` - Used in error logging

## 🚀 Next Steps

### Same-Day Wins

- [x] Feature flags for tour variants
- [x] Runtime error logging
- [x] Crash shield implementation
- [x] Last tour persistence
- [x] Anchor unit tests
- [x] Analytics utilities

### This Week

- [ ] Integrate analytics dashboard in UI
- [ ] Add accessibility improvements
- [ ] Create CLI anchor verification script
- [ ] Update PR template

### Next Month

- [ ] Server-side analytics aggregation
- [ ] Advanced error telemetry
- [ ] A/B testing framework for tours
- [ ] Automated anchor audits in CI

## 📞 Support

For questions or issues:

1. Check troubleshooting section above
2. Review TOUR_DATA_ATTRIBUTES.md for anchor questions
3. Check analytics for usage patterns
4. File an issue with error logs and context
