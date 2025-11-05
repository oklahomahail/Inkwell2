# Quick Start Docs Feature (#7) — QA Checklist

**Feature:** Integrated Quick Start documentation with Learn More link and Privacy Notice
**Branch:** `feat/v0.9.1-onboarding`
**Status:** ✅ Ready for QA
**Date:** 2025-11-05

---

## 📋 Pre-Flight Checks

- [ ] All TypeScript compilation passes with 0 errors
- [ ] All lint rules pass with 0 warnings
- [ ] All existing tests continue to pass
- [ ] No console errors in browser DevTools
- [ ] Feature flag `VITE_ENABLE_WELCOME_PROJECT` is set to `true` in `.env`

---

## 📄 Documentation Testing

### docs/onboarding.md

- [ ] File exists at `/docs/onboarding.md`
- [ ] All 10 sections are present:
  - [ ] 1. Navigating the App
  - [ ] 2. Writing Your First Scene
  - [ ] 3. Exporting Your Work
  - [ ] 4. Privacy and Telemetry
  - [ ] 5. Troubleshooting and Recovery
  - [ ] 6. Developer Tools
  - [ ] 7. Keyboard Shortcuts
  - [ ] 8. Next Steps
  - [ ] 9. Feature Highlights
  - [ ] 10. Getting Help
