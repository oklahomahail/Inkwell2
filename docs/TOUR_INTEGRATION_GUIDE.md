# Inkwell Spotlight Tour - Integration Guide

Complete guide for integrating the buttery-smooth, production-ready tour system into your Inkwell application.

## Quick Start

### 1. Import the CSS (once, in your app entry)

```tsx
// src/main.tsx or src/App.tsx
import './styles/tour.css';
```

### 2. Wire up triggers in your components

```tsx
// src/components/Dashboard/CreateProjectButton.tsx
import { triggerOnProjectCreated } from '@/components/Onboarding/tourTriggers';

function CreateProjectButton() {
  const handleCreate = async () => {
    const project = await createProject();
    triggerOnProjectCreated(project.id); // ✅ Fire tour trigger
  };

  return <button onClick={handleCreate}>New Project</button>;
}
```

### 3. Enable auto-start on first login

```tsx
// src/AppProviders.tsx or src/pages/Dashboard.tsx
import { useEffect } from 'react';
import { safeAutoStart } from '@/components/Onboarding/tourPersistence';
import { useInkwellSpotlightTour } from '@/components/Onboarding/useInkwellSpotlightTour';

function Dashboard() {
  const { startSpotlightTour } = useInkwellSpotlightTour();
  const isFirstLogin = /* your logic */;

  useEffect(() => {
    safeAutoStart(startSpotlightTour, isFirstLogin);
  }, [isFirstLogin, startSpotlightTour]);

  return <div>...</div>;
}
```

## Complete Trigger Wiring

Add these trigger dispatches throughout your UI:

### Dashboard

```tsx
// When dashboard first mounts
import { triggerDashboardView } from '@/components/Onboarding/tourTriggers';

useEffect(() => {
  triggerDashboardView();
}, []);
```

### Project Creation

```tsx
// After successful project creation
import { triggerOnProjectCreated } from '@/components/Onboarding/tourTriggers';

const handleCreateProject = async () => {
  const project = await api.createProject(data);
  triggerOnProjectCreated(project.id);
};
```

### Writing Panel

```tsx
// When writing panel mounts and is ready
import { triggerWritingPanelOpen } from '@/components/Onboarding/tourTriggers';

useEffect(() => {
  if (isReady) {
    triggerWritingPanelOpen(projectId);
  }
}, [isReady, projectId]);
```

### Story Planning

```tsx
// When story planning tab becomes active
import { triggerStoryPlanningOpen } from '@/components/Onboarding/tourTriggers';

const handleTabChange = (tab: string) => {
  if (tab === 'planning') {
    triggerStoryPlanningOpen(projectId);
  }
};
```

### Beat Sheet

```tsx
// After user adds first beat
import { triggerBeatSheetCompleted } from '@/components/Onboarding/tourTriggers';

const handleAddBeat = (beat: Beat) => {
  addBeat(beat);
  if (beats.length === 1) {
    triggerBeatSheetCompleted(beats.length);
  }
};
```

### Characters

```tsx
// After user adds first character
import { triggerCharactersAdded } from '@/components/Onboarding/tourTriggers';

const handleAddCharacter = (character: Character) => {
  addCharacter(character);
  triggerCharactersAdded(characters.length);
};
```

### World Building

```tsx
// When world building tab is visited
import { triggerWorldBuildingVisited } from '@/components/Onboarding/tourTriggers';

useEffect(() => {
  if (activeTab === 'world-building') {
    triggerWorldBuildingVisited();
  }
}, [activeTab]);
```

### AI Integration

```tsx
// After user saves Anthropic API key
import { triggerAiIntegrationConfigured } from '@/components/Onboarding/tourTriggers';

const handleSaveApiKey = async (key: string) => {
  await saveApiKey(key);
  triggerAiIntegrationConfigured();
};
```

### Timeline

```tsx
// When timeline view is mounted
import { triggerTimelineVisited } from '@/components/Onboarding/tourTriggers';

useEffect(() => {
  triggerTimelineVisited();
}, []);
```

### Analytics

