# Phase 3 Implementation Checklist — Inkwell Spotlight Tour

This checklist is a ready-to-commit guide for completing Phase 3 of the Inkwell Spotlight Tour. It assumes Phase 2a/2b are complete with 9/11 triggers wired and passing.

Recommended path: commit this file as docs/PHASE_3_IMPLEMENTATION_CHECKLIST.md and update docs/TOUR_INTEGRATION_STATUS.md upon completion of each section.

## 1) Scope and Objectives

### Primary goals

- De‑minify two files and insert tour triggers:
  - TemplateSelector.tsx
  - EnhancedWritingEditor.tsx
- Add data-tour and data-tour-step attributes across key UI elements used by the tour.
- Wire analytics events and confirm payload schema.
- Add TourReplayButton to a user‑discoverable location (Settings or footer).
- Perform a full QA pass covering first‑run, resumed, and replay scenarios.

### Non‑goals

- Redesigning UI/UX of tour steps.
- Changing tour step order or copy (unless documented separately).

## 2) Pre‑flight Checklist

- [x] Phase 2a complete (4/4 triggers)
- [x] Phase 2b complete (7/9 triggers)
- [x] All tests passing (196 tests)
- [x] No TypeScript errors
- [x] No ESLint errors

## 3) De‑minify and Wire Remaining Triggers (2/11)

### 3.1 TemplateSelector.tsx

**Location**: src/components/ProjectTemplates/TemplateSelector.tsx (minified 1‑line file)

**Steps**:

1. Create a decompressed copy alongside the original for review:
   - TemplateSelector.decompressed.tsx
2. Use a de‑minifier or editor reformatting. If needed, split complex expressions into readable functions.
3. Insert the trigger after a successful template selection action. Suggested hook (pseudocode):

```typescript
import { triggerOnProjectCreated } from '@/utils/tourTriggers';

function onSelectTemplate(t: Template) {
  applyTemplate(t);
  try {
    triggerOnProjectCreated();
  } catch {}
}
```

4. Replace the original only after review; keep a single exported component.
5. Ensure no circular dependencies (UI components may import from @/utils, not vice‑versa).

**Acceptance**:

- [ ] File readable (< 500 lines, clear structure)
- [ ] triggerOnProjectCreated() fires after setCurrentProjectId()
- [ ] Tests pass
- [ ] No TS or lint errors

### 3.2 EnhancedWritingEditor.tsx

**Location**: src/components/Writing/EnhancedWritingEditor.tsx (minified 1‑line file)

**Trigger point options**:

- After first save event in the editor session; or
- After first time user opens the editor with content.

**Implementation sketch**:

```typescript
import { triggerWritingPanelOpen } from '@/utils/tourTriggers';

useEffect(() => {
  if (editorBooted && !hasFiredRef.current) {
    queueMicrotask(() => {
      hasFiredRef.current = true;
      triggerWritingPanelOpen();
    });
  }
}, [editorBooted]);
```

**Acceptance**:

- [ ] File readable (< 1000 lines, clear structure)
- [ ] triggerWritingPanelOpen() fires on mount or first edit
- [ ] Tests pass
- [ ] No TS or lint errors

## 4) Add data-tour Attributes

### Guidelines

- Use `data-tour` for single unique targets and `data-tour-step` for indexed collections.
- Stable selectors only. Prefer explicit wrappers over deep descendant chains.
- Ensure elements are present at the time the step runs. If not, gate the step with `waitForTarget()`.

### Examples

```tsx
// Single target
<button data-tour="create-project-btn">New Project</button>

// Indexed targets
<li data-tour-step="beat-item" data-step-index={index}>…</li>
```

**Acceptance**:

- [ ] All appendix selectors mapped
- [ ] Spot-check: 3 selectors resolve in browser DevTools
- [ ] No layout shifts or style regressions

## 5) Analytics Wiring

**File**: src/utils/tourAnalytics.ts

**Events and payloads**:

