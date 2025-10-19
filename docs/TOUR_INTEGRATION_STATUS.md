# Inkwell Spotlight Tour - Integration Status

**Last Updated**: Phase 2 - In Progress

This document tracks the integration status of the Inkwell Spotlight Tour into the production codebase.

## ✅ Completed Integration Steps (Phase 2 Progress)

### 1. Tour CSS Import ✅

**File**: `src/index.css`

- Added `@import url('./styles/tour.css');` on line 6
- Tour animations (pulse, fade, slide) now load globally

### 2. Auth Success Trigger (onLogin → dashboardView) ✅

**File**: `src/context/AuthContext.tsx`

- Added `triggerDashboardView()` on SIGNED_IN event
- Fires when user successfully authenticates via magic link

### 3-6. ALL Project Creation Triggers ✅ (4/4 locations complete)

All 4 project creation paths now fire `triggerOnProjectCreated()`:

**3a. DashboardPanel.tsx** ✅

- Primary dashboard "New Project" button wired

**3b. EnhancedDashboard.tsx** ✅

- Enhanced dashboard UI wired
- Trigger fires after `setCurrentProjectId()`

**3c. TemplateSelector.tsx** ✅

- Template-based project creation wired
- Trigger fires before navigation

**3d. useCommands.ts** ✅

- Command palette "New Project" command wired
- Stored newProjectId before triggering

### 7. Writing Panel Trigger (writingPanelOpen) ✅

**File**: `src/components/Writing/EnhancedWritingEditor.tsx`

- Added `triggerWritingPanelOpen()` after initial scene loads (loadInitialScene useEffect)
- Fires when writing panel mounts with first scene ready

---

## 🚧 Remaining Integration Steps

### 4. Project Creation Trigger - Remaining Locations

**Status**: 🔴 Pending

**Files to update**:

#### A. EnhancedDashboard Component

**File**: `src/components/Dashboard/EnhancedDashboard.tsx` (lines 13-36)

```typescript
// Add import at top:
import { triggerOnProjectCreated } from '@/components/Onboarding/tourTriggers';

// Add trigger after setCurrentProjectId (line 27):
const createNewProject = async () => {
  // ... existing code ...
  setCurrentProjectId(newProject.id);

  // Fire tour trigger
  triggerOnProjectCreated(newProject.id);

  // Auto-navigate to writing after creation
  setTimeout(() => {
    dispatch({ type: 'SET_VIEW', payload: View.Writing });
  }, 500);
};
```

#### B. TemplateSelector Component

**File**: `src/components/ProjectTemplates/TemplateSelector.tsx` (lines 31-80)

```typescript
// Add import at top:
import { triggerOnProjectCreated } from '@/components/Onboarding/tourTriggers';

// Add trigger before onClose() (around line 78):
const createProjectFromTemplate = () => {
  // ... existing code ...
  onSelect?.(selectedTemplate.id);

  // Fire tour trigger
  triggerOnProjectCreated(newProject.id);

  onClose();
};
```

#### C. useCommands Hook

**File**: `src/hooks/useCommands.ts` (lines 87-112)

```typescript
// Add import at top:
import { triggerOnProjectCreated } from '@/components/Onboarding/tourTriggers';

// Add trigger after addProject (line 108):
{
  id: 'project-new',
  label: 'New Project',
  // ... existing code ...
  action: () => {
    const projectName = prompt('Enter project name:');
    if (projectName) {
      const projectId = crypto.randomUUID();
      addProject({
        id: projectId,
        // ... existing fields ...
      });
      _onCommandExecute?.('project-new');

      // Fire tour trigger
      triggerOnProjectCreated(projectId);

      showToast(`Created project: ${projectName}`, 'success');
    }
  },
}
```

### 5. Writing Panel Trigger

**Status**: 🔴 Pending

**Need to find**: Writing panel/editor component that mounts when user navigates to writing view

**Expected trigger**: `triggerWritingPanelOpen(projectId)`

**Search for**:

