# Inkwell Spotlight Tour System

## Overview

The Spotlight Tour system introduces writers to Inkwell's interface through guided, interactive highlights. It combines accessibility, performance, and persistence to ensure the first-use experience is seamless and memorable.

## Purpose

- Onboard new users with contextual, step-by-step guidance
- Highlight key features and workflows without overwhelming
- Provide accessibility-first navigation (keyboard, screen readers)
- Track completion state across sessions

## Core Architecture

### Component Structure

**Files:** `src/tour/`

- `TourService.ts`: Singleton managing lifecycle, step transitions, and analytics tracking
- `analyticsAdapter.ts`: Handles safe event logging (`tour_started`, `tour_completed`, etc.)
- `routerAdapter.ts`: Syncs tour anchors with route changes using `useTourRouterAdapter()`
- `persistence.ts`: Tracks completion state via `localStorage` (fallback-safe)
- `tourLifecycleIntegration.tsx`: Root component wiring analytics + persistence
- `defaultTour.ts`: Default tour configuration and constants

### TourService (Singleton)

The central orchestrator for tour behavior:

- **Lifecycle Management**: Start, pause, resume, complete, skip
- **Step Navigation**: Forward/backward through tour steps with validation
- **State Tracking**: Current step index, completion status, skipped tours
- **Event Broadcasting**: Emits events for analytics and UI synchronization

Key methods:

```typescript
startTour(tourId: string): void
nextStep(): void
previousStep(): void
skipTour(): void
completeTour(): void
getCurrentStep(): TourStep | null
```

### Analytics Adapter

Safe wrapper around analytics service:

- Prevents tour events from blocking UI
- Handles analytics service failures gracefully
- Tracks key events:
  - `tour_started` - User begins a tour
  - `tour_step_viewed` - User views a specific step
  - `tour_completed` - User completes all steps
  - `tour_skipped` - User exits early

### Router Adapter

Ensures tour steps remain synchronized with route changes:

- Monitors route transitions via `useTourRouterAdapter()`
- Auto-advances or pauses tour based on expected route
- Validates anchor presence after navigation
- Uses `safeObserve()` wrapper to prevent memory leaks

### Persistence Layer

Manages tour completion state across sessions:

- Stores completion status in `localStorage`
- Fallback handling for private browsing / disabled storage
- Prevents tour from re-triggering after completion
- Key: `inkwell_tour_completed_{tourId}`

## Default Tour Configuration

### Tour Definition

Located in `src/tour/configs/defaultTour.ts`:

- Exports `DEFAULT_TOUR_ID` constant
- Contains `defaultTourConfig` with all steps
- Each step defines:
  - `id`: Unique identifier
  - `target`: CSS selector or `data-tour-id` attribute
  - `title`: Step heading
  - `content`: Explanation text
  - `placement`: Tooltip position (top, bottom, left, right)
  - `route`: (Optional) Expected route for this step

Example step:

```typescript
{
  id: 'welcome',
  target: '[data-tour-id="dashboard"]',
  title: 'Welcome to Inkwell',
  content: 'Let\'s explore the key features...',
  placement: 'bottom',
  route: '/dashboard'
}
```

### Tour Anchors

UI elements must have `data-tour-id` attributes:

```html
<div data-tour-id="sidebar">
  <!-- Sidebar content -->
</div>
```

This enables:

- Reliable targeting across DOM changes
- Verification via `pnpm verify-tour-anchors`
- Clear documentation of tour-enabled elements

## Integration in App Root

### Lifecycle Integration

`tourLifecycleIntegration.tsx` connects all systems:

1. Wraps app root to monitor tour state
2. Initializes TourService on mount
3. Connects analytics adapter
4. Registers persistence handlers
5. Activates router adapter

Usage in `src/App.tsx`:

```typescript
import { TourLifecycleIntegration } from './tour/tourLifecycleIntegration';

function App() {
  return (
    <TourLifecycleIntegration>
      {/* App content */}
    </TourLifecycleIntegration>
  );
}
```

### Auto-Start Logic

Tours can start automatically based on:

- First-time user (no completion record)
- Feature flag or A/B test assignment
- Manual trigger from dashboard or settings

## Authoring New Tours

### Step-by-Step Guide

1. **Create a tour configuration**:

   ```typescript
   // src/tour/configs/onboardingTour.ts
   export const ONBOARDING_TOUR_ID = 'onboarding-v1';

   export const onboardingTourConfig = {
     id: ONBOARDING_TOUR_ID,
     steps: [
       {
         id: 'create-project',
         target: '[data-tour-id="new-project-button"]',
         title: 'Create Your First Project',
         content: 'Click here to start a new writing project.',
         placement: 'right',
         route: '/dashboard',
       },
       // ...more steps
     ],
   };
   ```

