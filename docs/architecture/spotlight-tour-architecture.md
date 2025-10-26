# Spotlight Tour Architecture

## System Overview

The Spotlight Tour is a modular, composable system for guided user onboarding. It consists of three main layers:

1. **State Layer**: TourService manages tour state, progression, and persistence
2. **UI Layer**: React components render the spotlight mask and tooltips
3. **Integration Layer**: Hooks, analytics, and router adapters connect the tour to the app

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  SpotlightOverlay                    │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ SpotlightMask  │  │   SpotlightTooltip       │   │   │
│  │  │  (SVG overlay) │  │   (Step content + nav)   │   │   │
│  │  └────────────────┘  └──────────────────────────┘   │   │
│  └─────────────┬────────────────────────────────────────┘   │
│                │ useSpotlightUI (state subscription)        │
│                ↓                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TourService (Singleton)                │    │
│  │  • State management (currentStep, index, etc.)     │    │
│  │  • Navigation (next, prev, skip, complete)         │    │
│  │  • Route integration (router adapter)              │    │
│  │  • Analytics integration (track events)            │    │
│  │  • Persistence (IndexedDB for completion state)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                ↓                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  IndexedDB                          │    │
│  │  tourState db → { version, completedAt, lastStep } │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### TourService

**Responsibility**: Central state management for tour progression.

**Key Methods**:

- `start()`: Initialize tour, load config, navigate to first step
- `next()`: Advance to next step, trigger analytics
- `prev()`: Go back to previous step
- `skip()`: Exit tour early, mark as skipped
- `complete()`: Mark tour as completed, persist to IndexedDB
- `hasCompleted()`: Check if user has completed the current tour version

**State Properties**:

```typescript
{
  isActive: boolean;          // Is the tour currently running?
  currentStep: TourStep | null; // Current step definition
  currentIndex: number;       // 0-based step index
  steps: TourStep[];          // All tour steps
  version: number;            // Tour version (for cache invalidation)
}
```

**Event Flow**:

1. User triggers `tourService.start()`
2. Service loads tour config and initializes state
3. If `step.route` is specified, navigate to that route
4. Wait for target element to be available (with timeout)
5. Update state → triggers UI re-render via `useSpotlightUI`
6. User navigates → service updates state → UI re-renders
7. On completion or skip, persist state to IndexedDB

### State Persistence

Tour completion state is stored in IndexedDB:

```typescript
{
  db: 'tourState',
  store: 'completions',
  key: 'onboarding-tour-v1',
  value: {
    version: 1,
    completedAt: 1736123456789,
    lastStep: 'create-project',
  }
}
```

**Version Handling**:

- If the tour config version changes, previous completion is invalidated
- Users will see the updated tour on next visit
- Old completion records remain in IndexedDB (for analytics)

## UI Layer

### Component Hierarchy

```
<SpotlightOverlay>              [Portal root, keyboard handler]
  <SpotlightPortal>             [Renders to #spotlight-root]
    <div role="dialog">         [Fixed overlay container]
      <SpotlightMask />         [SVG mask with focus ring]
      <SpotlightTooltip />      [Tooltip card, positioned relative to target]
    </div>
  </SpotlightPortal>
</SpotlightOverlay>
```

### SpotlightOverlay

**Responsibilities**:

- Subscribe to TourService state via `useSpotlightUI`
- Resolve target element from `step.selectors`
- Compute anchor rect and optimal placement
- Handle global keyboard events (←/→/Esc)
- Manage focus trap and screen reader announcements

**Mount Location**: Near app root, after router and auth contexts:

```tsx
// src/App.tsx
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <YourApp />
          <SpotlightOverlay /> {/* Mount once here */}
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
```

### SpotlightMask

**Responsibilities**:

- Render full-screen SVG overlay with dark mask
- Create cutout around the target element (spotlight)
- Add focus ring around the spotlight
- Animate transitions between steps

**SVG Structure**:

```svg
<svg viewBox="0 0 {viewportWidth} {viewportHeight}">
  <defs>
    <mask id="spotlight-mask">
      <!-- White background (visible) -->
      <rect fill="white" />
      <!-- Black cutout (transparent) -->
      <rect x={target.x} y={target.y} width={target.width} height={target.height} rx={radius} />
    </mask>
  </defs>
  <!-- Dark overlay (masked) -->
  <rect fill="rgba(0,0,0,0.5)" mask="url(#spotlight-mask)" />
  <!-- Focus ring (not masked) -->
  <rect x={target.x} y={target.y} stroke="accent" strokeWidth={2} fill="none" />
</svg>
```

