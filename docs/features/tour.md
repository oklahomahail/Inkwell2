# Spotlight Tour Feature Guide

## Overview

The **Spotlight Tour** provides an interactive, guided onboarding experience for new Inkwell users. It highlights key UI elements with a dark overlay mask and step-by-step tooltips, helping users discover core features like creating projects, managing chapters, and accessing AI tools.

## Architecture

### Core Components

1. **TourService** (`src/tour/TourService.ts`)
   - State management for tour progression
   - Step navigation (next, previous, skip)
   - Route-based navigation integration
   - Analytics event tracking
   - IndexedDB persistence for tour completion state

2. **Spotlight UI** (`src/tour/ui/`)
   - **SpotlightOverlay**: Main orchestrator component
   - **SpotlightMask**: SVG mask with focus ring
   - **SpotlightTooltip**: Tooltip card with step content
   - **useSpotlightUI**: React hook for state subscription
   - **Utilities**: geometry, positioning, portal, a11y helpers

3. **Tour Configuration** (`src/tour/types.ts`)
   - Step definitions with selectors, routes, content
   - Placement preferences and padding
   - Version tracking for tour updates

### Data Flow

```
User starts tour
    ↓
TourService.start()
    ↓
State update → useSpotlightUI hook
    ↓
SpotlightOverlay renders mask + tooltip
    ↓
User navigates (next/prev/skip)
    ↓
TourService updates state + logs analytics
    ↓
Repeat until completion or skip
    ↓
TourService.complete() → persist to IndexedDB
```

## Usage

### Starting the Tour

The tour can be triggered from:

- **First-time user flow**: Automatically after signup/onboarding
- **Help menu**: "Take a Tour" button in the main navigation
- **Settings**: "Restart Tour" option

```typescript
import { tourService } from '@/tour/TourService';

// Start the tour
await tourService.start();

// Check if user has completed the tour
const hasCompleted = await tourService.hasCompleted();
```

### Defining Tour Steps

Tour steps are defined in the tour configuration with:

- **id**: Unique step identifier
- **route**: Optional route to navigate to before showing the step
- **selectors**: Array of CSS selectors to find the target element (tries in order)
- **title**: Step title shown in tooltip
- **body**: Step description/instructions
- **placement**: Preferred tooltip position ('top', 'bottom', 'left', 'right')
- **spotlightPadding**: Padding around the highlighted element

Example:

```typescript
const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Inkwell',
    body: 'Let's take a quick tour of the key features.',
    selectors: ['[data-tour-id="dashboard"]'],
    placement: 'bottom',
  },
  {
    id: 'create-project',
    route: '/dashboard',
    title: 'Create Your First Project',
    body: 'Click here to start a new writing project.',
    selectors: ['[data-tour-id="new-project-btn"]', '.create-project-button'],
    placement: 'right',
    spotlightPadding: 16,
  },
  // ... more steps
];
```

### Adding Tour Targets

Mark UI elements as tour targets using the `data-tour-id` attribute:

```tsx
<button data-tour-id="new-project-btn" onClick={handleCreateProject} className="btn-primary">
  New Project
</button>
```

### Keyboard Navigation

- **→ / Enter**: Next step
- **←**: Previous step
- **Esc**: Close/skip tour

## Accessibility

### Screen Reader Support

- Tour overlay has `role="dialog"` and `aria-modal="true"`
- Live regions announce step changes
- Tooltip content is keyboard-focusable
- Focus trap keeps keyboard navigation within the tour

### Focus Management

- Focus automatically moves to the tooltip when a step appears
- Focus is restored to the original element when the tour closes
- Tab order is preserved within the tooltip

### ARIA Attributes

```tsx
<div role="dialog" aria-modal="true" aria-label="Product tour" aria-describedby="tour-step-content">
  {/* Tooltip content */}
</div>
```

## Analytics

The tour integrates with Inkwell's analytics system to track:

- **tour_started**: User begins the tour
- **tour_step_viewed**: User views a specific step
- **tour_completed**: User completes all steps
- **tour_skipped**: User exits the tour early

Event properties include:

- `tourVersion`: Current tour version
- `stepId`: Step identifier
- `stepIndex`: Step number (1-based)
- `totalSteps`: Total number of steps in the tour

Example analytics call:

```typescript
analytics.track('tour_step_viewed', {
  tourVersion: 1,
  stepId: 'create-project',
  stepIndex: 2,
  totalSteps: 8,
});
```

## Styling

The Spotlight Tour uses Tailwind CSS with Inkwell's design tokens:

- **Mask opacity**: `bg-gray-900/50` (50% opacity)
- **Focus ring**: `ring-2 ring-accent-500` (2px accent color ring)
- **Tooltip card**: `bg-white dark:bg-gray-800` with shadow and rounded corners
- **Buttons**: Primary, secondary, and ghost variants from the design system

