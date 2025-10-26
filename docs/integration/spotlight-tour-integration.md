# Spotlight Tour Integration Example

## Complete Integration Guide

This guide shows how to integrate the Spotlight Tour UI into your Inkwell app.

## Step 1: Mount SpotlightOverlay

Add the `SpotlightOverlay` component to your app root, after all routing and context providers:

```tsx
// src/App.tsx or src/main.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import SpotlightOverlay from '@/tour/ui/SpotlightOverlay';
import { createSpotlightPortalRoot } from '@/tour/ui/portal';

function App() {
  // Create portal root on mount
  useEffect(() => {
    createSpotlightPortalRoot();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          {/* Your app routes and components */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectView />} />
            {/* ... more routes */}
          </Routes>

          {/* Mount SpotlightOverlay once here */}
          <SpotlightOverlay />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
```

## Step 2: Configure TourService

Create a tour configuration and integrate with your router and analytics:

```typescript
// src/tour/config/onboardingTour.ts
import type { TourConfig } from '@/tour/types';

export const onboardingTourConfig: TourConfig = {
  version: 1,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Inkwell!',
      body: 'Let's take a quick tour to help you get started.',
      selectors: ['[data-tour-id="dashboard-header"]', '.dashboard-header'],
      placement: 'bottom',
      spotlightPadding: 16,
    },
    {
      id: 'create-project',
      route: '/dashboard',
      title: 'Create Your First Project',
      body: 'Click the "New Project" button to start a new writing project.',
      selectors: ['[data-tour-id="new-project-btn"]', '.btn-new-project'],
      placement: 'right',
      spotlightPadding: 12,
    },
    {
      id: 'editor',
      route: '/project/sample/editor',
      title: 'Write Your Story',
      body: 'This is the editor where you'll write your chapters. Use the toolbar for formatting.',
      selectors: ['[data-tour-id="editor"]', '.editor-container'],
      placement: 'bottom',
    },
    {
      id: 'chapters',
      title: 'Organize Chapters',
      body: 'Use the sidebar to organize your chapters. Drag and drop to reorder.',
      selectors: ['[data-tour-id="chapters-sidebar"]', '.chapters-list'],
      placement: 'left',
    },
    {
      id: 'ai-tools',
      route: '/project/sample/analysis',
      title: 'AI Plot Analysis',
      body: 'Get AI-powered insights into your plot structure and pacing.',
      selectors: ['[data-tour-id="ai-analysis-btn"]', '.btn-analyze'],
      placement: 'top',
    },
  ],
  fallbackPlacement: 'bottom',
  defaultSpotlightPadding: 12,
  timeoutMs: 5000,
  analyticsEnabled: true,
};
```

## Step 3: Set Up Adapters

### Router Adapter

```typescript
// src/tour/adapters/router.ts
import { useNavigate, useLocation } from 'react-router-dom';
import type { TourRouter } from '@/tour/types';

export function createReactRouterAdapter(
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
): TourRouter {
  return {
    currentPath: () => location.pathname,
    go: async (path: string) => {
      navigate(path);
      // Wait for navigation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
  };
}
```

### Analytics Adapter

```typescript
// src/tour/adapters/analytics.ts
import type { TourAnalytics } from '@/tour/types';
import { analytics } from '@/services/analytics';

export const tourAnalyticsAdapter: TourAnalytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    analytics.track(event, properties);
  },
};
```

## Step 4: Initialize TourService

Connect the tour service with your adapters:

```typescript
// src/tour/setup.ts
import { tourService } from '@/tour/TourService';
import { onboardingTourConfig } from '@/tour/config/onboardingTour';
import { tourAnalyticsAdapter } from '@/tour/adapters/analytics';

export function initializeTourService(router: TourRouter) {
  tourService.setConfig(onboardingTourConfig);
  tourService.setRouter(router);
  tourService.setAnalytics(tourAnalyticsAdapter);
}
```

