# PWA and Authentication QA Checklist

This checklist covers the manual verification steps for the fixes to PWA manifest delivery and authentication flow issues.

## PWA Manifest and Icons

- [ ] Visit inkwel.leadwithnexus.com and verify the following:
  - [ ] `/site.webmanifest` loads as valid JSON with correct content-type header
  - [ ] Verify icon paths in manifest are accessible (check `/icons/icon-192x192.png`, etc.)
  - [ ] Chrome DevTools > Application > Manifest shows valid data
  - [ ] DevTools > Application > Service Workers shows the registered service worker
  - [ ] Desktop: "Install app" option appears in browser menu (Chrome/Edge)
  - [ ] Mobile: "Add to Home Screen" works properly

## Authentication Flow

- [ ] Sign out completely, then:
  - [ ] Visit the homepage and verify proper redirect to sign-in
  - [ ] Sign in successfully and verify redirect to dashboard
  - [ ] Sign out, then sign in again to verify no redirect loop occurs
  - [ ] Verify protected routes require authentication
  - [ ] Verify public routes are accessible without authentication
  - [ ] Try direct navigation to /dashboard when logged out - should redirect to sign-in
  - [ ] Try direct navigation to /dashboard when logged in - should show dashboard

## Spotlight Tour Feature QA

### Visual & Layout

- [ ] **Mask rendering**
  - [ ] Dark overlay appears when tour starts
  - [ ] Spotlight cutout highlights the correct element
  - [ ] Focus ring is visible around the spotlight (2px blue border with shadow)
  - [ ] Mask updates smoothly when navigating between steps
  - [ ] No visual glitches or flickering during transitions

- [ ] **Tooltip positioning**
  - [ ] Tooltip appears in the correct position relative to the target
  - [ ] Tooltip never goes off-screen (clamps to viewport edges)
  - [ ] Auto-placement algorithm chooses the best direction when set to 'auto'
  - [ ] Manually test all 4 placements: top, bottom, left, right
  - [ ] Tooltip repositions correctly on window resize
  - [ ] Tooltip repositions correctly on scroll (including within scroll containers)

- [ ] **Responsive design**
  - [ ] Tour works on mobile viewport (375px width)
  - [ ] Tour works on tablet viewport (768px width)
  - [ ] Tour works on desktop viewport (1920px width)
  - [ ] Tooltip text is readable at all viewport sizes
  - [ ] Navigation buttons are accessible on small screens

### Functional Testing

- [ ] **Tour start/stop**
  - [ ] Tour starts successfully when triggered
  - [ ] First step highlights the correct element
  - [ ] Tour closes when clicking "Close" button
  - [ ] Tour closes when pressing Escape key
  - [ ] Tour completes when reaching the last step and clicking "Finish"

- [ ] **Navigation**
  - [ ] "Next" button advances to the next step
  - [ ] "Previous" button goes back to the previous step
  - [ ] "Skip" button exits the tour early
  - [ ] Arrow Right key advances to next step
  - [ ] Arrow Left key goes back to previous step
  - [ ] Escape key closes the tour
  - [ ] Enter key advances to next step
  - [ ] First step disables/hides "Previous" button
  - [ ] Last step changes "Next" to "Finish"

- [ ] **Target resolution**
  - [ ] All tour targets are highlighted correctly
  - [ ] Fallback selectors work if primary selector is missing
  - [ ] Tour handles missing targets gracefully (shows tooltip without spotlight)
  - [ ] Console warns when a target element is not found
  - [ ] Tour can navigate to different routes for route-based steps

- [ ] **State persistence**
  - [ ] Tour completion state is saved to IndexedDB
  - [ ] Tour doesn't auto-start if already completed
  - [ ] Tour can be restarted from help menu
  - [ ] Completion state survives page refresh
  - [ ] Completion state is reset if tour version changes

### Accessibility

