# Tour System

The tour system provides an accessible, configurable way to guide users through the application's features. It consists of a spotlight overlay that highlights specific UI elements and a step card that provides contextual information and navigation controls.

## Components

### Spotlight (`Spotlight.tsx`)

The spotlight component creates a visual overlay that dims the entire screen except for the target element. It's designed to be flexible and accessible:

- Portal-based mounting to ensure proper z-indexing
- Smooth transitions with CSS animations
- Automatic position calculation based on target element
- Accessible dialog implementation
- Scroll locking during tour
- Responsive placement calculation

```typescript
interface SpotlightProps {
  targetElement: HTMLElement | null;
  children?: React.ReactNode;
  placement?: TourPlacement;
  padding?: number;
  onClose?: () => void;
  isActive?: boolean;
}
```

### StepCard (`StepCard.tsx`)

The step card component displays the tour content and navigation controls:

- Keyboard navigation with focus trapping
- Progress indicator
- Previous/Next/Close controls
- Optional "Don't show again" option
- Accessible button controls
- Dark mode support

```typescript
interface StepCardProps {
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onComplete?: () => void;
  onDismiss?: () => void;
}
```

### TourOrchestrator (`TourOrchestrator.tsx`)

The main tour coordination component that manages:

- Tour state management
- Target element tracking
- Route coordination
- Analytics integration
- Storage persistence
- Accessibility

```typescript
interface TourOrchestratorProps {
  tourId: string;
  steps: TourStep[];
  initialStep?: number;
  onComplete?: () => void;
  onDismiss?: () => void;
}
```

## Hooks

### useRouter

Simple routing hook for tour navigation:

- Get current path
- Navigate to new paths
- Handle route changes during tour

### useTourStorage

Manages tour state persistence:

- Save progress
- Track completion
- Handle dismissal
- Clear state

### useAnalytics

Tracks tour usage and interaction:

- Step views
- Tour completion
- Dismissal events
- Development logging

## Types

```typescript
type TourPlacement = 'top' | 'right' | 'bottom' | 'left';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  placement?: TourPlacement;
  route?: string;
  padding?: number;
}

interface TourState {
  currentStep: number;
  isComplete: boolean;
  isDismissed: boolean;
}
```

## Usage

### Basic Example

```tsx
import { TourOrchestrator } from './components/TourOrchestrator';

function App() {
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Inkwell',
      content: 'Let's get you started with your writing journey.',
      target: '#welcome-panel',
      placement: 'bottom'
    },
    // ... more steps
  ];

  return (
    <TourOrchestrator
      tourId="main-tour"
      steps={steps}
      onComplete={() => console.log('Tour completed')}
      onDismiss={() => console.log('Tour dismissed')}
    />
  );
}
```

### Route-Based Tour

```tsx
const steps = [
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    content: 'This is where you'll find your projects.',
    target: '#dashboard',
    route: '/dashboard'
  },
  {
    id: 'editor',
    title: 'The Editor',
    content: 'Write your story here.',
    target: '#editor',
    route: '/editor'
  }
];
```

## Accessibility

The tour system implements several accessibility features:

- ARIA landmarks and labels
- Keyboard navigation
- Focus management
- Screen reader support
- High contrast visibility
- Responsive positioning

## Analytics

Tour interaction events are tracked:

- `tour_started` - Tour begins
- `tour_step_viewed` - Step is shown
- `tour_completed` - User finishes tour
- `tour_closed` - User closes tour early
- `tour_dismissed` - User opts out of tour

## Storage

Tour state is now managed through the centralized TourStorage service with the following structure:

```typescript
interface TourProgress {
  seen: boolean; // Whether the tour has been completed
  step: number; // Current step in the tour (0-based)
}

// Storage keys are profile-aware:
const STORAGE_KEYS = {
  TUTORIAL_SEEN: (profileId: string, tourName: TourName) =>
    `inkwell.tutorial.${profileId}.${tourName}.seen`,
  TUTORIAL_STEP: (profileId: string, tourName: TourName) =>
    `inkwell.tutorial.${profileId}.${tourName}.step`,
};
```

This new structure provides:

- Profile-specific tour state
- Better type safety
- Centralized state management
- React 19 double-effect protection

## Styling

The tour components use Tailwind CSS for styling with a focus on:

- Brand color consistency
- Dark mode support
- Responsive design
- Animation transitions
- Accessible contrast

## Best Practices

1. Keep tour steps focused and concise
2. Use clear, action-oriented titles
3. Provide meaningful step content
4. Consider mobile viewport constraints
5. Test keyboard navigation thoroughly
6. Verify screen reader experience
7. Monitor analytics for drop-off points

## Related Components

- `WelcomeModal.tsx` - First-run experience
- `FeatureDiscovery.tsx` - Contextual hints
- `CompletionChecklist.tsx` - Progress tracking
- `TourNudges.tsx` - Smart suggestions