```tsx
// In your app root
import { initializeTourService } from '@/tour/setup';
import { createReactRouterAdapter } from '@/tour/adapters/router';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const router = createReactRouterAdapter(navigate, location);
    initializeTourService(router);
  }, [navigate, location]);

  // ... rest of app
}
```

## Step 5: Add Tour Targets

Mark UI elements as tour targets using `data-tour-id`:

```tsx
// src/components/Dashboard.tsx
export function Dashboard() {
  return (
    <div>
      <header data-tour-id="dashboard-header" className="dashboard-header">
        <h1>My Projects</h1>
      </header>

      <button
        data-tour-id="new-project-btn"
        onClick={handleCreateProject}
        className="btn-primary btn-new-project"
      >
        New Project
      </button>

      <aside data-tour-id="chapters-sidebar" className="chapters-sidebar">
        {/* Chapter list */}
      </aside>
    </div>
  );
}
```

```tsx
// src/components/Editor.tsx
export function Editor() {
  return (
    <div data-tour-id="editor" className="editor-container">
      {/* Editor content */}
    </div>
  );
}
```

```tsx
// src/components/AIAnalysis.tsx
export function AIAnalysis() {
  return (
    <button data-tour-id="ai-analysis-btn" onClick={handleAnalyze} className="btn-analyze">
      Analyze Plot
    </button>
  );
}
```

## Step 6: Trigger the Tour

Start the tour from user actions:

```tsx
// In your onboarding flow
import { tourService } from '@/tour/TourService';

export function OnboardingComplete() {
  const handleStartTour = async () => {
    await tourService.start();
  };

  return (
    <div>
      <h2>Welcome aboard!</h2>
      <button onClick={handleStartTour}>Take a Quick Tour</button>
    </div>
  );
}
```

```tsx
// In your help menu
export function HelpMenu() {
  const handleRestartTour = async () => {
    await tourService.restart();
  };

  return (
    <Menu>
      <MenuItem onClick={handleRestartTour}>Restart Product Tour</MenuItem>
    </Menu>
  );
}
```

## Step 7: Handle Tour Completion

React to tour events in your app:

```tsx
// src/hooks/useTourCompletion.ts
import { useEffect } from 'react';
import { tourService } from '@/tour/TourService';

export function useTourCompletion(onComplete: () => void) {
  useEffect(() => {
    const unsubscribe = tourService.subscribe((state) => {
      if (state.isCompleted) {
        onComplete();
      }
    });
    return unsubscribe;
  }, [onComplete]);
}
```

```tsx
// In your dashboard
export function Dashboard() {
  useTourCompletion(() => {
    toast.success('Tour completed! You're ready to start writing.');
    // Maybe show a "Create Your First Project" CTA
  });

  // ... rest of component
}
```

## Step 8: Auto-Start for New Users

Automatically start the tour for first-time users:

```tsx
// src/hooks/useFirstTimeUser.ts
import { useEffect } from 'react';
import { tourService } from '@/tour/TourService';
import { useAuth } from '@/contexts/AuthContext';

export function useAutoStartTour() {
  const { user } = useAuth();

  useEffect(() => {
    const checkAndStart = async () => {
      // Only for new users who haven't seen the tour
      if (!user?.isNew) return;

      const hasCompleted = await tourService.hasCompleted();
      if (!hasCompleted) {
        // Wait a moment for the UI to settle
        setTimeout(() => {
          tourService.start();
        }, 1000);
      }
    };

    checkAndStart();
  }, [user]);
}
```

```tsx
// In your App or Dashboard
export function Dashboard() {
  useAutoStartTour();

  // ... rest of component
}
```

## Testing the Integration

### Manual Testing

1. **Start the tour**: Click "Take a Tour" button
2. **Verify spotlight**: Check that the mask highlights the correct element
3. **Test navigation**:
   - Click "Next" to advance
   - Click "Previous" to go back
   - Press → / ← arrow keys
   - Press Escape to close
