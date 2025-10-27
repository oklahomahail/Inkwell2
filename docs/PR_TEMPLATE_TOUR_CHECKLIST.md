# Tour-Related Changes Checklist

Add this section to your PR template to ensure tour system integrity.

## Tour System Updates

**If this PR affects any UI components with tour anchors, please check:**

- [ ] **Anchor Verification:** Ran `npm run verify-tour-anchors` successfully
- [ ] **Documentation:** Updated `docs/TOUR_DATA_ATTRIBUTES.md` if tour anchors were added/moved/removed
- [ ] **Tour Testing:** Manually tested affected tours to ensure they still work correctly
- [ ] **Feature Flags:** No accidental changes to tour feature flags in production config

### Tour Anchor Changes

**If you moved, renamed, or removed any `data-tour-id` attributes:**

- [ ] Updated `docs/TOUR_DATA_ATTRIBUTES.md` with new locations
- [ ] Updated tour configuration files in `src/tour/configs/`
- [ ] Tested all tours that use the affected anchors
- [ ] Verified anchor verification script passes

### New Tour Anchors

**If you added new `data-tour-id` attributes:**

- [ ] Documented in `docs/TOUR_DATA_ATTRIBUTES.md` with location and usage
- [ ] Used kebab-case naming convention (e.g., `export-button`, not `exportButton`)
- [ ] Verified ID is unique across the application
- [ ] Added to relevant tour configuration if needed

### Tour Configuration Changes

**If you modified tour configs or tour service:**

- [ ] Updated analytics tracking if event structure changed
- [ ] Updated crash shield integration if tour initialization changed
- [ ] Tested error handling and recovery flows
- [ ] Verified feature flags still control tour variants correctly

## Quick Verification Commands

```bash
# Verify tour anchors
npm run verify-tour-anchors

# Run tour-specific tests
npm test -- tour

# Check for tour-related errors
npm run lint
```

## Tour Regression Prevention

Our tour system relies on stable `data-tour-id` attributes. Changes to UI components can break tours if not handled carefully.

**Common issues to avoid:**

- Removing elements with `data-tour-id` without updating tour configs
- Changing element IDs without updating documentation
- Moving anchors to async/lazy-loaded components without testing timing
- Using inconsistent naming conventions for new anchors

**Best practices:**

- Keep `data-tour-id` attributes stable even when refactoring components
- If you must change an ID, update all references in a single PR
- Add new anchors proactively when building new features
- Test tours on different screen sizes and with different user states
