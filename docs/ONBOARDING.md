# Onboarding System

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
   - `profileId`: User's profile ID
   - `totalSteps`: Number of steps in tour

2. `tour_step`
   - `tourType`: Type of tour
   - `profileId`: User's profile ID
   - `stepIndex`: Current step number
   - `totalSteps`: Total steps in tour

3. `tour_complete`
   - `tourType`: Type of tour
   - `profileId`: User's profile ID
   - `totalSteps`: Number of steps completed