- Files matching `*Writing*.tsx` or `*Editor*.tsx`
- Components that render when `View.Writing` is active
- Main text editor component

### 6. Story Planning Trigger

**Status**: 🔴 Pending

**Need to find**: Story planning panel component

**Expected trigger**: `triggerStoryPlanningOpen(projectId)`

**Search for**:

- Files matching `*Planning*.tsx` or `*Outline*.tsx`
- Components that render when planning tab/view is active

### 7. Beat Sheet Trigger

**Status**: 🔴 Pending

**Need to find**: Beat sheet component where beats are added

**Expected trigger**: `triggerBeatSheetCompleted(beatCount)`

**Search for**:

- Files matching `*Beat*.tsx` or `*BeatSheet*.tsx`
- Functions that handle adding/creating beats
- Beat creation modals or forms

### 8. Characters Trigger

**Status**: 🔴 Pending

**Need to find**: Character creation component

**Expected trigger**: `triggerCharactersAdded(characterCount)`

**Search for**:

- Files matching `*Character*.tsx`
- Character creation forms or modals
- Functions that save/add characters

### 9. World Building Trigger

**Status**: 🔴 Pending

**Need to find**: World building panel/tab component

**Expected trigger**: `triggerWorldBuildingVisited()`

**Search for**:

- Files matching `*World*.tsx` or `*WorldBuilding*.tsx`
- World building tab or section component

### 10. AI Integration Trigger

**Status**: 🔴 Pending

**Need to find**: Settings panel where Anthropic API key is saved

**Expected trigger**: `triggerAiIntegrationConfigured()`

**Search for**:

- SettingsPanel.tsx - Claude AI Configuration section
- API key save handler
- Settings form submission

### 11. Timeline Trigger

**Status**: 🔴 Pending

**Need to find**: Timeline view/panel component

**Expected trigger**: `triggerTimelineVisited()`

**Search for**:

- Files matching `*Timeline*.tsx`
- Timeline panel mount effect
- Timeline view component

### 12. Analytics Trigger

**Status**: 🔴 Pending

**Need to find**: Analytics view/panel component

**Expected trigger**: `triggerAnalyticsVisited()`

**Search for**:

- Files matching `*Analytics*.tsx`
- Analytics panel mount effect
- Analytics dashboard component

---

## 🎨 Data-Tour Attributes

**Status**: 🔴 Pending

Add `data-tour` attributes to these elements for reliable selector targeting:

### Navigation Elements

```tsx
// Dashboard/Sidebar navigation
<a href="/dashboard" data-tour="dashboard">Dashboard</a>
<a href="/planning" data-tour="story-planning" data-nav="planning">Story Planning</a>
<a href="/timeline" data-tour="timeline" data-nav="timeline">Timeline</a>
<a href="/analytics" data-tour="analytics" data-nav="analytics">Analytics</a>
<a href="/settings" data-tour="settings" data-nav="settings">Settings</a>
```

### Action Buttons

```tsx
// Project creation
<button data-tour="create-project" onClick={createNewProject}>
  New Project
</button>

// Writing panel
<div data-tour="writing-panel" data-panel="writing">
  {/* Editor content */}
</div>
```

### Tab Components

```tsx
<button data-tab="beats" data-tour="beat-sheet">Beat Sheet</button>
<button data-tab="characters" data-tour="characters">Characters</button>
<button data-tab="world" data-tour="world-building">World Building</button>
```

**Files to update**:

- `src/components/Navigation/*.tsx` - Navigation links
- `src/components/Panels/DashboardPanel.tsx` - Create project button
- `src/components/Dashboard/*.tsx` - Dashboard elements
- Planning, Timeline, Analytics panel components
- Tab navigation components

---

## 📊 Analytics Integration

**Status**: 🔴 Pending

### Wire tour events to analyticsService