```tsx
// When analytics view is mounted
import { triggerAnalyticsVisited } from '@/components/Onboarding/tourTriggers';

useEffect(() => {
  triggerAnalyticsVisited();
}, []);
```

## Analytics Integration

Wire tour events to your analytics service:

```tsx
// src/services/analyticsService.ts
import type { TourEvent, TourEventPayload } from '@/components/Onboarding/tourAnalytics';

// Listen for tour events
window.addEventListener('inkwell_analytics', (e: CustomEvent) => {
  const { event, ...payload } = e.detail;

  // Send to your analytics backend
  analyticsService.track(event, payload);

  // Or PostHog, Mixpanel, etc.
  posthog.capture(event, payload);
});
```

## Selector Configuration

Add `data-tour` attributes to your components for reliable targeting:

```tsx
// Dashboard create button
<button data-tour="create-project" onClick={handleCreate}>
  New Project
</button>

// Navigation items
<nav>
  <a href="/planning" data-nav="planning">Story Planning</a>
  <a href="/timeline" data-nav="timeline">Timeline</a>
  <a href="/analytics" data-nav="analytics">Analytics</a>
  <a href="/settings" data-nav="settings">Settings</a>
</nav>

// Writing panel
<div data-panel="writing" className="writing-editor">
  {/* editor content */}
</div>
```

## Tour Replay Button (Settings)

Add the replay button to your Settings → Help section:

```tsx
// src/pages/Settings.tsx
import TourReplayButton from '@/components/Settings/TourReplayButton';

function SettingsPage() {
  return (
    <div>
      <h2>Help & Support</h2>
      <TourReplayButton />
      {/* other help content */}
    </div>
  );
}
```

## Storage Keys Reference

The tour uses these localStorage keys:

```
inkwell.tour.onboarding.progress      - Current step (JSON)
inkwell.tour.onboarding.completed     - "true" if completed
inkwell.tour.onboarding.skipped       - "true" if skipped
inkwell.tour.onboarding.version       - Version string (e.g., "2025-10-18")
inkwell.tour.onboarding.startedAt     - ISO timestamp
inkwell.tour.onboarding.completedAt   - ISO timestamp
inkwell.tour.onboarding.seenLegacy    - "true" if seen previous version
inkwell.tour.onboarding.legacyVersion - Previous version string
```

## Version Migration

When you update the tour, increment the version in `tourPersistence.ts`:

```ts
// src/components/Onboarding/tourPersistence.ts
const TOUR_VERSION = '2025-11-01'; // ← Update this
```

Users will automatically see the updated tour on their next visit (progress resets).

## Edge Cases Handled

### ✅ Missing Selectors

When a target element can't be found, the popover centers on screen and shows a helpful message:

```
💡 Can't find this element? Try opening the menu or navigating to the relevant section.
```

### ✅ Scroll Containers

The overlay automatically detects and scrolls nested scrollable containers (not just window).

### ✅ Mobile Responsive

Popovers clamp to viewport bounds with 24px padding, preventing off-screen positioning.

### ✅ React 19 Strict Mode

All triggers are debounced (300ms) to prevent double-firing from double renders.

### ✅ Keyboard Navigation

- **Arrow keys**: Next/Prev (when available)
- **Escape**: Close tour
- **Tab**: Focus trap within dialog
- **Enter**: Activate focused button

### ✅ Reduced Motion

The CSS respects `prefers-reduced-motion: reduce` and disables animations.

### ✅ DNT (Do Not Track)

Analytics events respect browser DNT settings and silently no-op when enabled.

## Testing

Run the tour tests:

```bash
pnpm test InkwellTourOverlay
pnpm test tourTriggers
```

## Troubleshooting

### Tour doesn't auto-start

1. Check `isFirstLogin` is `true`
2. Verify `safeAutoStart` is called after auth success
3. Check console for `[tour-persistence]` logs (dev mode)
4. Ensure tour isn't already completed: clear localStorage

### Selectors not resolving

1. Add `data-tour` attributes to your components
2. Check console for `[tour] Could not resolve target` warnings
3. Verify elements exist in DOM when tour starts
4. Use `waitForTarget()` for async route changes