### Dark Mode

All components support dark mode via Tailwind's `dark:` variants:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{/* Content */}</div>
```

## Testing

### Unit Tests

Test files are located in `test/tour/`:

- `TourService.test.ts`: Service logic, state management
- `geometry.test.ts`: Viewport and rect calculations
- `positioning.test.ts`: Tooltip placement logic
- `a11y.test.ts`: Focus trap and announcements

### E2E Tests

E2E tests in `e2e/tour.spec.ts` validate:

- Tour starts correctly
- Steps navigate in sequence
- Keyboard shortcuts work
- Tour completion persists
- Analytics events fire

### Manual QA

Manual QA should include:

- Visual regression checks
- Cross-browser testing
- Accessibility validation (NVDA, VoiceOver)
- Mobile responsiveness

## Troubleshooting

### Tour Doesn't Start

**Issue**: `tourService.start()` doesn't show the overlay.

**Solutions**:

1. Ensure `SpotlightOverlay` is mounted in your app root
2. Check that target elements exist in the DOM
3. Verify the tour hasn't already been completed (check IndexedDB)
4. Look for console warnings about missing selectors

### Target Element Not Highlighted

**Issue**: The spotlight mask doesn't appear around the target.

**Solutions**:

1. Verify the `selectors` array in the step config is correct
2. Check that the element is visible (not `display: none`)
3. Ensure the element has a stable position (not in a collapsed menu)
4. Try adding a `data-tour-id` attribute for more specific targeting

### Tooltip Positioned Incorrectly

**Issue**: The tooltip overlaps the target or goes off-screen.

**Solutions**:

1. Set a `placement` preference in the step config
2. Increase `spotlightPadding` to give more space
3. Check for scroll containers that may affect positioning
4. The auto-placement algorithm will try all directions; if all fail, it defaults to bottom

### Keyboard Navigation Not Working

**Issue**: Arrow keys or Esc don't work.

**Solutions**:

1. Ensure focus is within the tour overlay (not in an input field)
2. Check browser extensions that may intercept keyboard events
3. Verify `trapFocus` is active (check focus is constrained to the tooltip)

### Tour Resets on Page Refresh

**Issue**: Tour progress isn't saved.

**Solutions**:

1. Verify IndexedDB is enabled in the browser
2. Check that `TourService.complete()` is called on finish
3. Ensure the tour version matches (version mismatch triggers a reset)
4. Look for errors in the console related to IndexedDB

## Advanced Customization

### Custom Step Actions

Execute custom logic before or during a step:

```typescript
{
  id: 'open-sidebar',
  beforeNavigate: async () => {
    // Open a collapsed sidebar before highlighting
    await openSidebar();
  },
  onAdvance: () => {
    // Log custom event when user proceeds
    console.log('User viewed sidebar tour step');
  },
  // ... other step config
}
```

### Dynamic Step Content

Use React components in step bodies for dynamic content:

```typescript
// In the future, step.body could accept JSX for rich content
{
  id: 'welcome',
  title: 'Welcome',
  body: 'Use <kbd>Cmd+K</kbd> to open the command palette.',
}
```

### Multi-Route Tours

Tours can navigate across multiple routes:

```typescript
const tourSteps = [
  { id: 'dashboard', route: '/dashboard' /* ... */ },
  { id: 'editor', route: '/project/123/editor' /* ... */ },
  { id: 'settings', route: '/settings' /* ... */ },
];
```

The tour service handles route transitions automatically.

## Best Practices

1. **Keep steps concise**: 5-8 steps max for onboarding tours
2. **Highlight value**: Show features that solve user problems
3. **Test on real data**: Use realistic project/chapter data in tour demos
4. **Mobile-first**: Ensure tooltips work on small screens
5. **Version tours**: Increment version when changing step order or content
6. **Measure completion**: Track tour completion rates to optimize
7. **Allow skipping**: Users should be able to skip or restart at any time
8. **Persist state**: Save progress so users can continue later

## Future Enhancements

- **Contextual tours**: Trigger tours based on user actions (e.g., first project created)
- **Interactive steps**: Require users to complete an action before proceeding
- **Video embeds**: Include short video clips in tooltips
- **Branching tours**: Different paths based on user selections
- **Tour analytics dashboard**: Admin view of tour metrics and drop-off points

## Related Documentation

- [Architecture: Spotlight Tour](../architecture/spotlight-tour-architecture.md)
- [Operations: Telemetry](../ops/telemetry.md)
- [Product: First-Run Experience](../product/first-run-experience.md)
- [User Guide](../../USER_GUIDE.md)