### SpotlightTooltip

**Responsibilities**:

- Display step title, body, and progress indicator
- Render navigation buttons (Next, Previous, Skip)
- Auto-position based on available viewport space
- Handle keyboard focus within the card

**Positioning Algorithm**:

1. Compute preferred placement from `step.placement` or default to 'auto'
2. If 'auto', calculate available space in all 4 directions
3. Choose direction with most space that fits the tooltip
4. Clamp tooltip position to viewport bounds with margin
5. If tooltip doesn't fit anywhere, show in best direction with scrolling

**Tooltip Layout**:

```
┌─────────────────────────────────────┐
│  Step X of Y                        │ ← Progress indicator
├─────────────────────────────────────┤
│  [Step Title]                       │
│                                     │
│  Step body content goes here...    │
│                                     │
├─────────────────────────────────────┤
│  [Prev]  [Skip]           [Next] → │ ← Navigation buttons
└─────────────────────────────────────┘
```

### useSpotlightUI Hook

**Responsibilities**:

- Subscribe to TourService state changes
- Resolve target element from DOM via selectors
- Compute `anchorRect` (target's bounding box)
- Compute optimal `placement` based on viewport space
- Re-compute on viewport changes (resize, scroll)
- Provide callbacks for user actions (next, prev, skip, close)

**Return Value**:

```typescript
{
  isActive: boolean;
  currentStep: TourStep | null;
  index: number;
  total: number;
  anchorRect: DOMRect | null;
  placement: TourPlacement;
  next: () => void;
  prev: () => void;
  skip: () => void;
  close: () => void;
}
```

**Selector Resolution**:

- Steps define an array of `selectors` (CSS selectors)
- Hook tries each selector in order until a matching element is found
- If no element is found, logs a warning and shows no spotlight (tooltip only)

## Integration Points

### Router Integration

The tour integrates with the app's router via a `TourRouter` adapter:

```typescript
interface TourRouter {
  currentPath: () => string;
  go: (path: string) => Promise<void> | void;
}

// React Router example
const reactRouterAdapter: TourRouter = {
  currentPath: () => window.location.pathname,
  go: (path) => navigate(path),
};

tourService.setRouter(reactRouterAdapter);
```

**Route-Based Steps**:

- If a step has a `route` property, the service navigates to that route before showing the step
- Waits for target element to be available (with timeout)
- Handles async navigation (e.g., data loading)

### Analytics Integration

The tour tracks user interactions via a `TourAnalytics` adapter:

```typescript
interface TourAnalytics {
  track: (event: string, properties?: Record<string, unknown>) => void;
}

// Example adapter
const analyticsAdapter: TourAnalytics = {
  track: (event, props) => {
    mixpanel.track(event, props);
  },
};

tourService.setAnalytics(analyticsAdapter);
```

**Tracked Events**:

- `tour_started`: Tour begins
- `tour_step_viewed`: User views a step
- `tour_completed`: User completes all steps
- `tour_skipped`: User exits early

**Event Properties**:

```typescript
{
  tourVersion: number;
  stepId: string;
  stepIndex: number; // 1-based
  totalSteps: number;
  timestamp: number;
}
```

### Accessibility Integration

**Focus Management**:

- `trapFocus(root)`: Constrains tab navigation to the tour overlay
- `restoreFocus()`: Returns focus to the element that had focus before the tour started
- Focus automatically moves to the tooltip when a step appears

**Screen Reader Announcements**:

- `announceLive(message)`: Uses ARIA live regions to announce step changes
- Announces: "Starting tour. Step X of Y. [Step Title]"
- Announces each step change: "Step X of Y. [Step Title]"

**ARIA Attributes**:

- Overlay: `role="dialog"`, `aria-modal="true"`, `aria-label="Product tour"`
- Tooltip: `aria-describedby` points to step content
- Buttons: `aria-label` for clarity (e.g., "Next step", "Skip tour")

## Utilities

### Geometry (`geometry.ts`)

- `getAnchorRect(el)`: Get element's bounding rect, accounting for scroll
- `getViewport()`: Get current viewport dimensions
- `rafThrottle(fn)`: Throttle function to run max once per animation frame

### Positioning (`positioning.ts`)

- `choosePlacement(anchorRect, viewport, preferred)`: Determine optimal tooltip placement
- `computeTooltipCoords(placement, anchorRect, tooltipSize, viewport)`: Calculate tooltip position

### Portal (`portal.tsx`)

- `SpotlightPortal`: React portal that renders to `#spotlight-root`
- Ensures tour overlay is above all other UI (z-index: 9999)

### Accessibility (`a11y.ts`)

- `trapFocus(root)`: Focus trap implementation
- `restoreFocus()`: Restore focus to previous element
- `announceLive(message)`: ARIA live region announcements

## Performance Considerations

### Render Optimization

- **Throttling**: Viewport changes are throttled with `requestAnimationFrame`
- **Memoization**: Anchor rect and placement are memoized to avoid unnecessary re-renders
- **Portal**: Overlay is rendered in a separate DOM subtree to avoid re-rendering the main app

### Bundle Size

- **Tree-shakable**: All utilities are exported as individual functions
- **Lazy loading**: Tour components can be lazy-loaded until first use
- **No heavy dependencies**: Only React and minimal DOM APIs

### Memory Management

- **Cleanup**: All event listeners are removed on unmount
- **Focus restoration**: Previous focus is restored when tour closes
- **IndexedDB**: Only stores minimal completion state, no step content

## Security Considerations

### XSS Prevention

- **Sanitize step content**: Step titles and bodies should be plain text (no HTML)
- **Selector validation**: Validate selectors to prevent injection attacks
- **Analytics**: Sanitize event properties before sending to analytics

### Privacy

- **No PII**: Tour completion state doesn't include user identifiers
- **Analytics opt-out**: Respect user's analytics preferences
- **Local storage only**: Tour state is stored locally, not sent to servers

## Error Handling

### Target Not Found

- If a target element isn't found, show the tooltip without the spotlight mask
- Log a warning to help developers debug selector issues
- Provide a "Skip" button to allow users to continue

### Route Navigation Errors

- If navigation fails, log an error and skip to the next step
- Timeout after 5 seconds if target doesn't appear after navigation
- Provide clear error messages in dev mode

### IndexedDB Errors

- If IndexedDB is unavailable, tour still works (just won't persist completion)
- Gracefully degrade to in-memory state
- Log errors for debugging

## Testing Strategy

### Unit Tests

- **TourService**: State transitions, navigation logic, persistence
- **Geometry/Positioning**: Rect calculations, placement logic
- **Accessibility**: Focus trap, announcements, keyboard navigation

### Integration Tests

- **Router Integration**: Route-based steps, navigation
- **Analytics Integration**: Event tracking, properties
- **Accessibility**: Screen reader announcements, focus management

### E2E Tests

- **Full Tour Flow**: Start → navigate steps → complete
- **Keyboard Navigation**: Arrow keys, Escape
- **Persistence**: Completion state survives page refresh
- **Cross-Browser**: Chrome, Firefox, Safari

### Visual Regression Tests

- **Mask Rendering**: Spotlight cutout, focus ring
- **Tooltip Positioning**: All 4 placements, edge cases
- **Dark Mode**: All components in dark theme

## Deployment Checklist

- [ ] Tour config version incremented if steps changed
- [ ] All target elements have stable selectors (preferably `data-tour-id`)
- [ ] Analytics adapter configured
- [ ] Router adapter configured
- [ ] Tour tested on all target routes
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA, VoiceOver)
- [ ] Mobile responsiveness verified
- [ ] Dark mode visual QA
- [ ] Performance profiling (no jank during transitions)
- [ ] Error handling tested (missing targets, route errors)

## Future Enhancements

### Planned Features

1. **Multi-step interactions**: Require user to complete an action before proceeding
2. **Conditional steps**: Show/hide steps based on user state
3. **Tour variants**: A/B test different tour flows
4. **Video embeds**: Include tutorial videos in tooltips
5. **Tour builder UI**: Admin interface to create tours without code

### Technical Improvements

1. **Animation library**: Use Framer Motion for smoother transitions
2. **Virtual scrolling**: Support tours in virtualized lists
3. **Lazy positioning**: Defer positioning calculations until step is visible
4. **Web Components**: Provide a framework-agnostic version
5. **SSR support**: Ensure tour works with server-side rendering

## Related Documentation

- [Feature Guide: Tour](../features/tour.md)
- [Operations: Telemetry](../ops/telemetry.md)
- [Product: First-Run Experience](../product/first-run-experience.md)
- [QA Checklist](../../QA_CHECKLIST.md)
