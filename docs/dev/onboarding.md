# Onboarding & Tours Developer Guide

> **Profile-aware tutorial system with beginner mode, first draft path, and comprehensive analytics.**

## Overview

The Inkwell Onboarding System provides a world-class, multi-layered approach to user education with complete profile isolation, beginner mode functionality, and comprehensive tour analytics. The system is designed for high activation rates and excellent developer experience.

## Architecture

```
Onboarding System
├── 🚀 ProfileTourProvider.tsx      # Profile-aware tour state & analytics
├── 🎓 TutorialRouter.tsx           # Profile-aware tutorial routing system
├── 🎪 TourProvider.tsx             # Legacy tour provider (compatibility)
├── 💡 FeatureDiscovery.tsx         # Contextual hints system
├── 🎯 FirstDraftPath.tsx           # 5-step guided onboarding journey
├── 📋 CompletionChecklist.tsx      # Interactive progress tracking
├── 🔔 TourNudges.tsx              # Smart contextual tour suggestions
├── 📊 OnboardingOrchestrator.tsx   # Main coordination component
├── 🎨 WelcomeModal.tsx            # First-run experience with options
└── 📈 analyticsService.ts         # Privacy-first event tracking
```

## Core Components

### 🚀 Profile Tour Provider

**Location**: `src/components/Onboarding/ProfileTourProvider.tsx`

Manages tour state with complete profile isolation and analytics integration.

```typescript
import { ProfileTourProvider } from '@/components/Onboarding/ProfileTourProvider';

function App() {
  return (
    <ProfileTourProvider profileId="current-profile">
      <MainApplication />
    </ProfileTourProvider>
  );
}

// Access tour context
import { useProfileTour } from '@/components/Onboarding/ProfileTourProvider';

function MyComponent() {
  const {
    startTour,
    completeTour,
    currentStep,
    isActive,
    skipTour,
    neverShowAgain
  } = useProfileTour();

  const handleStartTour = () => {
    startTour('getting-started', {
      entryPoint: 'dashboard',
      userType: 'beginner'
    });
  };

  return (
    <div>
      {!isActive && (
        <button onClick={handleStartTour}>Start Tour</button>
      )}
    </div>
  );
}
```

**Key Features:**

- **Profile Isolation**: Complete separation of tour progress per profile
- **Analytics Integration**: Automatic event tracking with privacy protection
- **State Persistence**: Tour progress survives page reloads and navigation
- **Error Recovery**: Graceful handling of corrupted tour state

### 🎓 Tutorial Router

**Location**: `src/components/Onboarding/TutorialRouter.tsx`

Dedicated routing system for profile-aware tutorials with deep linking.

```typescript
// Navigate to specific tutorial step
import { navigateToTutorial } from '@/utils/tutorialLinks';

// Deep-linkable tutorial URLs
navigateToTutorial('profile-123', 'getting-started', 2);
// Results in: /p/profile-123/tutorials/getting-started/2

// Tutorial component with routing
function TutorialStep({ profileId, tutorialSlug, step }) {
  const tutorialData = useTutorial(tutorialSlug);
  const currentStepData = tutorialData.steps[step - 1];

  return (
    <div className="tutorial-step">
      <h2>{currentStepData.title}</h2>
      <div>{currentStepData.content}</div>
      <TutorialNavigation
        profileId={profileId}
        tutorialSlug={tutorialSlug}
        currentStep={step}
        totalSteps={tutorialData.steps.length}
      />
    </div>
  );
}
```

### 🎯 First Draft Path

**Location**: `src/components/Onboarding/FirstDraftPath.tsx`

Revolutionary 5-step guided journey from project creation to 300 words written.

```typescript
import { FirstDraftPath } from '@/components/Onboarding/FirstDraftPath';

function DashboardWithOnboarding() {
  const { isNewUser, hasCompletedFirstDraft } = useOnboardingStatus();

  if (isNewUser && !hasCompletedFirstDraft) {
    return <FirstDraftPath onComplete={handleFirstDraftComplete} />;
  }

  return <Dashboard />;
}

// Track first draft path progress
import { useOnboardingProgress } from '@/state/onboarding/onboardingSlice';

function FirstDraftStep({ stepNumber, children }) {
  const { completeStep, currentStep } = useOnboardingProgress();

  const isActive = currentStep === stepNumber;

  return (
    <div className={`step ${isActive ? 'active' : ''}`}>
      {children}
      {isActive && (
        <button onClick={() => completeStep(stepNumber)}>
          Continue
        </button>
      )}
    </div>
  );
}
```