2. **Add UI anchors**:

   ```tsx
   <button data-tour-id="new-project-button">New Project</button>
   ```

3. **Register the tour**:

   ```typescript
   // src/tour/tourEntry.ts
   import { onboardingTourConfig } from './configs/onboardingTour';

   TourService.registerTour(onboardingTourConfig);
   ```

4. **(Optional) Add translations**:

   ```json
   // src/i18n/tour.json
   {
     "onboarding-v1": {
       "create-project": {
         "title": "Create Your First Project",
         "content": "Click here to start..."
       }
     }
   }
   ```

5. **Verify anchors**:
   ```bash
   pnpm verify-tour-anchors
   ```

### Best Practices

- Keep steps concise (2-3 sentences max)
- Use action-oriented language ("Click", "Navigate", "Explore")
- Ensure anchors are stable across renders
- Test on multiple screen sizes
- Verify keyboard navigation works

## Testing and Verification

### Automated Anchor Verification

```bash
# Check all tour targets resolve
pnpm verify-tour-anchors

# Test specific tour
pnpm test anchors -- --tour=onboarding-v1
```

Requirements:

- **Anchor coverage >90%** for release readiness
- All `data-tour-id` attributes must be present in DOM
- No duplicate anchor IDs within a page

### Manual Testing Checklist

- [ ] Tour starts correctly for new users
- [ ] Steps highlight the correct UI elements
- [ ] Navigation (next/previous/skip) works
- [ ] Keyboard shortcuts function (Escape to close)
- [ ] Tour persists completion across sessions
- [ ] Analytics events fire correctly
- [ ] Screen reader announces step content

### Test Files

- `src/tour/__tests__/TourService.test.ts` - Core service logic
- `src/tour/__tests__/analyticsAdapter.test.ts` - Event tracking
- `src/tour/__tests__/persistence.test.ts` - Storage layer
- `src/tour/__tests__/routerAdapter.test.ts` - Navigation sync

## Common Issues

### Missing Anchor

**Symptom**: Tour step doesn't highlight anything  
**Solution**: Add `data-tour-id` attribute to target element  
**Verification**: Run `pnpm verify-tour-anchors`

### Stuck Step

**Symptom**: Tour won't advance to next step  
**Solution**: Ensure observer uses `safeObserve()` wrapper  
**Details**: Check console for DOM observation errors

### Tour Not Starting

**Symptom**: Tour doesn't appear on first load  
**Solution**: Verify `DEFAULT_TOUR_ID` registration in `tourEntry.ts`  
**Debug**: Check localStorage for `inkwell_tour_completed_*` keys

### Analytics Not Firing

**Symptom**: Tour events missing from analytics  
**Solution**: Confirm `analyticsAdapter.ts` is initialized  
**Debug**: Enable verbose logging in TourService

### Route Mismatch

**Symptom**: Tour highlights wrong page elements  
**Solution**: Ensure step `route` matches current path  
**Fix**: Update step configuration or router adapter logic

## Performance Considerations

### Lazy Loading

Tours are code-split to reduce initial bundle:

```typescript
const tour = await import('./tour/configs/defaultTour');
```

### Observer Cleanup

`safeObserve()` ensures DOM observers are properly disposed:

- Disconnects when tour completes
- Cleans up on route change
- Prevents memory leaks in long sessions

### Debounced Events

Analytics events are debounced (200ms) to prevent spam during rapid clicking.

## Accessibility

### Keyboard Navigation

- **Enter/Space**: Advance to next step
- **Escape**: Skip/close tour
- **Tab**: Focus next interactive element

### Screen Reader Support

- ARIA labels on all tour controls
- Live region announcements for step changes
- Focus management (returns to last focused element)

### Focus Management

Tour overlay uses focus trap:

1. Captures focus on open
2. Returns focus to trigger element on close
3. Respects `tabindex` on tour controls

## Guardrails

### Max Steps Limit

Tours capped at **15 steps** to prevent fatigue.

### Time Limits

- Individual step timeout: **30 seconds** (auto-advances)
- Total tour timeout: **5 minutes** (marks as completed)

### Engagement Tracking

- Drop-off points logged for optimization
- A/B testing supported via feature flags
- Heatmaps available for anchor interaction

## Future Enhancements

Planned improvements (see `ROADMAP.md`):

- [ ] Multi-language support via i18n
- [ ] Video embeds in tour steps
- [ ] Branching paths based on user choices
- [ ] Tour templates for common workflows
- [ ] Admin UI for tour creation

---

**Last updated:** October 2025
**Maintainer:** Inkwell Core Team
**Related Docs:**

<!-- - [User Guide](../../ONBOARDING.md) -->

- [Accessibility Guide](../BRAND_ACCESSIBILITY_GUIDE.md)
