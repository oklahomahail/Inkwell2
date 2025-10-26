# Spotlight Tour Quick Reference

## Launch Tours

```typescript
// Default onboarding tour
import { startDefaultTour } from '@/tour/tourEntry';
startDefaultTour();

// AI features tour
import { launchAIToolsTour } from '@/tour/featureTours';
launchAIToolsTour();

// Export features tour
import { launchExportTour } from '@/tour/featureTours';
launchExportTour();
```

## Check Tour Status

```typescript
import { shouldAutoStartTour, isTourDone } from '@/tour/tourEntry';

// Should we auto-start the default tour?
if (shouldAutoStartTour()) {
  startDefaultTour();
}

// Has user completed a specific tour?
if (isTourDone('inkwell-ai-tools-v1')) {
  console.log('User already completed AI tour');
}
```

## Create Custom Tour

```typescript
import { startTourById } from '@/tour/tourEntry';
import type { TourStep } from '@/tour/types';

const mySteps: TourStep[] = [
  {
    id: 'step1',
    title: 'Welcome',
    body: 'This is the first step',
    selectors: ['[data-tour-id="my-element"]'],
    placement: 'bottom',
  },
  // ... more steps
];

startTourById('my-custom-tour-v1', mySteps, {
  version: 1,
  skipIfCompleted: true,
});
```

## Control Active Tour

```typescript
import { tourService } from '@/tour/TourService';

// Navigate tour
tourService.next(); // Go to next step
tourService.prev(); // Go to previous step
tourService.skip(); // Cancel tour
tourService.stop(); // Stop tour

// Get state
const state = tourService.getState();
console.log(state.currentStep, state.totalSteps);

// Subscribe to changes
const unsubscribe = tourService.subscribe((state) => {
  console.log('Tour state changed:', state);
});
```

## Data Attributes (Required)

### Default Tour

- `[data-tour-id="dashboard"]` - Main content
- `[data-tour-id="sidebar"]` - Navigation
- `[data-tour-id="topbar"]` - Top bar
- `[data-tour-id="storage-banner"]` - Storage alerts
- `[data-tour-id="focus-toggle"]` - Focus mode
- `[data-tour-id="help-tour-button"]` - Help button

### Feature Tours (Optional)

- `[data-tour-id="claude-assistant"]` - AI assistant
- `[data-tour-id="plot-analysis"]` - Plot analysis
- `[data-tour-id="character-analytics"]` - Character insights
- `[data-tour-id="export-button"]` - Export trigger
- `[data-tour-id="export-format-selector"]` - Format picker
- `[data-tour-id="export-style-selector"]` - Style picker
- `[data-tour-id="export-proofread-toggle"]` - Proofread option

## Analytics Events

All events automatically tracked via `analyticsService`:

- `tour_started` - Tour begins
- `tour_step_viewed` - Step shown
- `tour_completed` - Tour finished
- `tour_skipped` - Tour abandoned

## Reset Tours (Testing)

```javascript
// Clear all tour completion state
localStorage.removeItem('inkwell.tour.inkwell-onboarding-v1.completed');
localStorage.removeItem('inkwell.tour.inkwell-ai-tools-v1.completed');
localStorage.removeItem('inkwell.tour.inkwell-export-v1.completed');

// Clear session flags
sessionStorage.clear();

// Reload page
location.reload();
```

## Troubleshooting

**Tour not auto-starting:**

- Check `/dashboard` route
- Clear localStorage tour keys
- Check console for errors

**Analytics not tracking:**

- Check browser console
- Verify Do Not Track disabled
- Check analytics service initialized

**Tour UI not showing:**

- Verify `<SpotlightOverlay />` mounted in App.tsx
- Check z-index conflicts
- Check React DevTools component tree

## File Locations

```
src/tour/
├── tourEntry.ts          # Main entry points
├── featureTours.ts       # Feature tour launchers
├── TourService.ts        # Low-level service
├── persistence.ts        # Completion tracking
└── configs/
    ├── defaultTour.ts    # Default onboarding
    ├── aiToolsTour.ts    # AI features
    └── exportTour.ts     # Export features
```