**First Draft Path Steps:**

1. **Project Creation**: Create first writing project
2. **Character Development**: Add main character
3. **Scene Planning**: Create opening scene
4. **Writing Sprint**: Write 300 words
5. **Export Success**: Export first draft to file

### 📋 Completion Checklist

**Location**: `src/components/Onboarding/CompletionChecklist.tsx`

Interactive progress tracking with tour integration and celebration.

```typescript
import { CompletionChecklist } from '@/components/Onboarding/CompletionChecklist';

function SidebarWithChecklist() {
  return (
    <div className="sidebar">
      <CompletionChecklist
        profileId="current-profile"
        onItemComplete={handleChecklistComplete}
        showCelebration={true}
      />
    </div>
  );
}

// Custom checklist items
const CHECKLIST_ITEMS = [
  {
    id: 'createProject',
    title: 'Create your first project',
    description: 'Start with a blank canvas or choose a template',
    tourId: 'project-creation',
    weight: 15
  },
  {
    id: 'writeFirstScene',
    title: 'Write your opening scene',
    description: 'Get those first 300 words down',
    tourId: 'writing-basics',
    weight: 25
  },
  // ... more items
];
```

### 🔔 Tour Nudges

**Location**: `src/components/Onboarding/TourNudges.tsx`

Smart contextual tour suggestions triggered by user milestones.

```typescript
import { TourNudges } from '@/components/Onboarding/TourNudges';

function AppWithNudges() {
  return (
    <div className="app">
      <MainContent />
      <TourNudges
        profileId="current-profile"
        triggers={[
          {
            condition: (state) => state.projects.length >= 3,
            tourId: 'project-organization',
            delay: 2000
          },
          {
            condition: (state) => state.totalWords >= 1000,
            tourId: 'advanced-features',
            delay: 5000
          }
        ]}
      />
    </div>
  );
}

// Custom nudge logic
function useSmartNudges(profileId: string) {
  const [nudgeQueue, setNudgeQueue] = useState([]);

  const triggerNudge = (tourId: string, context: any) => {
    // Check if user has already seen this nudge
    const hasSeenNudge = checkNudgeHistory(profileId, tourId);
    if (hasSeenNudge) return;

    // Add to queue with delay
    setNudgeQueue(prev => [...prev, {
      tourId,
      context,
      timestamp: Date.now(),
      priority: calculatePriority(tourId, context)
    }]);
  };

  return { nudgeQueue, triggerNudge };
}
```

## Profile-Aware Tutorial Storage

### Tutorial Storage Service

**Location**: `src/services/tutorialStorage.ts`

Handles profile-isolated tutorial progress with automatic migration.

```typescript
import { tutorialStorage } from '@/services/tutorialStorage';

// Save tutorial progress for specific profile
await tutorialStorage.saveTutorialProgress('profile-123', {
  tutorialId: 'getting-started',
  currentStep: 3,
  completedSteps: [1, 2],
  startedAt: Date.now(),
  lastAccessedAt: Date.now(),
});

// Load tutorial progress
const progress = await tutorialStorage.loadTutorialProgress('profile-123');

// Check if tutorial is completed
const isComplete = await tutorialStorage.isTutorialCompleted('profile-123', 'getting-started');

// Migration from legacy storage
if (await tutorialStorage.hasLegacyData()) {
  await tutorialStorage.migrateLegacyData('first-profile-id');
}
```

### Storage Schema

```typescript
interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completedSteps: number[];
  startedAt: number;
  lastAccessedAt: number;
  metadata?: {
    entryPoint?: string;
    userType?: 'beginner' | 'intermediate' | 'advanced';
    skipReason?: string;
  };
}

interface ChecklistProgress {
  profileId: string;
  items: {
    [itemId: string]: {
      completed: boolean;
      completedAt?: number;
      skipped?: boolean;
    };
  };
  totalScore: number;
  lastUpdated: number;
}
```

## Development Workflow

### 1. Setting Up Onboarding

