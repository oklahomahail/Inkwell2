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

## Notes

- For any issues found, document:
  - Browser and version
  - Device/OS
  - Steps to reproduce
  - Expected vs. actual behavior
