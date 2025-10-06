# Inkwell Onboarding System

This comprehensive onboarding system provides new users with an interactive, guided introduction to Inkwell's features through multiple complementary components.

## 🎯 Overview

The onboarding system consists of three main layers:

1. **Interactive Tour System** - Step-by-step guided walkthrough
2. **Progressive Feature Discovery** - Contextual hints and tooltips
3. **Enhanced Empty States** - Helpful guidance when content is missing

## 📁 File Structure

```
src/components/Onboarding/
├── TourProvider.tsx          # Tour state management and context
├── TourOverlay.tsx          # Visual tour component with spotlight
├── FeatureDiscovery.tsx     # Contextual hints system
└── README.md               # This integration guide

src/components/ProjectTemplates/
├── TemplateSelector.tsx     # Genre-based project templates

src/data/
├── sampleProject.ts         # Sample project and templates

src/components/EmptyStates/
├── ProfessionalEmptyStates.tsx  # Updated with tour integration
```

## 🚀 Integration Steps

### 1. Add Providers to App Root

Wrap your app with the tour and feature discovery providers:

```tsx
// In your main App.tsx or layout component
import { TourProvider } from '@/components/Onboarding/TourProvider';
import { FeatureDiscoveryProvider } from '@/components/Onboarding/FeatureDiscovery';
import TourOverlay, { useTourKeyboard } from '@/components/Onboarding/TourOverlay';

function App() {
  return (
    <TourProvider>
      <FeatureDiscoveryProvider>
        <YourAppContent />
        <TourOverlay />
      </FeatureDiscoveryProvider>
    </TourProvider>
  );
}
```

### 2. Add Tour Targets to UI Elements

Add `data-tour` attributes to elements you want to highlight:

```tsx
// Example: Navigation sidebar
<nav data-tour="sidebar" className="sidebar">
  {/* sidebar content */}
</nav>

// Example: New project button
<button data-tour="new-project-button" onClick={createProject}>
  Create Project
</button>

// Example: Writing editor
<div data-tour="writing-editor" className="editor">
  {/* editor content */}
</div>
```

### 3. Add Feature Hint Targets

Add `data-hint` attributes for contextual tooltips:

```tsx
// Example: Command palette trigger
<button data-hint="command-palette">⌘K</button>

// Example: AI features
<div data-hint="ai-toolbar">
  {/* AI toolbar content */}
</div>

// Example: Focus mode toggle
<button data-hint="focus-mode">Focus Mode</button>
```

### 4. Use Contextual Hints Hook

In components where you want to trigger contextual hints:

```tsx
import { useContextualHints } from '@/components/Onboarding/FeatureDiscovery';
import { useAppContext, View } from '@/context/AppContext';

function WritingPanel() {
  const { state, currentProject } = useAppContext();

  // This will automatically show relevant hints based on context
  useContextualHints('Writing', {
    hasProjects: state.projects.length > 0,
    hasContent: currentProject?.content?.length > 0,
    userLevel: 'beginner', // or determine dynamically
  });

  return <div>{/* Your writing panel content */}</div>;
}
```

### 5. Integrate Template Selector

Add the template selector to your project creation flow:

```tsx
import TemplateSelector from '@/components/ProjectTemplates/TemplateSelector';

function Dashboard() {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  return (
    <div>
      <button onClick={() => setShowTemplateSelector(true)}>New Project from Template</button>

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(templateId) => {
          console.log('Selected template:', templateId);
        }}
      />
    </div>
  );
}
```

## 🎮 Features

### Interactive Tour System

- **Spotlight Effect**: Highlights target elements with darkened overlay
- **Contextual Positioning**: Smart tooltip placement that stays in viewport
- **Progress Tracking**: Visual progress indicators and step navigation
- **Keyboard Navigation**: Arrow keys, spacebar, and ESC support
- **Persistent State**: Remembers tour progress across sessions
- **Multiple Tour Types**: Full onboarding, feature discovery, contextual help

### Progressive Feature Discovery

- **Contextual Hints**: Show relevant tips based on user state
- **Priority Levels**: High, medium, low priority hints with different styling
- **Trigger Types**: Auto-show, hover, click, focus triggers
- **Conditional Display**: Show hints based on view, content, user level
- **Dismissible**: Users can permanently dismiss hints they've learned

### Project Templates

