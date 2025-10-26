# Smoke Test Checklist for Brand & UI Fixes

## ✅ Assets

### Logo Files

- [ ] Verify `/assets/brand/inkwell-logo-horizontal.png` returns 200 status in production
- [ ] Verify `/assets/brand/inkwell-lockup-horizontal.svg` exists and loads
- [ ] Check all wordmark SVGs load correctly:
  - `/assets/brand/inkwell-wordmark-navy.svg`
  - `/assets/brand/inkwell-wordmark-gold.svg`

### Preload Configuration

- [x] Added `rel="preload"` for lockup in `index.html` (line 10)
- [x] Set `fetchpriority="high"` for above-the-fold logo

### Cache Headers

- [ ] Verify `/assets/brand/*` has `Cache-Control: public, max-age=31536000, immutable` in production
- [ ] Test asset loading in incognito/private mode

## ✅ Theme System

### Initialization

- [x] No hardcoded `class="dark"` in HTML
- [x] Theme defaults to `light` on fresh storage
- [x] Theme key namespaced as `inkwell:theme` (not `inkwell.theme`)
- [ ] Verify theme persists across page reloads
- [ ] Test theme toggle on all major routes

### Visual Testing

- [ ] Run Lighthouse accessibility audit
- [ ] Verify blue/gold contrast ratios meet WCAG AA at 14px:
  - Navy (`#0F2D52`) on white: ✅ should pass
  - Gold (`#CDAA47`) on navy: ⚠️ check small text/icons
- [ ] Test dark mode (if enabled) has proper contrast

## ✅ Topbar

### Sticky Header

- [x] Topbar uses `sticky top-0 z-40`
- [ ] Verify sticky header doesn't overlap modals at narrow viewport heights (< 600px)
- [ ] Test topbar on mobile/tablet breakpoints (< 768px)

### Brand Colors

- [x] Background: `bg-[#0F2D52]/95 backdrop-blur`
- [x] Border: `border-[#1C3A63]`
- [x] Gold accent: `text-[#CDAA47]` for saved status
- [ ] Verify colors match brand guidelines

### Functionality

- [ ] Auto-save status updates correctly
- [ ] All topbar buttons functional:
  - Account menu opens
  - Shortcuts modal opens
  - Command palette opens (⌘K)
  - Notifications panel opens

## ✅ Tour System

### Configuration

- [x] `VITE_ENABLE_OLD_TOUR=false` added to `.env.example`
- [x] `VITE_ENABLE_WELCOME_MODAL=false` added to `.env.example`
- [ ] Verify old tour components are tree-shaken in production build
- [ ] Confirm only Spotlight tour mounts (not legacy WelcomeModal)

### Tour Anchors

- [x] Tour anchors defined with `data-tour-id` attributes:
  - `topbar`
  - `sidebar`
  - `nav-dashboard`, `nav-writing`, `nav-planning`, etc.
  - `sidebar-new-project`
  - `help-tour-button`
- [ ] Verify all tour steps reference existing anchors
- [ ] Add resilient fallback selectors for critical steps
- [ ] Test tour on Dashboard, Writing, and Settings routes

### Developer Tools

- [x] `window.inkwellTour` exposed in dev mode for debugging
- [ ] Test tour manually via console: `window.inkwellTour.start(config)`

## ✅ New Project Button

### Sidebar Button

- [x] "New Project" button added to Sidebar
- [x] Positioned at bottom with `mt-auto pt-4 border-t`
- [x] Uses PlusCircle icon from lucide-react
- [x] Wired to `handleCreateProject`
- [x] Debounced to prevent double-creates (1000ms)
- [ ] Verify button appears on all routes
- [ ] Test rapid-click doesn't create duplicate projects

### Project Creation Flow

- [ ] Click "New Project" → creates project with unique ID
- [ ] Navigates to Dashboard view
- [ ] New project appears in sidebar (if project list exists)
- [ ] Triggers `triggerOnProjectCreated` for tour
- [ ] Focus management works correctly

### Data Attributes

- [x] `data-tour-id="sidebar-new-project"` added for tour targeting
- [ ] Verify tour can highlight button correctly

## 🧪 Regression Tests to Add

### 1. Auth Header Logo Test

```typescript
✅ Logo renders with correct src path
✅ Has width={180} height={48}
✅ Falls back gracefully on 404 (style.display = 'none')
✅ Brand tagline "Find your story. Write it well." renders
```

### 2. Theme Persistence Test

```typescript
✅ Default: light theme on fresh localStorage
✅ Persists after toggle (dark → light → dark)
✅ Uses namespaced key: 'inkwell:theme'
✅ Applies correct class to <html> element
```