```bash
# Clone and install dependencies
git clone https://github.com/oklahomahail/Inkwell2
cd Inkwell2
pnpm install

# Onboarding works out-of-the-box
pnpm dev
```

### 2. Creating New Tours

```typescript
// Define tour steps
const WRITING_BASICS_TOUR = {
  id: 'writing-basics',
  title: 'Writing Basics',
  description: 'Learn the fundamentals of writing in Inkwell',
  steps: [
    {
      target: '[data-tour="editor"]',
      title: 'Meet Your Editor',
      content: 'This is where the magic happens. Start typing to create your story.',
      placement: 'bottom',
      action: {
        type: 'highlight',
        element: '.editor-toolbar',
      },
    },
    {
      target: '[data-tour="word-count"]',
      title: 'Track Your Progress',
      content: 'Keep an eye on your word count as you write.',
      placement: 'top',
    },
  ],
};

// Register tour
import { registerTour } from '@/components/Onboarding/tourRegistry';
registerTour(WRITING_BASICS_TOUR);
```

### 3. Adding Tour Triggers

```typescript
// Component with tour integration
function WritingPanel() {
  const { startTour } = useProfileTour();
  const [hasShownTour, setHasShownTour] = useState(false);

  useEffect(() => {
    // Trigger tour when user first accesses writing
    if (!hasShownTour && userIsNew && projectExists) {
      startTour('writing-basics', {
        entryPoint: 'first-write',
        delay: 1000
      });
      setHasShownTour(true);
    }
  }, [userIsNew, projectExists]);

  return (
    <div data-tour="editor">
      <WritingToolbar data-tour="toolbar" />
      <Editor />
      <WordCount data-tour="word-count" />
    </div>
  );
}
```

### 4. Testing Onboarding

```typescript
// Test profile isolation
describe('Profile Tour Provider', () => {
  it('should isolate tour progress between profiles', async () => {
    const provider1 = new ProfileTourProvider({ profileId: 'profile-1' });
    const provider2 = new ProfileTourProvider({ profileId: 'profile-2' });

    // Start tour in profile 1
    await provider1.startTour('getting-started');

    // Check that profile 2 is unaffected
    expect(provider2.isActive).toBe(false);
    expect(provider2.currentStep).toBe(null);
  });
});

// Test first draft path
describe('First Draft Path', () => {
  it('should track progress through all steps', async () => {
    const { result } = renderHook(() => useOnboardingProgress());

    // Complete each step
    for (let step = 1; step <= 5; step++) {
      act(() => {
        result.current.completeStep(step);
      });
    }

    expect(result.current.isComplete).toBe(true);
    expect(result.current.completionRate).toBe(1.0);
  });
});
```

## Beginner Mode Integration

### Feature Flag System

**Location**: `src/services/featureFlagService.presets.ts`

Controls UI complexity through profile-aware feature flags.

```typescript
// Beginner mode preset
export const BEGINNER_MODE_FLAGS = {
  // Hide complex features
  advanced_plotting_tools: false,
  timeline_view: false,
  character_relationship_maps: false,

  // Show guided features
  first_draft_path: true,
  tutorial_nudges: true,
  completion_checklist: true,
  power_tools_collapsed: true,
};

// Pro mode preset
export const PRO_MODE_FLAGS = {
  // Show all features
  advanced_plotting_tools: true,
  timeline_view: true,
  character_relationship_maps: true,

  // Reduce guidance
  first_draft_path: false,
  tutorial_nudges: false,
  completion_checklist: false,
  power_tools_collapsed: false,
};

// Apply mode based on user preference
import { featureFlagService } from '@/services/featureFlagService';

function applyUserMode(mode: 'beginner' | 'pro') {
  const flags = mode === 'beginner' ? BEGINNER_MODE_FLAGS : PRO_MODE_FLAGS;
  featureFlagService.applyPreset(flags);
}
```

### UI Mode Toggle

```typescript
// Component for switching modes
function UIModeToggle() {
  const { currentMode, setMode } = useUIMode();

  return (
    <div className="ui-mode-toggle">
      <label>
        <input
          type="radio"
          checked={currentMode === 'beginner'}
          onChange={() => setMode('beginner')}
        />
        Beginner Mode
      </label>
      <label>
        <input
          type="radio"
          checked={currentMode === 'pro'}
          onChange={() => setMode('pro')}
        />
        Pro Mode
      </label>
    </div>
  );
}
```