**File**: `src/services/analyticsService.ts` (or create if doesn't exist)

```typescript
import type { TourEvent, TourEventPayload } from '@/components/Onboarding/tourAnalytics';

// Listen for tour analytics events
window.addEventListener('inkwell_analytics', ((e: CustomEvent) => {
  const { event, ...payload } = e.detail;

  // Send to your analytics backend
  // Example: posthog.capture(event, payload);
  // Example: mixpanel.track(event, payload);

  console.log('[Analytics]', event, payload);
}) as EventListener);
```

Add this listener in your app initialization (AppProviders.tsx or main.tsx).

---

## 🎛️ Settings Integration

**Status**: 🔴 Pending

### Add TourReplayButton to Settings

**File**: `src/components/Panels/SettingsPanel.tsx`

**Location**: After "Privacy & Analytics" section (around line 746), before "About Inkwell"

```tsx
import TourReplayButton from '@/components/Settings/TourReplayButton';

// Inside SettingsPanel component, add new section:
<section className="space-y-4">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Help & Onboarding</h2>
  <p className="text-sm text-gray-600 dark:text-gray-400">
    Replay the interactive tour or access help resources
  </p>

  <TourReplayButton />
</section>;
```

---

## 🧪 Testing Checklist

**Status**: 🔴 Pending

### Manual QA Steps

- [ ] **Mobile (viewport < 768px)**
  - [ ] Popover clamps within viewport (24px padding)
  - [ ] Backdrop click closes tour
  - [ ] Progress indicators visible
  - [ ] Touch navigation works

- [ ] **Tablet (768px - 1024px)**
  - [ ] Spotlight positioning correct
  - [ ] Popover doesn't overflow
  - [ ] Keyboard navigation works

- [ ] **Desktop (> 1024px)**
  - [ ] All 11 steps flow smoothly
  - [ ] Pulse animations don't overlap
  - [ ] Action buttons trigger navigation
  - [ ] Progress bar updates correctly

### Functional Tests

- [ ] **Tour Start**: Fires automatically on first login
- [ ] **Tour Resume**: Continues from last step after refresh
- [ ] **Tour Replay**: Settings button resets and restarts tour
- [ ] **Tour Skip**: Skip button exits tour gracefully
- [ ] **Keyboard Nav**: Arrow keys, Escape work correctly
- [ ] **Missing Elements**: Fallback message shows when element not found
- [ ] **Analytics**: Events fire and can be intercepted

### Browser Tests

- [ ] **Chrome**: All features work
- [ ] **Safari**: Scroll containment works correctly
- [ ] **Firefox**: Animations smooth
- [ ] **Edge**: Full compatibility

---

## 📝 Next Actions

1. **Find component locations** for remaining triggers (steps 5-12)
2. **Add triggers** to all component mount effects and action handlers
3. **Add data-tour attributes** throughout UI
4. **Wire analytics** events to backend
5. **Add TourReplayButton** to Settings
6. **Run full QA pass** across all devices
7. **Document** any edge cases or customizations

---

## 🔧 Troubleshooting

### Tour doesn't start

- Check `dashboardView` trigger fires in AuthContext
- Verify `safeAutoStart()` called in dashboard/app provider
- Check localStorage keys (`inkwell.tour.onboarding.*`)

### Selectors not resolving

- Add `data-tour` attributes to missing elements
- Check console for `[tour] Could not resolve target` warnings
- Verify elements exist in DOM when tour starts

### Analytics not tracking

- Check `inkwell_analytics` event listener registered
- Verify DNT (Do Not Track) not enabled in browser
- Check console for `[tour-analytics]` logs

---

## 📚 Documentation

- [Tour Integration Guide](./TOUR_INTEGRATION_GUIDE.md) - Complete usage guide
- [Inkwell Spotlight Tour](./INKWELL_SPOTLIGHT_TOUR.md) - Original tour spec
- [Tour Overlay Tests](../src/components/Onboarding/__tests__/InkwellTourOverlay.test.tsx) - Test examples

---

**Last Updated**: 2025-10-18
**Integration Progress**: 3/15 steps complete (20%)