- [ ] **Keyboard navigation**
  - [ ] Tab key moves focus between buttons in the tooltip
  - [ ] Tab key is trapped within the tour overlay (doesn't reach background content)
  - [ ] Shift+Tab reverses focus direction
  - [ ] Escape key closes the tour from any focused element
  - [ ] Arrow keys work from anywhere (not just when focused on buttons)

- [ ] **Screen reader support**
  - [ ] Tour overlay has `role="dialog"` and `aria-modal="true"`
  - [ ] Step changes are announced via ARIA live region
  - [ ] Tooltip content is announced when a step appears
  - [ ] Navigation buttons have clear labels (e.g., "Next step", "Previous step")
  - [ ] Progress indicator is announced (e.g., "Step 2 of 8")
  - [ ] Test with VoiceOver (macOS) or NVDA (Windows)

- [ ] **Focus management**
  - [ ] Focus moves to the tooltip when a step appears
  - [ ] Focus is restored to the original element when tour closes
  - [ ] Focus is trapped within the tour overlay (can't tab to background)
  - [ ] Focus is visible (focus ring on buttons)

### Dark Mode

- [ ] **Visual consistency**
  - [ ] Mask opacity is appropriate in dark mode (not too light or dark)
  - [ ] Tooltip has correct background color in dark mode
  - [ ] Text is legible in dark mode (sufficient contrast)
  - [ ] Focus ring is visible in dark mode
  - [ ] Buttons have proper hover/active states in dark mode

### Performance

- [ ] **Rendering**
  - [ ] Tour overlay appears within 100ms of triggering
  - [ ] Step transitions are smooth (no jank or stuttering)
  - [ ] Scrolling is smooth during the tour
  - [ ] No performance warnings in console
  - [ ] No memory leaks when starting/stopping tour repeatedly

- [ ] **Viewport updates**
  - [ ] Resize events are throttled (no excessive re-renders)
  - [ ] Scroll events are throttled
  - [ ] Anchor rect updates smoothly during scroll

### Analytics

- [ ] **Event tracking**
  - [ ] `tour_started` event fires when tour begins
  - [ ] `tour_step_viewed` event fires for each step viewed
  - [ ] `tour_completed` event fires when tour finishes
  - [ ] `tour_skipped` event fires when tour is exited early
  - [ ] All events have correct properties (tourId, stepId, etc.)
  - [ ] Events are not duplicated

### Edge Cases

- [ ] **Missing elements**
  - [ ] Tour handles missing target elements gracefully
  - [ ] Shows tooltip without spotlight if target is missing
  - [ ] Provides "Skip Step" option for missing targets
  - [ ] Console logs a warning for missing targets

- [ ] **Scroll containers**
  - [ ] Tour works with targets inside scrollable containers
  - [ ] Target scrolls into view when step appears
  - [ ] Tooltip repositions when scrolling within container

- [ ] **Route navigation**
  - [ ] Tour navigates to the correct route for route-based steps
  - [ ] Tour waits for navigation to complete before highlighting target
  - [ ] Tour handles navigation errors gracefully (skips step or shows error)

- [ ] **Multiple instances**
  - [ ] Only one tour can run at a time
  - [ ] Starting a new tour closes any existing tour

- [ ] **Background interaction**
  - [ ] Background content is not interactive while tour is active
  - [ ] Clicking background (outside tooltip) does not close tour
  - [ ] OR: Clicking background closes tour (if that behavior is desired)

### Browser Compatibility

Test in the following browsers:

- [ ] **Chrome** (latest version)
  - [ ] Desktop
  - [ ] Mobile (Android)

- [ ] **Firefox** (latest version)
  - [ ] Desktop
  - [ ] Mobile (Android)

- [ ] **Safari** (latest version)
  - [ ] Desktop (macOS)
  - [ ] Mobile (iOS)

- [ ] **Edge** (latest version)
  - [ ] Desktop

### Integration Tests

- [ ] **First-run experience**
  - [ ] Tour auto-starts for new users after signup
  - [ ] Tour doesn't auto-start for returning users
  - [ ] Tour can be restarted from help menu

- [ ] **Sample project**
  - [ ] Sample project is created correctly
  - [ ] Tour targets in sample project are highlighted correctly
  - [ ] Tour navigates through sample project routes

## MutationObserver Usage (Tour/Onboarding)

- [ ] Test onboarding tour initiation:
  - [ ] Verify no console errors related to MutationObserver or DOM manipulation
  - [ ] Tour highlights appear correctly on relevant elements
  - [ ] Tour navigation works (next/previous)
  - [ ] Closing tour works
  - [ ] Tour restarts properly when triggered again

## Specific Edge Cases

- [ ] Test refreshing the page when on the dashboard - should remain on dashboard
- [ ] Test refreshing the page during onboarding - should maintain state
- [ ] Test opening multiple tabs - auth state should be consistent
- [ ] Test connection interruptions - app should recover when connection returns
- [ ] Test after clearing browser cache - PWA should reinstall correctly

## Performance

- [ ] Verify page load times are reasonable (< 3s for initial load)
- [ ] Verify smooth transitions between authenticated views
- [ ] Verify tour animations are smooth and don't cause layout shifts

## Post-Deployment Verification

- [ ] Clear Vercel cache if needed
- [ ] Verify PWA manifest and icons load properly on production
- [ ] Verify auth flow works properly in production
- [ ] Verify tour works properly in production
- [ ] Check analytics dashboard for tour events

## Notes

- For any issues found, document:
  - Browser and version
  - Device/OS
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots or video if applicable
