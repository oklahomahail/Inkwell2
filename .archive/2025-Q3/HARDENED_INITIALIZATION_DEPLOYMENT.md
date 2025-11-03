# Hardened Initialization - Deployment Checklist

**Pre-deployment verification for hardened initialization features.**

---

## Pre-Deployment Testing

### Unit Tests ✅

- [x] All utility tests passing
  - `safeObserver.test.ts` - 6/6 tests
  - `waitForRoot.test.ts` - 6/6 tests
  - `theme.test.ts` - 12/12 tests
  - `anchors.test.ts` - 28/28 tests
  - `useSpotlightAutostartHardened.test.tsx` - 12/12 tests

**Total: 64/64 tests passing**

```bash
# Run tests
pnpm test safeObserver waitForRoot theme anchors useSpotlightAutostartHardened
```

---

### E2E Tests (Playwright)

- [ ] Theme initialization tests
  - [ ] No flash on initial load
  - [ ] Theme persists across reloads
  - [ ] Works in private browsing
  - [ ] Never adds `.light` class

- [ ] Tour stability tests
  - [ ] Waits for anchors before starting
  - [ ] Doesn't start twice
  - [ ] Handles missing anchors gracefully
  - [ ] Observer doesn't crash

- [ ] Root readiness tests
  - [ ] Mounts after DOM ready
  - [ ] Handles delayed loading
  - [ ] Cleans up properly

```bash
# Run E2E tests (requires dev server running)
pnpm dev # In one terminal
pnpm test:e2e # In another terminal
```

---

## Manual Browser Testing

### Chrome (Latest)

- [ ] Fresh load - no theme flash
- [ ] Tour starts when anchors ready
- [ ] No console errors
- [ ] Private browsing works

### Safari (Latest)

- [ ] Fresh load - no theme flash
- [ ] Tour starts when anchors ready
- [ ] No console errors
- [ ] Private browsing works

### Firefox (Latest)

- [ ] Fresh load - no theme flash
- [ ] Tour starts when anchors ready
- [ ] No console errors
- [ ] Private browsing works

---

## Performance Checks

### Lighthouse (Chrome DevTools)

Target scores:

- Performance: >= 90
- Accessibility: >= 95
- Best Practices: >= 90
- SEO: >= 95

```bash
# Run Lighthouse
lighthouse http://localhost:5173 --view
```

Key metrics:

- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.8s

---

## Code Quality

### ESLint

```bash
pnpm lint
```

- [ ] No errors
- [ ] No warnings (or documented exceptions)

### TypeScript

```bash
pnpm typecheck
```

- [ ] No type errors
- [ ] All new files have proper types

### Test Coverage

```bash
pnpm test --coverage
```

- [ ] Overall coverage >= 80%
- [ ] New utilities coverage >= 90%

---

## Functionality Checklist

### Theme Management

- [ ] Page loads with light theme by default
- [ ] Dark theme can be toggled
- [ ] Theme persists on reload
- [ ] Works in private browsing (graceful fallback)
- [ ] No flash of unstyled content (FOUC)
- [ ] No flash of incorrect theme (FOIT)

### Tour Autostart

- [ ] Tour starts on dashboard for first-time users
- [ ] Tour waits for all anchors to be ready
- [ ] Tour doesn't start twice in same session
- [ ] Tour doesn't start on excluded paths
- [ ] Failed tour start logs helpful error

### DOM Readiness

- [ ] React mounts after DOM ready
- [ ] No "root not found" errors
- [ ] Works with slow network connections
- [ ] Works with React StrictMode (dev)

### Observers

- [ ] No observer crashes on rapid DOM changes
- [ ] Observers cleanup on component unmount
- [ ] No memory leaks (check DevTools Memory tab)

---

## Edge Cases

### Network Conditions

- [ ] Slow 3G - page still loads correctly
- [ ] Offline - graceful degradation
- [ ] Intermittent connectivity - no crashes

### Browser Quirks

- [ ] iOS Safari - no issues
- [ ] Chrome on Android - no issues
- [ ] Firefox private mode - no issues

### User Scenarios

- [ ] First-time user - tour starts automatically
- [ ] Returning user - no tour autostart
- [ ] User closes tour mid-way - doesn't restart
- [ ] User manually restarts tour - works correctly

---

## Rollback Plan

If issues are found in production:

1. **Immediate:** Comment out tour autostart integration

   ```typescript
   // In App.tsx or wherever AutoStartTourIntegration is used
   // <AutoStartTourIntegration />
   ```

2. **Quick Fix:** Revert to old theme initialization

   ```typescript
   // In index.html, replace inline script with:
   <script>
     if (localStorage.theme === 'dark') {
       document.documentElement.classList.add('dark');
     }
   </script>
   ```

3. **Full Rollback:** Revert to previous commit
   ```bash
   git revert <commit-hash>
   ```

---

## Deployment Steps

### Staging Environment

1. **Deploy to staging**

   ```bash
   git checkout main
   git pull origin main
   # Deploy to staging
   ```

2. **Run smoke tests**
   - [ ] Homepage loads
   - [ ] Sign in works
   - [ ] Dashboard loads
   - [ ] Tour can start manually

3. **Check logs for errors**
   - [ ] No client-side errors in browser console
   - [ ] No server errors in logs
   - [ ] No increase in error rates

4. **Monitor for 24 hours**
   - [ ] No user reports of issues
   - [ ] Analytics look normal
   - [ ] Performance metrics stable

### Production Environment

1. **Pre-deployment**
   - [ ] All staging checks pass
   - [ ] Product owner approval
   - [ ] Team notification sent

2. **Deploy**

   ```bash
   git tag -a v1.3.3 -m "Hardened initialization and tour autostart"
   git push origin v1.3.3
   # Deploy to production
   ```

3. **Post-deployment monitoring (first 1 hour)**
   - [ ] Check error rates (should not increase)
   - [ ] Check performance metrics (should not degrade)
   - [ ] Spot-check in production (incognito window)
   - [ ] Monitor user feedback channels

4. **Extended monitoring (first 24 hours)**
   - [ ] Tour completion rates
   - [ ] Browser error rates
   - [ ] User engagement metrics
   - [ ] Any bug reports

---

## Success Criteria

**Metrics to track:**

1. **Theme Flash Rate:** 0% (measure via RUM or user reports)
2. **Tour Start Success:** >95% (when conditions are met)
3. **Console Error Rate:** No increase from baseline
4. **Performance Score:** No decrease >5 points
5. **User Complaints:** No increase

**Consider successful if:**

- All tests pass
- No increase in error rates after 24 hours
- No performance degradation
- No user complaints about theme or tour

---

## Post-Deployment

### Week 1

- [ ] Review analytics for tour completion
- [ ] Check for any error spikes
- [ ] Gather user feedback

### Week 2

- [ ] Consider removing old tour code if successful
- [ ] Document any learnings
- [ ] Plan next improvements

---

## Sign-Off

**Tested By:** ****\*\*****\_****\*\***** Date: **\_\_\_**

**Approved By:** ****\*\*****\_****\*\***** Date: **\_\_\_**

**Deployed By:** ****\*\*****\_****\*\***** Date: **\_\_\_**

---

## Notes

_Add any additional notes, exceptions, or observations here._