4. **Check routing**: Verify steps with `route` navigate correctly
5. **Verify completion**: Ensure completion state persists (check IndexedDB)
6. **Test restart**: Restart tour from help menu
7. **Check accessibility**:
   - Tab through buttons
   - Test with screen reader (VoiceOver, NVDA)
   - Verify focus trap

### E2E Tests

```typescript
// e2e/tour.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Spotlight Tour', () => {
  test('completes full tour flow', async ({ page }) => {
    await page.goto('/dashboard');

    // Start tour
    await page.click('[data-testid="start-tour-btn"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Verify first step
    await expect(page.locator('.spotlight-tooltip')).toContainText('Welcome to Inkwell');

    // Navigate to next step
    await page.click('button:has-text("Next")');
    await expect(page.locator('.spotlight-tooltip')).toContainText('Create Your First Project');

    // Test keyboard navigation
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.spotlight-tooltip')).toContainText('Write Your Story');

    // Complete tour
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Next")');
    }

    // Verify completion
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Check persistence
    await page.reload();
    const hasCompleted = await page.evaluate(() => {
      return window.localStorage.getItem('tour-completed');
    });
    expect(hasCompleted).toBeTruthy();
  });

  test('allows skipping tour', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="start-tour-btn"]');

    // Skip tour
    await page.click('button:has-text("Skip")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify analytics event
    // (assuming you have analytics mocked/intercepted)
  });
});
```

## Troubleshooting

### Tour doesn't start

**Check**:

1. Is `SpotlightOverlay` mounted in your app?
2. Is `createSpotlightPortalRoot()` called?
3. Are there errors in the console?
4. Has the tour already been completed? (check IndexedDB)

### Target element not highlighted

**Check**:

1. Does the element have the correct `data-tour-id` attribute?
2. Is the element visible (not `display: none`)?
3. Try adding a fallback selector in the `selectors` array
4. Check console for "Target not found" warnings

### Tooltip positioned incorrectly

**Check**:

1. Is the target element in a scroll container?
2. Try setting a specific `placement` in the step config
3. Increase `spotlightPadding` for more space

### Keyboard navigation not working

**Check**:

1. Is focus within the tour overlay?
2. Are there browser extensions interfering?
3. Check that `trapFocus` is active (focus stays in the tooltip)

## Advanced Customization

### Custom Tooltip Content

Extend `SpotlightTooltip` to support rich content:

```tsx
// src/tour/ui/CustomTooltip.tsx
import SpotlightTooltip from './SpotlightTooltip';

export function CustomTooltip(props) {
  return (
    <SpotlightTooltip {...props}>
      {/* Add custom content like videos, images, etc. */}
      {props.step.video && <video src={props.step.video} controls className="mt-4" />}
    </SpotlightTooltip>
  );
}
```

### Conditional Steps

Show/hide steps based on user state:

```typescript
const tourSteps = [
  // Always show
  { id: 'welcome' /* ... */ },

  // Only show if user has no projects
  ...(user.projectCount === 0
    ? [
        {
          id: 'create-first-project',
          /* ... */
        },
      ]
    : []),

  // Only show for premium users
  ...(user.isPremium
    ? [
        {
          id: 'premium-features',
          /* ... */
        },
      ]
    : []),
];
```

### Interactive Steps

Require users to complete actions:

```typescript
{
  id: 'create-project-action',
  title: 'Create a Project',
  body: 'Click the "New Project" button to continue.',
  selectors: ['[data-tour-id="new-project-btn"]'],
  onAdvance: () => {
    // Only allow advancing if action is complete
    return user.projectCount > 0;
  },
}
```

## Related Documentation

- [Feature Guide: Tour](../../docs/features/tour.md)
- [Architecture: Spotlight Tour](../../docs/architecture/spotlight-tour-architecture.md)
- [Operations: Telemetry](../../docs/ops/telemetry.md)
- [Product: First-Run Experience](../../docs/product/first-run-experience.md)
