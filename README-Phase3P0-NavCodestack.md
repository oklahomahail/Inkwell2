# Phase 3 P0 — Navigation Codestack

This bundle contains the unified NavContext + minimal components to wire navigation across your UI.

## Files included

- `src/context/NavContext.tsx` — reducer-based, URL/session sync, history dedup
- `src/components/ViewSwitcher.tsx` — tabs for view changes
- `src/components/Sidebar.tsx` — project/chapter/scene list wired to navigation
- `src/components/Search/SearchResults.tsx` — result list → navigate to scene
- `src/components/Views/TimelineNavList.tsx` — simple timeline→scene adapter
- `src/components/Dev/NavInspector.tsx` — dev-only inspector panel
- `src/utils/deepLink.ts` — parse query links → navigation
- `.github/workflows/*.yml` — fixed PNPM CI

## How to apply

1. Copy these files into your repo root, preserving paths. Overwrite existing files when prompted.
2. Render components where appropriate, e.g.:

   ```tsx
   import ViewSwitcher from '@/components/ViewSwitcher';
   import Sidebar from '@/components/Sidebar';
   import SearchResults from '@/components/Search/SearchResults';
   import TimelineNavList from '@/components/Views/TimelineNavList';
   import NavInspector from '@/components/Dev/NavInspector';

   <ViewSwitcher />
   <Sidebar projects={projects} />
   <NavInspector />
   ```

3. Test:
   - Click ViewSwitcher tabs → `?view=...` updates; Back/Forward works.
   - Sidebar selects project/chapter/scene → URL updates; WritingPanel reacts.
   - Search/Timeline clicks navigate to scenes.
   - Refresh with no params → last location restored.