- **Genre-Specific**: Mystery, Romance, Sci-Fi, Fantasy, Thriller, Literary
- **Pre-built Structure**: Chapters, characters, and plot beats included
- **Difficulty Ratings**: Beginner to advanced templates
- **Customizable**: Users can modify templates before creating projects

### Sample Project

- **Complete Story**: "The Midnight Library" - a mystery about living books
- **Rich Content**: Full chapters, character profiles, plot structure
- **Educational**: Shows best practices for story organization
- **Instant Exploration**: Users can immediately see how Inkwell works

## 🎨 Customization

### Tour Steps

Modify `ONBOARDING_STEPS` in `TourProvider.tsx` to customize the main tour:

```tsx
export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Inkwell!',
    description: 'Your custom welcome message',
    target: '#app-header',
    placement: 'bottom',
    order: 1,
    category: 'onboarding',
  },
  // Add more steps...
];
```

### Feature Hints

Add new hints in `FeatureDiscovery.tsx`:

```tsx
export const FEATURE_HINTS: FeatureHint[] = [
  {
    id: 'custom-hint',
    title: 'Your Feature',
    description: 'Description of your feature',
    target: '[data-hint="your-feature"]',
    trigger: 'hover',
    placement: 'top',
    priority: 'medium',
    category: 'productivity',
    conditions: { view: 'YourView' },
  },
  // Add more hints...
];
```

### Project Templates

Add new templates in `sampleProject.ts`:

```tsx
export const PROJECT_TEMPLATES = {
  yourGenre: {
    name: 'Your Genre Template',
    description: 'Template for your specific genre',
    chapters: [
      { title: 'Opening', content: '' },
      // More chapters...
    ],
    characters: [
      { name: 'Protagonist', role: 'Hero' },
      // More characters...
    ],
    beatSheet: [
      { title: 'Inciting Incident', description: 'The story begins...' },
      // More beats...
    ],
  },
};
```

## 🔧 Configuration

### Tour Behavior

```tsx
// Customize auto-start delay
if (tourState.isFirstTimeUser) {
  setTimeout(() => {
    startTour('full-onboarding');
  }, 1500); // Adjust delay
}
```

### Hint Timing

```tsx
// Customize hint display timing
const eligibleHints = FEATURE_HINTS.filter((hint) => {
  // Your filtering logic
});

// Show high priority hints quickly
setTimeout(() => showHint(hint.id), 2000);

// Show medium priority hints later
setTimeout(() => showHint(hint.id), 15000);
```

## 📊 Analytics Integration

Track onboarding completion and feature discovery:

```tsx
// In tour completion
const completeTour = () => {
  // Analytics tracking
  analytics.track('onboarding_completed', {
    tourType: tourState.tourType,
    stepsCompleted: tourState.currentStep + 1,
    totalSteps: tourState.steps.length,
  });

  setTourState((prev) => ({
    ...prev,
    isActive: false,
    isFirstTimeUser: false,
  }));
};

// In feature hint dismissal
const dismissHint = (hintId: string) => {
  analytics.track('feature_hint_dismissed', {
    hintId,
    category: hint.category,
    priority: hint.priority,
  });

  setDismissedHints((prev) => [...prev, hintId]);
};
```

## 🎯 Best Practices

### Tour Design

- Keep steps short and focused (max 7 steps)
- Use clear, action-oriented language
- Show immediate value of each feature
- Allow users to skip optional steps

### Hint Strategy

- Only show hints that are contextually relevant
- Use different priority levels appropriately
- Provide value, don't just describe features
- Allow easy dismissal for experienced users

### Template Creation

- Include realistic, engaging content
- Provide variety in genres and structures
- Add helpful starter content in chapters
- Balance structure with creative freedom

## 🐛 Troubleshooting

### Tour Not Starting

1. Check if tour providers are properly wrapped around your app
2. Verify `data-tour` attributes are present on target elements
3. Ensure tour steps have valid CSS selectors in `target` field

### Hints Not Showing

1. Verify `data-hint` attributes match hint `target` selectors
2. Check that conditions are met for hint display
3. Confirm hints haven't been previously dismissed

### Template Errors

1. Ensure template data structure matches expected interface
2. Check for missing required fields in template definition
3. Verify template selection handler is properly connected

This comprehensive onboarding system provides a smooth, engaging introduction to Inkwell while being flexible enough to grow with your application's needs.