- [ ] All anchor links work correctly (#navigating-the-app, #privacy-and-telemetry, etc.)
- [ ] Code blocks render properly with syntax highlighting
- [ ] Markdown formatting is correct (headers, lists, bold, italic)
- [ ] No broken links to external resources
- [ ] Document version is v0.9.1
- [ ] Last updated date is November 2025

---

## 🔗 LearnMoreLink Component

### Basic Functionality

- [ ] Component renders without errors
- [ ] Link text defaults to "Learn More" when no children provided
- [ ] Custom text displays when children prop is passed
- [ ] Link has blue color (#3b82f6) on default
- [ ] Link has darker blue (#2563eb) on hover
- [ ] Link has underline decoration
- [ ] Custom className is applied correctly

### Click Behavior

- [ ] Clicking link opens new tab/window
- [ ] New tab shows `/docs/onboarding.md` content
- [ ] New tab has `noopener,noreferrer` security attributes
- [ ] Link preventDefault works (doesn't navigate in current tab)
- [ ] Telemetry event `onboarding.learn_more.clicked` is fired
- [ ] Telemetry payload includes `{ sample: 1 }`

### Accessibility

- [ ] Link is keyboard accessible (Tab + Enter works)
- [ ] Screen reader announces link correctly
- [ ] Focus indicator is visible
- [ ] ARIA attributes are correct

---

## 🔒 PrivacyNotice Component

### Basic Rendering

- [ ] Component renders without errors
- [ ] Summary text displays correctly
- [ ] Text color is gray-500 (#6b7280)
- [ ] Font size is xs (0.75rem)
- [ ] Max width is prose (~65ch)
- [ ] Line height is snug (1.375)
- [ ] Custom className is applied correctly

### Conditional LearnMore

- [ ] LearnMore link shows by default
- [ ] LearnMore link hidden when `showLearnMore={false}`
- [ ] "Settings → Privacy" text is bold
- [ ] LearnMore link has xs font size
- [ ] "Read our privacy policy" link text displays

### Content Accuracy

- [ ] Summary mentions "anonymous performance data"
- [ ] Examples include "save speed and cache efficiency"
- [ ] States "No content or personal data is ever transmitted"
- [ ] Mentions Settings → Privacy for opt-out
- [ ] Link calls LearnMoreLink component correctly

---

## 📡 Telemetry Opt-Out Functionality

### isTelemetryEnabled()

- [ ] Returns `true` by default (telemetry enabled)
- [ ] Returns `false` when `inkwell_telemetry_disabled` is `'true'`
- [ ] Handles localStorage unavailable gracefully (returns `true`)
- [ ] Function is exported from telemetry.ts

### setTelemetryEnabled(enabled)

- [ ] Calling with `true` removes `inkwell_telemetry_disabled` key
- [ ] Calling with `false` sets `inkwell_telemetry_disabled` to `'true'`
- [ ] Emits `telemetry.opt_out_changed` event when enabling
- [ ] Does NOT emit event when disabling (respects opt-out)
- [ ] Handles localStorage errors gracefully (logs warning)
- [ ] Function is exported from telemetry.ts

### track() Respects Opt-Out

- [ ] Events are sent when telemetry is enabled
- [ ] Events are blocked when telemetry is disabled
- [ ] `telemetry.opt_out_changed` event bypasses opt-out check
- [ ] No console errors when telemetry is disabled
- [ ] sendBeacon API is used when available
- [ ] Fetch fallback works when sendBeacon unavailable

### Telemetry Event Types

All event types are defined in TelemetryEvent union:

- [ ] `onboarding.welcome.created`
- [ ] `onboarding.welcome.deleted`
- [ ] `onboarding.welcome.skipped`
- [ ] `onboarding.welcome.completed`
- [ ] `onboarding.tour.seen`
- [ ] `onboarding.learn_more.clicked`
- [ ] `telemetry.opt_out_changed`

---

## ⚙️ Environment Configuration

### .env.example

- [ ] Telemetry section exists after Analytics section
- [ ] `VITE_TELEMETRY_ENABLED=true` is documented
- [ ] Comment explains "anonymous telemetry collection"
- [ ] Comment lists performance metrics collected
- [ ] Comment states "Never collects content, project titles, or PII"
- [ ] Comment mentions Settings → Privacy opt-out
- [ ] List of tracked events is documented
- [ ] All onboarding events are listed

---

## 📦 Component Exports

### src/components/Onboarding/index.ts

- [ ] File exists at correct path
- [ ] Exports LearnMoreLink component
- [ ] Exports PrivacyNotice component
- [ ] Exports SkipTutorialButton component
- [ ] All exports use named export syntax
- [ ] File has JSDoc header comment

### Import Validation

- [ ] Can import: `import { LearnMoreLink } from '@/components/Onboarding'`
- [ ] Can import: `import { PrivacyNotice } from '@/components/Onboarding'`
- [ ] Can import: `import { SkipTutorialButton } from '@/components/Onboarding'`
- [ ] No circular dependency errors
- [ ] Tree-shaking works correctly

---

## 🧪 Integration Testing

### LearnMoreLink Integration

- [ ] Works in PrivacyNotice component
- [ ] Works in Welcome Project chapters
- [ ] Works in Settings → Privacy page (if implemented)
- [ ] Works in onboarding banner (if implemented)
- [ ] Multiple instances on same page work independently

### Telemetry Integration

- [ ] Opt-out setting persists across page refreshes
- [ ] Opt-out setting persists across browser restarts
- [ ] Opt-out works in multiple tabs simultaneously
- [ ] Re-enabling telemetry immediately starts tracking
- [ ] No telemetry events leak when disabled

### Cross-Browser Testing

- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Edge: All features work
- [ ] Mobile Safari: All features work
- [ ] Mobile Chrome: All features work

---

## 🔍 Edge Cases

### Error Handling

- [ ] Missing `/docs/onboarding.md` shows graceful error
- [ ] localStorage quota exceeded handled gracefully
- [ ] Popup blocker doesn't crash LearnMoreLink
- [ ] Network errors don't crash telemetry
- [ ] Invalid telemetry payloads are caught

### Performance

- [ ] LearnMoreLink renders in < 50ms
- [ ] PrivacyNotice renders in < 50ms
- [ ] Telemetry track() is non-blocking
- [ ] No memory leaks from repeated renders
- [ ] sendBeacon doesn't delay page unload

### Accessibility

- [ ] All text is readable at 200% zoom
- [ ] Color contrast meets WCAG AA standards
- [ ] Components work with screen readers
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible

---

## 📊 Telemetry Validation

### DevTools Network Tab

- [ ] `onboarding.learn_more.clicked` appears when link clicked
- [ ] Event includes `{ sample: 1 }` payload
- [ ] Event includes timestamp (ts field)
- [ ] Request uses sendBeacon or fetch with keepalive
- [ ] Request goes to `/telemetry` endpoint
- [ ] Content-Type is `application/json`

### Opt-Out Validation

- [ ] Disable telemetry in Settings
- [ ] Verify `inkwell_telemetry_disabled` is `'true'` in localStorage
- [ ] Click LearnMoreLink
- [ ] Verify NO network request to `/telemetry`
- [ ] Re-enable telemetry
- [ ] Verify `telemetry.opt_out_changed` event sent
- [ ] Verify subsequent events work normally

---

## 🎯 User Flow Testing

### First-Time User

1. [ ] Open app for the first time
2. [ ] Welcome Project appears (from Feature #6)
3. [ ] Open first chapter "Getting Started"
4. [ ] See PrivacyNotice at bottom
5. [ ] Click "Read our privacy policy" link
6. [ ] New tab opens with onboarding.md
7. [ ] Read Privacy and Telemetry section (#4)
8. [ ] Return to app
9. [ ] Verify telemetry still enabled (default)

### Opt-Out User

1. [ ] Open Settings → Privacy
2. [ ] Toggle telemetry off
3. [ ] Click LearnMoreLink somewhere
4. [ ] Verify NO telemetry event sent
5. [ ] Refresh page
6. [ ] Verify telemetry still disabled
7. [ ] Perform autosave
8. [ ] Verify NO autosave telemetry sent

### Re-Enable User

1. [ ] Open Settings → Privacy
2. [ ] Toggle telemetry back on
3. [ ] Verify `telemetry.opt_out_changed` event sent
4. [ ] Click LearnMoreLink
5. [ ] Verify `onboarding.learn_more.clicked` event sent
6. [ ] Perform autosave
7. [ ] Verify autosave telemetry events sent

---

## ✅ Acceptance Criteria

### Feature #7 Requirements Met

- [x] **docs/onboarding.md:** Comprehensive guide with 10 sections, anchors, code blocks
- [x] **LearnMoreLink:** Component opens docs in new tab, emits telemetry
- [x] **PrivacyNotice:** Summary component with conditional LearnMore link
- [x] **Telemetry Opt-Out:** localStorage-based with immediate effect
- [x] **Environment Config:** Documented in .env.example with all events listed
- [x] **Component Exports:** Clean index.ts for easy imports
- [x] **QA Checklist:** This document

### Non-Functional Requirements

- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All existing tests pass
- [ ] New components have JSDoc comments
- [ ] Code follows project conventions
- [ ] No console.log statements left in production code
- [ ] No security vulnerabilities introduced

---

## 🚀 Pre-Merge Checklist

- [ ] All QA items above are checked
- [ ] Run full test suite: `npm test`
- [ ] Run typecheck: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual browser testing completed
- [ ] DevTools shows no errors
- [ ] Network tab shows correct telemetry events
- [ ] localStorage shows correct keys
- [ ] Commit message follows convention
- [ ] Branch is up to date with `feat/v0.9.0-beta-foundation`

---

## 📝 Known Issues / Limitations

- **No Settings → Privacy Page:** Telemetry opt-out UI not yet implemented in Settings
  - Workaround: Users can manually set `localStorage.setItem('inkwell_telemetry_disabled', 'true')`
  - Follow-up: Implement Settings → Privacy page in future PR

- **No Modal for Documentation:** Currently opens in new tab instead of modal
  - Alternative: Could implement modal view in future enhancement
  - Current behavior is acceptable for v0.9.1 Beta

- **No Server-Side Telemetry Processing:** `/telemetry` endpoint must exist
  - Ensure backend endpoint is implemented before deploying
  - Graceful degradation if endpoint returns 404

---

## 🔗 References

- **Feature Spec:** Quick Start Docs Feature (#7)
- **Related Feature:** Welcome Project Template (#6)
- **Base Branch:** `feat/v0.9.0-beta-foundation`
- **Target Branch:** `feat/v0.9.1-onboarding`
- **Documentation:** `/docs/onboarding.md`

---

**Prepared by:** Claude Code
**QA Status:** Ready for manual testing
**Deployment Target:** v0.9.1 Beta (Week 2)
**Estimated QA Time:** 45-60 minutes