## Analytics & Privacy

### Tour Analytics

The onboarding system includes comprehensive, privacy-first analytics:

```typescript
// Analytics events automatically tracked
const TOUR_EVENTS = {
  tour_started: {
    tourType: string,
    entryPoint: string,
    profileId: string,
  },
  tour_step_completed: {
    tourType: string,
    stepIndex: number,
    timeOnStep: number,
    profileId: string,
  },
  tour_completed: {
    tourType: string,
    totalTime: number,
    stepsSkipped: number,
    profileId: string,
  },
  tour_abandoned: {
    tourType: string,
    lastStep: number,
    abandonReason: string,
    profileId: string,
  },
};

// Custom analytics integration
import { logTutorialAnalytics } from '@/services/analyticsService';

function trackCustomEvent(eventType: string, data: any) {
  logTutorialAnalytics(eventType, {
    ...data,
    timestamp: Date.now(),
    profileId: getCurrentProfile().id,
  });
}
```

### Privacy Compliance

- **No Personal Data**: Only interaction patterns and completion rates
- **Profile-Scoped**: All data tied to profile, not individual users
- **Local Storage**: Analytics data stays on device
- **Opt-Out Available**: Users can disable analytics via feature flags

## Advanced Features

### Tour Orchestration

```typescript
// Complex tour sequencing
class TourOrchestrator {
  private tourQueue: Array<{ id: string; condition: () => boolean }> = [];

  addTour(tourId: string, condition: () => boolean) {
    this.tourQueue.push({ id: tourId, condition });
  }

  async checkAndRunNextTour() {
    const nextTour = this.tourQueue.find((tour) => tour.condition());
    if (nextTour) {
      await this.startTour(nextTour.id);
      this.tourQueue = this.tourQueue.filter((t) => t.id !== nextTour.id);
    }
  }
}

// Usage
const orchestrator = new TourOrchestrator();

// Add conditional tours
orchestrator.addTour('project-organization', () => userProjects.length >= 3);
orchestrator.addTour('advanced-features', () => userWordCount >= 5000);
orchestrator.addTour('collaboration', () => userHasSharedProject);

// Check conditions after user actions
useEffect(() => {
  orchestrator.checkAndRunNextTour();
}, [userProjects, userWordCount]);
```

### Smart Tour Timing

```typescript
// Intelligent tour timing based on user behavior
class TourTiming {
  static shouldShowTour(tourId: string, context: any): boolean {
    const userActivity = getUserActivityMetrics();
    const timeInApp = Date.now() - userActivity.sessionStart;

    // Don't interrupt active writing
    if (userActivity.isActivelyWriting) return false;

    // Don't show too many tours in one session
    if (userActivity.toursSeenToday >= 2) return false;

    // Wait for user to be settled in the interface
    if (timeInApp < 30000) return false; // 30 seconds

    // Check tour-specific conditions
    switch (tourId) {
      case 'advanced-features':
        return userActivity.basicFeaturesUsed >= 3;
      case 'collaboration':
        return userActivity.projectCount >= 2;
      default:
        return true;
    }
  }
}
```

## Troubleshooting

### Common Issues

**Tour Not Starting**

1. Check profile context is available
2. Verify feature flags are enabled
3. Check for tour conflicts (multiple tours trying to start)

```typescript
// Debug tour state
function debugTourState() {
  const { isActive, currentTour, currentStep } = useProfileTour();
  console.log('Tour Debug:', {
    isActive,
    currentTour,
    currentStep,
    profileId: getCurrentProfile()?.id,
  });
}
```

**Tutorial Progress Not Saving**

1. Verify profile ID is consistent
2. Check storage permissions
3. Look for migration issues

```typescript
// Check tutorial storage
async function debugTutorialStorage(profileId: string) {
  const progress = await tutorialStorage.loadTutorialProgress(profileId);
  const hasLegacy = await tutorialStorage.hasLegacyData();

  console.log('Tutorial Debug:', { progress, hasLegacy });
}
```

**Profile Isolation Issues**

1. Ensure ProfileTourProvider wraps the app
2. Check that profile context is properly passed down
3. Verify storage keys are profile-prefixed

This comprehensive onboarding system provides world-class user education while maintaining excellent developer experience and privacy standards.
