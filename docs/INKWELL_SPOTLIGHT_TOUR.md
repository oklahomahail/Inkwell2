# Inkwell Spotlight Tour

## Overview

The Inkwell Spotlight Tour is a comprehensive, cinematic walkthrough of Inkwell's core features. It mirrors the orientation script for a seamless UX whether users watch the video or experience it in-product.

**Flow:** Dashboard → Writing → Planning → AI → Analytics → Complete

## Tour Steps (11 total, ~5 minutes)

### Step 1: Welcome to Inkwell Studio

- **Placement:** Center
- **Content:** Welcome to your creative home for writing and story design. Let's get you set up to start your first story.
- **Trigger:** Dashboard view
- **Delay:** 600ms

### Step 2: Create Your First Project

- **Placement:** Bottom
- **Target:** Create Project button
- **Content:** Click New Project, give it a title, and it will appear right here on your dashboard.
- **Trigger:** onProjectCreated
- **Features:** Highlight pulse animation

### Step 3: Begin Writing

- **Placement:** Right
- **Target:** First project card
- **Content:** Open your project to enter Writing Mode. You can start your first chapter or scene — everything auto-saves.
- **Trigger:** writingPanelOpen
- **Features:** Highlight pulse animation

### Step 4: Plan Your Story

- **Placement:** Right
- **Target:** Story Planning navigation
- **Content:** In Story Planning, you can outline your plot, track your characters, and build your world — all in one place.
- **Trigger:** storyPlanningOpen

### Step 5: Build Your Beat Sheet

- **Placement:** Bottom
- **Target:** Beat Sheet tab
- **Content:** Add key beats for major story moments to shape your pacing and narrative flow.
- **Trigger:** beatSheetCompleted

### Step 6: Create Characters

- **Placement:** Bottom
- **Target:** Characters tab
- **Content:** Here is where your cast comes to life. Add traits, relationships, and arcs for every character.
- **Trigger:** charactersAdded

### Step 7: Expand Your World

- **Placement:** Bottom
- **Target:** World Building tab
- **Content:** Document your settings, rules, and references to keep your story world consistent.
- **Trigger:** worldBuildingVisited

### Step 8: Connect AI Integration

- **Placement:** Right
- **Target:** Settings navigation
- **Content:** To unlock Inkwell's AI-powered tools, go to Settings → AI Integration and paste your Anthropic API key.
- **Trigger:** aiIntegrationConfigured
- **Actions:** [Open Settings] button

### Step 9: Explore Your Timeline

- **Placement:** Right
- **Target:** Timeline navigation
- **Content:** Visualize your story across time to spot pacing or continuity issues.
- **Trigger:** timelineVisited

### Step 10: View Analytics

- **Placement:** Right
- **Target:** Analytics navigation
- **Content:** Track your writing progress — daily word counts, streaks, and milestones all appear here.
- **Trigger:** analyticsVisited

### Step 11: You're Ready to Write

- **Placement:** Center
- **Target:** Dashboard link
- **Content:** Inkwell is built for focus, imagination, and flow. Welcome home.
- **Actions:** [Start Writing] button

## Implementation

### Files Created

1. **`src/components/Onboarding/tourRegistry.ts`** (UPDATED)
   - Added `INKWELL_SPOTLIGHT_STEPS` array with all 11 tour steps
   - Extended `TourStep` interface with new properties:
     - `nextTrigger` - Event to wait for before enabling "Next"
     - `delay` - Delay before showing step (400-600ms)
     - `highlightPulse` - Pulsing animation flag
     - `actions` - Optional action buttons
     - `selector` - Alternative to `target` (supports multiple selectors)
     - `content` - Alternative to `description`

2. **`src/hooks/useInkwellSpotlightTour.ts`**
   - Custom hook for managing the Spotlight Tour
   - Functions:
     - `startSpotlightTour()` - Start the tour
     - `resetSpotlightTour()` - Reset for replay
     - `markCompleted()` - Mark as completed
     - `markSkipped()` - Mark as skipped
     - `shouldAutoStart()` - Check if should auto-start
     - `getProgress()` - Get current progress
     - `saveProgress()` - Save progress to localStorage

3. **`src/components/Settings/TourReplayButton.tsx`**
   - UI component for Settings → Help section
   - Allows users to replay the tour
   - Shows completion status
   - Beautiful card UI with icon, description, and action button

