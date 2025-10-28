# Manual Verification Guide - Tour Improvements

## Quick Test Instructions

### Prerequisites

✅ Dev server is running at http://localhost:5173/

### Test Sequence

#### 1. Chrome DevTools Console Test

1. Open http://localhost:5173/ in Chrome
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Open Help menu (? icon in navigation)
5. Click the green **"Start Tour"** button at the top

**Expected Console Output:**

```
[HelpMenu] Manual tour recovery triggered
[TourController] 🎬 startTour called: id="spotlight", profileId="default", force=true
[TourController] 📝 Restart attempt recorded for "spotlight" (1 total in window)
[TourController] ✅ Tour "spotlight" started successfully
[HelpMenu] Manual tour recovery completed
```

#### 2. Restart Loop Protection Test

1. With Console still open
2. Rapidly click "Start Tour" button 4 times (within 5 seconds)

**Expected Console Output (on 4th click):**

```
[TourController] 🔄 RESTART LOOP DETECTED for "spotlight". 3 attempts in 5000ms. Blocking further restarts.
[TourController] ❌ Tour error in "spotlight": Tour restart loop detected. Please wait before trying again.
[TourController] ⚠️ Tour "spotlight" blocked due to restart loop
```

3. Wait 5+ seconds
4. Click "Start Tour" again

**Expected:**

- Tour should start successfully after cooldown period

#### 3. Safari Test

1. Open http://localhost:5173/ in Safari
2. Open Web Inspector (Cmd+Option+I)
3. Repeat steps from Chrome test
4. Verify all console logs appear
5. Verify tour starts and restart loop protection works

#### 4. Firefox Test

1. Open http://localhost:5173/ in Firefox
2. Open Developer Tools (F12)
3. Repeat steps from Chrome test
4. Verify all console logs appear
5. Verify tour starts and restart loop protection works

### Lighthouse Performance Audit

#### Chrome Lighthouse

1. Open http://localhost:5173/ in Chrome
2. Open DevTools
3. Go to "Lighthouse" tab
4. Select:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
   - Device: Desktop
   - Mode: Navigation
5. Click "Analyze page load"

**Baseline Metrics to Check:**

- Performance Score: Should be 90+
- No new console errors
- No layout shifts from tour button
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.0s
- Total Blocking Time: < 150ms

#### Check for Regressions

Compare with previous Lighthouse reports:

- [ ] Performance score unchanged or improved
- [ ] No new warnings about unused JavaScript
- [ ] No new accessibility issues
- [ ] Bundle size not significantly increased

### Visual Verification

#### Help Menu Button Appearance

1. Open Help menu
2. Verify "Start Tour" button:
   - ✅ Appears at top of menu
   - ✅ Has PlayCircle icon
   - ✅ Uses green color scheme
   - ✅ Has hover effect
   - ✅ Tooltip shows on hover

#### Tour Functionality

1. Click "Start Tour"
2. Verify:
   - ✅ Tour overlay appears
   - ✅ Spotlight highlights correct element
   - ✅ Navigation buttons work
   - ✅ Can complete tour
   - ✅ Can exit tour with ESC key

### Accessibility Test

1. Use keyboard navigation:
   - Tab to Help menu
   - Enter to open
   - Tab to "Start Tour"
   - Enter to activate

2. Screen reader test (optional):
   - Enable VoiceOver (Cmd+F5 on Mac)
   - Navigate to Help menu
   - Verify "Start Tour" is announced clearly

## Test Results Template

```markdown
## Manual Verification Results

**Date:** [DATE]
**Tester:** [NAME]

### Chrome ✅/❌

- [ ] Tour starts from Help menu
- [ ] Console logs visible
- [ ] Restart loop protection works
- [ ] Lighthouse score: [SCORE]

### Safari ✅/❌

- [ ] Tour starts from Help menu
- [ ] Console logs visible
- [ ] Restart loop protection works

### Firefox ✅/❌

- [ ] Tour starts from Help menu
- [ ] Console logs visible
- [ ] Restart loop protection works

### Performance ✅/❌

- [ ] Lighthouse Performance: [SCORE]
- [ ] No new errors
- [ ] No regressions
- [ ] Bundle size acceptable

### Issues Found

1. [Issue description]
2. [Issue description]

### Notes

[Any additional observations]
```

## Common Issues & Solutions

### Issue: Tour doesn't start

**Solution:** Check console for error messages. Try clearing localStorage and refreshing.

### Issue: Console logs not appearing

**Solution:** Ensure you're in development mode, not production build.

### Issue: Restart loop not blocking

**Solution:** Clicks must be within 5 second window. Try clicking faster.

### Issue: Button not visible in Help menu

**Solution:** Clear browser cache and refresh page.

## Reporting Results

After completing verification:

1. Fill out test results template
2. Take screenshots of any issues
3. Save Lighthouse reports
4. Update TOUR_IMPROVEMENTS_SUMMARY.md with results

---

**Happy Testing! 🎉**