### Analytics events not firing

1. Check browser DNT setting
2. Verify `inkwell_analytics` event listener is registered
3. Check console for `[tour-analytics]` logs (dev mode)

### Tour fires twice on strict mode

This is fixed via `safeAutoStart` idempotent guard. If still happening:

```tsx
// Don't do this:
useEffect(() => {
  startSpotlightTour(); // ❌ Will fire twice in strict mode
}, []);

// Do this instead:
useEffect(() => {
  safeAutoStart(startSpotlightTour, isFirstLogin); // ✅ Idempotent
}, [isFirstLogin]);
```

## Performance Checklist

- [ ] Tour CSS imported once in app entry
- [ ] Triggers debounced (automatic via `dispatchTourTrigger`)
- [ ] Selectors use efficient `data-` attributes
- [ ] Analytics events respect DNT
- [ ] Tests passing for overlay and triggers
- [ ] Version incremented when tour changes

## Next Steps

1. Add trigger dispatches throughout your UI (see examples above)
2. Add `data-tour` attributes to target elements
3. Wire analytics events to your backend
4. Add `TourReplayButton` to Settings
5. Test on mobile devices
6. Monitor analytics for completion rates

## API Reference

### Components

- `InkwellTourOverlay` - Main tour overlay with spotlight and popover
- `TourReplayButton` - Settings button for replaying tour

### Hooks

- `useInkwellSpotlightTour()` - Tour state management and controls

### Utilities

- `dispatchTourTrigger(eventName, payload?)` - Fire tour progression events
- `resolveTourTarget(targetName)` - Resolve element from selector map
- `waitForTarget(selectors, timeout?)` - Wait for element to appear
- `trackTourEvent(event, payload)` - Track analytics event
- `safeAutoStart(startFn, isFirstLogin)` - Idempotent auto-start guard
- `loadTourState(tour)` - Load progress from localStorage
- `saveTourProgress(tour, step)` - Save current step
- `markTourCompleted(tour)` - Mark as completed
- `resetTourState(tour)` - Clear all state for replay

### Constants

- `SEL` - Centralized selector map for all tour targets
- `TOUR_VERSION` - Current tour version for migrations

## Examples

See the test files for comprehensive usage examples:

- `src/components/Onboarding/__tests__/InkwellTourOverlay.test.tsx`
- `src/components/Onboarding/__tests__/tourTriggers.test.ts`

## Latest Updates (v1.3.2)

### New Data Tour ID Attributes

The following `data-tour-id` attributes have been added for enhanced tour targeting:

#### Export Workflow

- `export-button` - Main export button in the UI
- `export-template-selector` - Export template dropdown
- `export-run-button` - Export execution button

#### AI Features

- `ai-model-selector` - AI model selection dropdown
- `claude-assistant` - AI assistant panel
- `privacy-hint` - Privacy controls hint/tooltip

#### Usage Example

```tsx
// In ExportModal.tsx
<button data-tour-id="export-button">Export</button>
<Select data-tour-id="export-template-selector">...</Select>
<button data-tour-id="export-run-button">Run Export</button>

// In AiSettingsPanel.tsx
<Select data-tour-id="ai-model-selector">...</Select>

// In PrivacyControls.tsx
<div data-tour-id="privacy-hint">...</div>
```

### Analytics Dashboard Integration

The `TourCompletionCard` widget has been integrated into the Analytics dashboard:

```tsx
// src/components/Panels/AnalyticsPanel.tsx
import TourCompletionCard from '@/features/analytics/components/TourCompletionCard';

function AnalyticsPanel() {
  return (
    <div>
      {/* ...other analytics widgets... */}
      <TourCompletionCard />
    </div>
  );
}
```

**Metrics Displayed:**

- Tour completion rate
- Average completion time
- Tours started vs completed
- Last 5000 events tracked

**Analytics Events:**

- `tour_started` - When tour begins
- `tour_step_viewed` - Each step viewed
- `tour_completed` - Tour finished successfully
- `tour_skipped` - Tour abandoned