## Usage

### Auto-start on First Login

```typescript
import { useInkwellSpotlightTour } from '@/hooks/useInkwellSpotlightTour';

function App() {
  const { startSpotlightTour, shouldAutoStart } = useInkwellSpotlightTour();
  const isFirstLogin = /* your auth logic */;

  useEffect(() => {
    if (shouldAutoStart(isFirstLogin)) {
      startSpotlightTour();
    }
  }, [isFirstLogin]);
}
```

### Manual Start from Settings

```typescript
import { TourReplayButton } from '@/components/Settings/TourReplayButton';

function SettingsPanel() {
  return (
    <div>
      <h2>Help & Onboarding</h2>
      <TourReplayButton />
    </div>
  );
}
```

### Accessing Tour from TourProvider

```typescript
import { useTour } from '@/components/Onboarding/TourProvider';
import { INKWELL_SPOTLIGHT_STEPS } from '@/components/Onboarding/tourRegistry';

function MyComponent() {
  const { startTour } = useTour();

  const handleStart = async () => {
    await startTour('full-onboarding', INKWELL_SPOTLIGHT_STEPS);
  };
}
```

## Configuration

### Storage Keys

- `inkwell.tour.spotlight` - Current progress
- `inkwell.tour.spotlight.completed` - Completion flag
- `inkwell.tour.spotlight.skipped` - Skip flag

### Persistence

- **Resumable:** Yes - users can pick up where they left off
- **Progress Tracking:** Step index saved to localStorage
- **Completion Tracking:** Separate flag for "never show again"

### Timing

- **Default Delay:** 500ms between steps
- **Welcome Delay:** 600ms (gives time for page to settle)
- **Max Step Duration:** 30 seconds per step

### UX Settings

- **Allow Skip:** Yes (all steps skippable by default)
- **Allow Previous:** Yes (can go back)
- **Show Progress:** Yes (step counter: "3 of 11")

## Triggers

The tour uses a trigger system to ensure users complete actions before advancing:

- `dashboardView` - User lands on dashboard
- `onProjectCreated` - User creates a project
- `writingPanelOpen` - Writing panel opens
- `storyPlanningOpen` - Story planning view opens
- `beatSheetCompleted` - User interacts with beat sheet
- `charactersAdded` - User visits characters tab
- `worldBuildingVisited` - User visits world building
- `aiIntegrationConfigured` - AI settings configured
- `timelineVisited` - Timeline view opened
- `analyticsVisited` - Analytics view opened

**Note:** These triggers should be implemented by emitting custom events or updating context when users complete these actions.

## Restart/Replay

Users can restart the tour from **Settings → Help**:

1. Opens Settings panel
2. Scrolls to "Inkwell Spotlight Tour" section
3. Clicks "Replay Tour" button
4. Tour resets and starts from Step 1

## Benefits

✅ **Mirrors the Scribe orientation script** - Same flow, in-product
✅ **Cinematic experience** - Smooth transitions, delays, animations
✅ **Resumable** - Users can pick up where they left off
✅ **Skippable** - All steps can be skipped
✅ **Progress tracking** - Visual progress indicator
✅ **Flexible selectors** - Multiple selector fallbacks for each step
✅ **Action buttons** - Optional CTAs like "Open Settings"
✅ **Replay option** - Always accessible from Settings

## Next Steps

1. **Implement trigger events** - Add custom events when users complete actions
2. **Add tour UI component** - Create the overlay/spotlight component that highlights elements
3. **Integrate with TourProvider** - Connect the tour steps to your existing tour system
4. **Add to Settings** - Include TourReplayButton in Settings → Help section
5. **Test flow** - Walk through all 11 steps to ensure smooth transitions
6. **Add animations** - Implement highlight pulse and smooth scrolling

## Future Enhancements

- **Video embeds** - Link to orientation video at any step
- **Interactive demos** - Allow users to try features during the tour
- **Branching paths** - Different tours for different user types
- **Analytics** - Track completion rates and drop-off points
- **A/B testing** - Test different tour flows
- **Localization** - Support multiple languages

---

**Tour Version:** 1.0.0
**Total Steps:** 11
**Estimated Duration:** 5 minutes
**Resumable:** Yes
**Skippable:** Yes
