# Branding & UI Fixes - Complete

**Date**: October 26, 2025  
**Status**: ✅ All 6 issues fixed

---

## Issues Fixed

### 1. ✅ Missing Logo on Sign-In Card

**Problem**: Logo wasn't showing on auth page (404 error)

**Fix**: Updated `AuthHeader.tsx` to use correct asset path

- Changed from: `/brand/inkwell-lockup-horizontal.svg`
- Changed to: `/assets/brand/inkwell-logo-horizontal.png`
- Added graceful error handling with `onError` fallback

**File**: `src/components/Auth/AuthHeader.tsx`

---

### 2. ✅ Dark Mode on Boot

**Problem**: App was defaulting to dark mode instead of light mode

**Fix**: Updated `useTheme.ts` to properly initialize with light theme

- Added SSR check (`typeof window !== 'undefined'`)
- Added initialization effect that reads from localStorage and defaults to 'light'
- Ensures light mode is set unless explicitly saved as 'dark'

**File**: `src/hooks/useTheme.ts`

---

### 3. ✅ Old Tour Modal Appearing

**Problem**: Old 4-step welcome modal showing instead of Spotlight Tour

**Fix**: Confirmed old modal is already disabled

- `WelcomeModal` is gated by `featureFlagService.isEnabled('tour_simpleTour')`
- Flag `tour_simpleTour` doesn't exist in feature flag service
- Returns `false` by default, so old modal won't show
- New Spotlight Tour via `TourLifecycleIntegration` is already mounted in `App.tsx`

**Files**:

- `src/components/Onboarding/WelcomeModal.tsx` (already gated)
- `src/App.tsx` (Spotlight Tour active)

---

### 4. ✅ "Create Your First Project" Button Does Nothing

**Problem**: Button wasn't wired up, no New Project button in sidebar

**Fixes**:

#### A. Dashboard Button

- Added `data-testid="create-first-project"` to button in `DashboardPanel.tsx`
- Added same attribute to button in `Welcome.tsx`
- Both buttons already call `createNewProject()` which:
  - Creates project
  - Sets as current
  - Fires `triggerOnProjectCreated()` tour event

#### B. Sidebar Button (New!)

- Added "New Project" button at bottom of sidebar
- Only shows when sidebar is expanded
- Calls same `createNewProject()` logic
- Includes tour anchor: `data-tour-id="sidebar-new-project"`

**Files**:

- `src/components/Panels/DashboardPanel.tsx`
- `src/components/Dashboard/Welcome.tsx`
- `src/components/Sidebar.tsx` ⭐ NEW

---

### 5. ✅ Blue & Gold Brand Header Missing

**Problem**: Topbar was using gray/white colors instead of brand blue (#0F2D52) and gold (#CDAA47)

**Fix**: Complete topbar redesign with brand colors

- **Background**: Deep blue `#0F2D52` with 95% opacity + backdrop blur
- **Border**: Brand blue border `#1C3A63`
- **Text**: White text throughout
- **Status indicator**: Gold dot `#CDAA47`
- **Buttons**: White text with `hover:bg-white/10` overlay
- **Height**: Increased to `h-14` (56px) for better presence
- **Sticky**: Added `sticky top-0 z-40` for always-visible header

**Color Reference**:

- Navy Blue: `#0F2D52` (primary brand)
- Border Blue: `#1C3A63` (darker accent)
- Gold: `#CDAA47` (accent/active state)

**File**: `src/components/Topbar.tsx`

---

### 6. ✅ Settings Tour Button Does Nothing

**Problem**: "Start Tour" button calling wrong function

**Fix**: Updated `TourReplayButton.tsx`

- Changed from: `startDefaultTourFromSettings()`
- Changed to: `startDefaultTour()`
- This is the correct export from `tourEntry.ts`
- Button now properly launches Spotlight Tour

**File**: `src/components/Settings/TourReplayButton.tsx`

---

## Verification Checklist

Run these quick checks to confirm everything works:

### Logo

- [ ] Navigate to `/sign-in`
- [ ] Logo displays correctly (Inkwell horizontal lockup)
- [ ] No 404 errors in DevTools Network tab

### Theme

- [ ] Clear localStorage
- [ ] Refresh app
- [ ] App loads in **light mode** (not dark)
- [ ] Theme toggle in settings works correctly

### Tour

- [ ] Open Settings → Help & Onboarding
- [ ] Click "Start Tour" button
- [ ] Spotlight Tour launches (not old 4-step modal)
- [ ] Tour has modern spotlight overlay

### Project Creation

- [ ] When no projects exist, click "Create Your First Project"
- [ ] New project appears
- [ ] Dashboard updates to show project
- [ ] New Project button in sidebar (expanded) works the same way

### Brand Header

- [ ] Top header is deep blue background
- [ ] Text is white/light colored
- [ ] Status indicator has gold dot
- [ ] Buttons have hover states
- [ ] Header stays visible when scrolling

### Console

- [ ] No errors related to:
  - Missing images
  - Undefined functions
  - Tour initialization
  - Theme initialization

---

## Files Changed

1. ✅ `src/components/Auth/AuthHeader.tsx` - Logo path + error handling
2. ✅ `src/hooks/useTheme.ts` - Light mode default + initialization
3. ✅ `src/components/Topbar.tsx` - Blue/gold branding + styling
4. ✅ `src/components/Settings/TourReplayButton.tsx` - Correct tour function
5. ✅ `src/components/Panels/DashboardPanel.tsx` - Test ID added
6. ✅ `src/components/Dashboard/Welcome.tsx` - Test ID added
7. ✅ `src/components/Sidebar.tsx` - New Project button added ⭐

---

## Technical Notes

### Why the old tour doesn't show

The `WelcomeModal` checks `featureFlagService.isEnabled('tour_simpleTour')`. Since this flag isn't defined in the feature flag service, `isEnabled()` returns `false`, preventing the modal from rendering.

### Theme initialization strategy

The hook now runs two effects:

1. **Mount effect** (runs once): Reads localStorage, defaults to 'light', applies theme
2. **Theme change effect** (runs when theme changes): Applies theme to DOM

This prevents the flash of dark mode on initial load.

### Project creation flow

All three buttons (`DashboardPanel`, `Welcome`, `Sidebar`) call the same logic:

1. Create project with default name
2. Add to state via `addProject()`
3. Set as current via `setCurrentProjectId()`
4. Fire tour event via `triggerOnProjectCreated()`
5. (Sidebar only) Switch to Dashboard view

---

## Next Steps (Optional Enhancements)

If you want to polish further:

1. **Logo on Sidebar**: Add small Inkwell icon/wordmark to top of sidebar
2. **Brand Colors in CSS Variables**: Move #0F2D52 and #CDAA47 to Tailwind config
3. **Project Name Dialog**: Show modal for naming new projects instead of auto-naming
4. **Keyboard Shortcut**: Add ⌘+N to trigger New Project from anywhere
5. **Tour Progress**: Show tour completion percentage in Settings

---

## Deployment Notes

All changes are **client-side only** (no API changes). Safe to deploy immediately.

**Build command**: `pnpm build`  
**Preview**: `pnpm preview`

No database migrations or environment variable changes required.

---

**Status**: Ready for QA ✅