- `tour_step_viewed` — { stepId: string; order: number; route?: string }
- `tour_completed` — { totalSteps: number; durationMs?: number }
- `tour_replayed` — { source: 'settings' | 'footer' | 'cta' }

**Integration**:

```typescript
import { trackTourEvent } from '@/utils/tourAnalytics';

function onStepViewed(stepId: string, order: number) {
  trackTourEvent('tour_step_viewed', { stepId, order, route: location.pathname });
}

function onTourCompleted(totalSteps: number, durationMs?: number) {
  trackTourEvent('tour_completed', { totalSteps, durationMs });
}
```

**Debounce/Dedup**:

Use in‑module guard for step view events to avoid duplicate dispatches.

**Acceptance**:

- [ ] Events fire in browser console (dev mode)
- [ ] Payload shape matches spec
- [ ] No duplicate events in 5‑second window

## 6) Tour Replay Control

**Placement**: SettingsPanel or persistent footer.

**Component**: TourReplayButton.tsx

**Sketch**:

```tsx
import { Button } from '@/components/ui/button';
import { TourController } from '@/components/Onboarding/TourProvider';

export default function TourReplayButton() {
  return (
    <Button
      data-tour="replay-tour-btn"
      onClick={() => TourController.start('replay', { fromBeginning: true })}
    >
      Replay Tour
    </Button>
  );
}
```

**Acceptance**:

- [ ] Button visible in Settings
- [ ] Clicking replays tour from step 1
- [ ] data-tour="replay-tour-btn" present

## 7) Testing and QA

### Scenarios

- [ ] First‑run user: tour auto‑starts after magic link auth
- [ ] Resumed user: tour continues from last step after page refresh
- [ ] Replay: clicking Settings → Replay Tour restarts from beginning
- [ ] Skip: clicking Skip button exits tour and sets first‑time flag to false

### What to verify

- [ ] No console errors or warnings
- [ ] All 11 triggers fire in correct sequence
- [ ] Popover positioning correct on all viewports (mobile, tablet, desktop)
- [ ] Keyboard navigation works (arrow keys, Escape)
- [ ] Backdrop click closes tour
- [ ] Progress bar updates correctly
- [ ] Analytics events fire (check browser console)

### Commands

```bash
pnpm clean && pnpm i
pnpm test --run
pnpm tsc --noEmit
pnpm lint
pnpm build
```

## 8) Definition of Done

- [ ] All 11 triggers wired and tested
- [ ] data-tour attributes added to all key elements
- [ ] Analytics events firing correctly
- [ ] TourReplayButton added to Settings
- [ ] Full QA pass completed (first-run, resumed, replay)
- [ ] All tests passing
- [ ] No TypeScript or ESLint errors
- [ ] Build succeeds
- [ ] TOUR_INTEGRATION_STATUS.md updated

## 9) Rollback Strategy

Keep changes to minified files isolated in separate commits:

- **Commit A**: Add decompressed versions + triggers
- **Commit B**: Remove original minified file(s) in favor of readable ones

If issues arise, revert Commit B to restore prior working state, investigate offline, then re‑land.

## 10) Known Edge Cases

- React 19 Strict Mode double‑mount re‑invoking effects. Mitigate with ref guards and microtask tokens.
- Targets inside virtualized lists may not exist at step time. Use `waitForTarget()` with timeouts and clear messaging.
- Modals or drawers that capture focus; ensure popover has `aria-describedby` and returns focus on close.

## 11) Post‑Merge Tasks

- [ ] Update TOUR_INTEGRATION_STATUS.md (mark Phase 3 complete)
- [ ] Announce completion to team
- [ ] Document any new edge cases or workarounds
- [ ] Schedule Phase 4 planning (full QA + performance testing)

## Appendix A — Suggested Selector Map Additions

- `create-project-btn`
- `planner-tab-world`
- `beat-item` (indexed)
- `character-save-btn`
- `editor-root`
- `timeline-panel-root`
- `analytics-panel-root`
- `replay-tour-btn`

Align these with your existing selectorMap.ts helpers and step IDs.
