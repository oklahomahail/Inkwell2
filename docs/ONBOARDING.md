# Onboarding System

> **Note:** As of January 2025, Inkwell uses a **single-user model**. Tour state is tracked per authenticated user (not per profile).

The onboarding system in Inkwell provides guided tours to help users discover and understand application features. It supports multiple tour types, progress persistence, and various trigger mechanisms.

## Architecture

The system consists of several key components:

### Components

1. **OnboardingOrchestrator (`OnboardingOrchestrator.tsx`)**
   - Manages auto-start functionality
   - Handles URL query parameters (?tour=)
   - Listens for programmatic start events
   - Integrates with preference/persistence state

2. **TourOverlay (`TourOverlay.tsx`)**
   - Renders the tour UI
   - Handles step navigation
   - Manages progress persistence
   - Integrates with analytics

3. **RelaunchTourButton (`RelaunchTourButton.tsx`)**
   - UI component for manually starting tours
   - Multiple launch strategies (hook, event, URL)
   - Built-in progress reset

4. **TutorialStorage (`tutorialStorage.ts`)**
   - Persistence layer for tour data
   - Handles progress, preferences, checklists
   - IndexedDB-based with localStorage fallback

## Tour Types

The system supports three types of tours:

1. **Full Onboarding** (`full-onboarding`)
   - Complete app introduction
   - Triggered on first visit
   - Persisted across sessions

2. **Feature Tour** (`feature-tour`)
   - Feature-specific guidance
   - Typically triggered contextually

3. **Contextual Help** (`contextual-help`)
   - Brief, focused assistance
   - Usually single-step

## Spotlight Tour (Phase 2 Integration)

### Overview

The Spotlight Tour system provides interactive guided tours with visual overlays and step-by-step instructions. It consists of:

- **SpotlightOverlay**: Main UI component with spotlight mask and positioned tooltip
- **TourService**: State management and lifecycle control
- **Analytics Adapter**: Event tracking for tour metrics
- **Router Adapter**: Route-based navigation and anchor refresh
- **Persistence Layer**: localStorage-based completion tracking

### How to Enable Spotlight Tour in App Shell

**1. Mount Core Components in `App.tsx`:**

```tsx
import { SpotlightOverlay } from './tour/ui';
import { TourLifecycleIntegration } from './tour/integrations/tourLifecycleIntegration';
import { AutoStartTourIntegration } from './tour/integrations/autoStartIntegration';
import { useTourRouterAdapter } from './tour/adapters/routerAdapter';

function AppShell() {
  // Enable router adapter (refreshes anchors on route changes)
  useTourRouterAdapter();

  return (
    <>
      {/* Tour lifecycle integration - analytics and persistence */}
      <TourLifecycleIntegration />

      {/* Auto-start for first-time users */}
      <AutoStartTourIntegration />

      {/* Spotlight UI overlay */}
      <SpotlightOverlay />

      {/* Rest of your app */}
    </>
  );
}
```

**2. Add Data Attributes to UI Elements:**

Target elements need `data-tour-id` attributes for tour steps:

```tsx
<main data-tour-id="dashboard">Dashboard Content</main>
<nav data-tour-id="sidebar">Navigation</nav>
<header data-tour-id="topbar">Top Bar</header>
<button data-tour-id="focus-toggle">Focus Mode</button>
```

**3. Launch Tours from Help Menu:**

```tsx
import { startDefaultTour } from '@/tour/tourEntry';
import { launchAIToolsTour, launchExportTour } from '@/tour/featureTours';

// In profile menu or help section:
<button onClick={startDefaultTour}>
  Replay Spotlight Tour
</button>

<button onClick={() => launchAIToolsTour()}>
  Learn AI Features
</button>

<button onClick={() => launchExportTour()}>
  Learn Export Features
</button>
```

### Default Tour Steps

1. **Welcome** - Dashboard introduction
2. **Sidebar** - Navigation overview
3. **Topbar** - Quick actions and settings
4. **Storage Banner** - Storage health notifications
5. **Focus Mode** - Distraction-free writing toggle
6. **Help Menu** - Access tours and support

### Feature-Specific Tours

**AI Tools Tour** (5 steps):

- AI introduction
- Claude Assistant
- Plot analysis
- Character insights
- AI settings

**Export Tour** (6 steps):

- Export introduction
- Export button (⌘E)
- Format selection
- Style templates
- AI proofreading
- Completion

### Analytics Events

All Spotlight Tour events are tracked via `analyticsService`:

- `tour_started` - Tour begins with tour_id and totalSteps
- `tour_step_viewed` - Each step view with step_index
- `tour_completed` - Successful completion
- `tour_skipped` - Early exit with drop-off point

See [docs/TOUR_QUICK_REFERENCE.md](./TOUR_QUICK_REFERENCE.md) for complete API reference.

---

## Usage

### Starting a Tour

1. **URL Parameter**

   ```
   ?tour=full    # full-onboarding
   ?tour=feature # feature-tour
   ?tour=context # contextual-help
   ```

2. **Programmatic (React)**

   ```tsx
   import { useTour } from './TourProvider';

   function YourComponent() {
     const tour = useTour();
     // ...
     tour?.start('full-onboarding');
   }
   ```

3. **Event-based**
   ```ts
   window.dispatchEvent(
     new CustomEvent('inkwell:start-tour', {
       detail: { tourType: 'full-onboarding' },
     }),
   );
   ```

### Adding a Tour Button

```tsx
import { RelaunchTourButton } from './Onboarding/RelaunchTourButton';

function YourComponent() {
  return <RelaunchTourButton tourType="feature-tour" label="Show Feature Tour" totalSteps={3} />;
}
```

## Storage Schema

### Progress (`TutorialProgress`)

```ts
{
  slug: string;
  updatedAt: number;
  progress: {
    currentStep: number;
    completedSteps: string[];
    tourType: 'full-onboarding' | 'feature-tour' | 'contextual-help';
    startedAt: number;
    completedAt?: number;
    isCompleted: boolean;
    totalSteps: number;
    lastActiveAt: number;
  }
}
```

### Preferences (`TutorialPreferences`)

```ts
{
  neverShowAgain: boolean;
  remindMeLater: boolean;
  remindMeLaterUntil?: number;
  completedTours: string[];
  tourDismissals: number;
}
```

### Checklist (`CompletionChecklist`)

```ts
{
  createProject: boolean;
  addChapter: boolean;
  addCharacter: boolean;
  writeContent: boolean;
  useTimeline: boolean;
  exportProject: boolean;
  useAI: boolean;
}
```

## Analytics Events

The system emits the following analytics events:

1. `tour_started`
   - `tourType`: Type of tour
   - `userId`: User's ID
   - `totalSteps`: Number of steps in tour

2. `tour_step`
   - `tourType`: Type of tour
   - `userId`: User's ID
   - `stepIndex`: Current step number
   - `totalSteps`: Total steps in tour

3. `tour_complete`
   - `tourType`: Type of tour
   - `userId`: User's ID
   - `totalSteps`: Number of steps completed