### 3. Tour Button Test

```typescript
- [ ] Settings "Start Tour" button calls `TourService.start()` exactly once
- [ ] Tour button has correct `data-tour-id`
- [ ] Multiple clicks don't start multiple tours
```

### 4. Project Creation Test

```typescript
- [x] Debounce prevents double-creates
- [ ] "Create Your First Project" navigates to /projects/:id
- [ ] New project appears in sidebar
- [ ] Project has valid structure (id, name, createdAt, etc.)
```

## 🎨 Polish Items

### Image Optimization

- [ ] Add `sizes` attribute to logo images for responsive loading
- [ ] Consider using `<picture>` element for WebP/AVIF support
- [ ] Verify DPR (2x, 3x) assets exist for high-resolution displays

### Favicon & App Icons

- [x] Favicon matches new brand (`inkwell-favicon-32.png`, `inkwell-favicon.ico`)
- [x] Apple touch icon set (`inkwell-logo-icon-180.png`)
- [x] PWA icons configured in `site.webmanifest`
- [ ] Verify all icon sizes exist: 16, 32, 64, 128, 192, 256, 512
- [ ] Test icons on iOS home screen and Android

### Cache Headers (Vite/Vercel)

- [ ] Add to `vercel.json` or Vite config:
  ```json
  {
    "headers": [
      {
        "source": "/assets/brand/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
  ```

### localStorage Namespacing

- [x] Theme: `inkwell:theme` ✅
- [ ] Audit other localStorage keys:
  - Projects?
  - User preferences?
  - Tour completion state?
- [ ] Update all to use `inkwell:` prefix

### Content Security Policy (CSP)

- [ ] If serving images from CDN, add domain to CSP
- [ ] Verify no inline styles/scripts blocked in production
- [ ] Test with `Content-Security-Policy-Report-Only` first

## 🧪 Optional E2E Tests

### Tour E2E

```typescript
test('Spotlight tour completes successfully', async () => {
  // 1. Navigate to Dashboard
  // 2. Click "Start Tour" in Settings
  // 3. Verify first step highlights topbar
  // 4. Click "Next"
  // 5. Verify second step highlights sidebar
  // 6. Assert spotlight overlay visible
  // 7. Complete tour
  // 8. Verify tour completion tracked in analytics
});
```

### Project Creation E2E

```typescript
test('Create project flow', async () => {
  // 1. Click "New Project" in sidebar
  // 2. Assert navigates to /projects/:id
  // 3. Assert project appears in project list
  // 4. Assert project has default name "New Story 1"
  // 5. Edit project name
  // 6. Assert name persists
});
```

## 📊 Performance Checks

### Lighthouse Audit

- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

### Core Web Vitals

- [ ] LCP (Largest Contentful Paint): < 2.5s
  - Logo should be preloaded for better LCP
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1
  - Logo has explicit width/height ✅

### Bundle Size

- [ ] Run `pnpm build` and check chunk sizes
- [ ] Verify old tour code is tree-shaken if `ENABLE_OLD_TOUR=false`
- [ ] Check that `inkwell-logo-horizontal.png` is optimized (< 50KB)

## 🚀 Production Deployment Checklist

### Before Deploy

- [x] All tests passing locally
- [x] No TypeScript errors
- [x] No ESLint errors
- [ ] Run `pnpm build` successfully
- [ ] Test production build locally with `pnpm preview`

### After Deploy

- [ ] Verify logo loads (check Network tab for 200 status)
- [ ] Test theme toggle
- [ ] Test tour manually
- [ ] Create a test project
- [ ] Check browser console for errors
- [ ] Verify analytics/tracking works
- [ ] Test on mobile device

### Rollback Plan

- [ ] Tag current production commit: `git tag v1.x.x-stable`
- [ ] Document how to revert: `git revert <commit>` or redeploy previous version
- [ ] Monitor error tracking (Sentry, etc.) for 24 hours

---

## Notes

- **Priority**: Focus on logo, theme, and tour first (most visible to users)
- **Testing**: Manual smoke tests are acceptable for MVP, add automated tests incrementally
- **Performance**: Logo preload and caching are critical for perceived performance
- **Accessibility**: Verify keyboard navigation works for tour and all buttons
- **Browser Support**: Test in Chrome, Firefox, Safari, Edge

## Status

- [x] Assets preload configured
- [x] Theme namespacing fixed
- [x] Topbar brand colors applied
- [x] Tour env flags added
- [x] New Project button debounced
- [x] Developer tools (window.inkwellTour) exposed
- [ ] Comprehensive tests written
- [ ] Production deployment
