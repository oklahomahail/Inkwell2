# Inkwell Supabase Integration - Complete Checklist

Track your progress integrating Supabase cloud sync while maintaining local-first architecture.

## Phase 0: Prerequisites ✅

- [x] Supabase package installed (`@supabase/supabase-js@^2.75.1`)
- [x] Client configured (`src/lib/supabaseClient.ts`)
- [x] Auth context exists (`src/context/AuthContext.tsx`)
- [x] IndexedDB service for local storage
- [x] Migration files created
  - [x] `supabase/migrations/20250119000000_auto_create_profiles.sql`
  - [x] `supabase/migrations/2025-10-28_inkwell_schema.sql`

## Phase 1: Environment Setup

### Get Supabase Credentials

- [ ] Go to https://app.supabase.com
- [ ] Create project or select existing
- [ ] Copy Project Reference ID: `_______________`
- [ ] Copy Project URL from Settings → API
- [ ] Copy Anon Key from Settings → API

### Configure Local Environment

- [ ] Create `.env.local` file (or run `./scripts/setup-supabase.sh`)
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Add `VITE_ENABLE_SUPABASE_SYNC=false` (feature flag)
- [ ] Verify `.env.local` is in `.gitignore` ✅ (already configured)

### Configure Production Environment

- [ ] Add environment variables in Vercel/Netlify:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_ENABLE_SUPABASE_SYNC=false`

## Phase 2: Database Migration

### Run Migration (Choose ONE method)

#### Method A: Dashboard (Recommended)

- [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/sql
- [ ] Click "New query"
- [ ] Open `supabase/migrations/2025-10-28_inkwell_schema.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL editor
- [ ] Click "Run" or press `Cmd+Enter`
- [ ] Verify "Success. No rows returned"

#### Method B: CLI

- [ ] Run `npx supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Run `npx supabase db push`

#### Method C: VS Code Task

- [ ] Press `Cmd+Shift+P` → "Run Task"
- [ ] Select "Supabase: Setup (Interactive)"
- [ ] Follow prompts

### Verify Migration Success

- [ ] Open https://app.supabase.com/project/YOUR_PROJECT/editor
- [ ] Verify table `profiles` exists
- [ ] Verify table `projects` exists
- [ ] Verify table `project_members` exists
- [ ] Verify table `chapters` exists
- [ ] Verify table `characters` exists
- [ ] Verify table `notes` exists

### Verify RLS Enabled

- [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/auth/policies
- [ ] Confirm RLS enabled on `profiles`
- [ ] Confirm RLS enabled on `projects`
- [ ] Confirm RLS enabled on `project_members`
- [ ] Confirm RLS enabled on `chapters`
- [ ] Confirm RLS enabled on `characters`
- [ ] Confirm RLS enabled on `notes`

### Verify Indexes

- [ ] Check Database → Indexes in dashboard
- [ ] Confirm `idx_projects_owner_updated` exists
- [ ] Confirm `idx_chapters_project_updated` exists
- [ ] Confirm `idx_characters_project_updated` exists
- [ ] Confirm `idx_notes_project_updated` exists

### Verify Triggers

- [ ] Check Database → Triggers
- [ ] Confirm `on_auth_user_created` trigger exists on `auth.users`

## Phase 3: Authentication Configuration

### Configure Auth URLs

- [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration

### Site URL

- [ ] Development: `http://localhost:5173`
- [ ] Production: `https://inkwell.leadwithnexus.com`

### Redirect URLs (add all)

- [ ] `http://localhost:5173`
- [ ] `http://localhost:5173/auth/callback`
- [ ] `http://localhost:5173/auth/update-password`
- [ ] `https://inkwell.leadwithnexus.com`
- [ ] `https://inkwell.leadwithnexus.com/auth/callback`
- [ ] `https://inkwell.leadwithnexus.com/auth/update-password`

### Email Templates (optional)

- [ ] Go to Authentication → Email Templates
- [ ] Verify password reset points to `/auth/update-password`
- [ ] Verify magic link points to `/auth/callback`

## Phase 4: Type Safety (Optional but Recommended)

- [ ] Run `npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/supabase.ts`
- [ ] Verify `src/types/supabase.ts` created
- [ ] Import types in repository files

## Phase 5: Basic Testing

### Test Authentication

- [ ] Start dev server: `npm run dev`
- [ ] Sign up with test email
- [ ] Check Dashboard → Authentication → Users
- [ ] Verify new user appears
- [ ] Check Table Editor → profiles
- [ ] Verify profile auto-created for user

### Test RLS

- [ ] Go to SQL Editor
- [ ] Run: `SELECT auth.uid();`
- [ ] Should return your user ID (UUID)
- [ ] Run: `SELECT * FROM profiles;`
- [ ] Should only show your profile

### Test Projects Table

- [ ] Create a project in your app
- [ ] Check Table Editor → projects
- [ ] Verify new row with your `auth.uid()` as `owner_id`
- [ ] Verify `title` and `summary` populated

### Test with Second User

- [ ] Sign up second test user
- [ ] Try to query first user's projects
- [ ] Should return empty (RLS blocking)

## Phase 6: Implement Sync Infrastructure

### Create Sync Queue

- [ ] Create `src/sync/queue.ts` (see starter pack)
- [ ] Add `sync_queue` store to IndexedDB schema
- [ ] Implement `enqueue()` method
- [ ] Implement `dequeueBatch()` method
- [ ] Implement `acknowledge()` method

### Create Conflict Detection

- [ ] Create `src/sync/conflict.ts`
- [ ] Implement `isConflict()` function
- [ ] Implement `nextRev()` function
- [ ] Add conflict resolution strategy

### Create Sync Manager

- [ ] Create `src/sync/useSyncManager.ts`
- [ ] Implement background sync worker (5s interval)
- [ ] Implement batch push logic
- [ ] Add status tracking (idle/syncing/error)
- [ ] Handle network errors gracefully

## Phase 7: Implement Repositories

### Project Repository

- [ ] Create `src/data/repositories/projectRepo.ts`
- [ ] Implement `createProject()`
- [ ] Implement `listProjects()`
- [ ] Implement `updateProject()`
- [ ] Implement `deleteProject()` (soft delete)

### Chapter Repository

- [ ] Create `src/data/repositories/chapterRepo.ts`
- [ ] Implement `fetchChapters()`
- [ ] Implement `upsertChapters()`
- [ ] Implement `deleteChapter()` (soft delete)

### Character Repository

- [ ] Create `src/data/repositories/characterRepo.ts`
- [ ] Implement `fetchCharacters()`
- [ ] Implement `upsertCharacters()`
- [ ] Implement `deleteCharacter()` (soft delete)

### Note Repository

- [ ] Create `src/data/repositories/noteRepo.ts`
- [ ] Implement `fetchNotes()`
- [ ] Implement `upsertNotes()`
- [ ] Implement `deleteNote()` (soft delete)

## Phase 8: Integrate Sync with Local Writes

### Hook up Chapters

- [ ] Update chapter save logic to enqueue sync
- [ ] Increment `client_rev` on each edit
- [ ] Generate `client_hash` (optional)
- [ ] Test local write → queue → sync

### Hook up Characters

- [ ] Update character save logic to enqueue sync
- [ ] Increment `client_rev` on each edit
- [ ] Test sync

### Hook up Notes

- [ ] Update note save logic to enqueue sync
- [ ] Increment `client_rev` on each edit
- [ ] Test sync

### Hook up Projects

- [ ] Update project save logic to enqueue sync
- [ ] Test sync

## Phase 9: Implement Merge Logic

### Project Open Flow

- [ ] When project opens, fetch from Supabase (if online)
- [ ] Compare `client_rev` between local and remote
- [ ] Merge newer changes into IndexedDB
- [ ] Detect conflicts and queue for resolution

### Conflict Resolution UI

- [ ] Create conflict modal/dialog
- [ ] Show local vs remote versions
- [ ] Allow user to choose version or merge
- [ ] Apply resolution and update both local + remote

## Phase 10: UI Components

### Cloud Sync Toggle

- [ ] Create `src/features/settings/CloudSyncToggle.tsx`
- [ ] Read from `VITE_ENABLE_SUPABASE_SYNC` env
- [ ] Store user preference in localStorage
- [ ] Wire up to sync manager

### Local-First Badge

- [ ] Create `src/components/Badges/LocalFirstBadge.tsx`
- [ ] Show online/offline status
- [ ] Show sync status (idle/syncing/error)
- [ ] Add to app header/status bar

### Sync Status Indicator

- [ ] Add sync icon to UI
- [ ] Show last sync time
- [ ] Show pending items count
- [ ] Add manual sync button

## Phase 11: Data Migration (Opt-in)

### Export Current Data

- [ ] Create "Export to Cloud" command per project
- [ ] Read from IndexedDB
- [ ] Transform to Supabase format
- [ ] Batch upload via repositories
- [ ] Show progress indicator

### Auto-Backup

- [ ] On first successful sync, create `.inkwell` backup
- [ ] Store backup in downloads
- [ ] Add "Download Backup" option in Settings

## Phase 12: Quality Assurance

### Offline Flow

- [ ] Turn off network
- [ ] Create project
- [ ] Edit chapters
- [ ] Turn on network
- [ ] Verify sync happens
- [ ] Check Supabase for rows

### Conflict Flow

- [ ] Edit same chapter in two browsers
- [ ] Make different changes
- [ ] Trigger sync
- [ ] Verify conflict detected
- [ ] Resolve conflict
- [ ] Verify resolution synced

### Performance

- [ ] Test with 100+ chapters
- [ ] Verify batch sync is performant
- [ ] Check IndexedDB query speed
- [ ] Monitor network payload size

### Error Handling

- [ ] Test with invalid credentials
- [ ] Test with network timeout
- [ ] Test with RLS policy violation
- [ ] Verify graceful degradation

## Phase 13: Documentation Updates

### User-Facing Docs

- [ ] Update docs/features/sync.md
- [ ] Replace "offline-first" with "local-first with cloud sync"
- [ ] Add sync toggle documentation
- [ ] Add conflict resolution guide

### Developer Docs

- [ ] Document repository pattern
- [ ] Document sync queue architecture
- [ ] Add sequence diagrams
- [ ] Document conflict detection algorithm

### Marketing Copy

- [ ] Update website hero copy
- [ ] Update README.md
- [ ] Update meta descriptions
- [ ] Update app About/Welcome content

## Phase 14: Messaging Cleanup

### Find Old "Offline-First" Claims

- [ ] Run `bash scripts/find-offline-claims.sh`
- [ ] Update all hits with new messaging
- [ ] Search for "offline only"
- [ ] Search for "no internet required"

### New Messaging

- [ ] "Local-first writing app with optional cloud sync"
- [ ] "Works offline, syncs when you're online"
- [ ] "Your work saves on your device and syncs securely to the cloud"

## Phase 15: Production Rollout

### Pilot Phase

- [ ] Enable `VITE_ENABLE_SUPABASE_SYNC=true` for internal accounts
- [ ] Test with real projects
- [ ] Monitor error logs in Supabase
- [ ] Collect feedback

### Monitoring

- [ ] Add telemetry for sync events
- [ ] Track batch sizes
- [ ] Track conflict frequency
- [ ] Track sync duration

### Gradual Rollout

- [ ] Enable for 10% of users
- [ ] Monitor for 1 week
- [ ] Enable for 50% of users
- [ ] Monitor for 1 week
- [ ] Enable for 100% of users

### Feature Flag Flip

- [ ] Change default to `VITE_ENABLE_SUPABASE_SYNC=true`
- [ ] Update documentation
- [ ] Announce cloud sync availability

## Phase 16: Future Enhancements

### Collaboration

- [ ] Implement real-time presence
- [ ] Add Supabase Realtime subscriptions
- [ ] Show who's editing what
- [ ] Add collaborative cursors

### Storage

- [ ] Add Supabase Storage bucket for attachments
- [ ] Implement image upload
- [ ] Implement `.inkwell` export storage

### Advanced Features

- [ ] Version history per chapter
- [ ] Restore from specific version
- [ ] Compare versions side-by-side
- [ ] Branch/fork projects

## Success Metrics

Your integration is complete when:

- ✅ Users can create projects and they sync to Supabase
- ✅ Users can edit chapters offline and sync when online
- ✅ Conflicts are detected and can be resolved
- ✅ RLS prevents unauthorized access
- ✅ Performance is acceptable (< 1s for batch sync)
- ✅ Error handling is graceful (no data loss)
- ✅ Documentation is updated
- ✅ Feature flag can be toggled per user

## Resources

- [Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)
- [Quick Start](./SUPABASE_QUICKSTART.md)
- [Setup Guide](./SUPABASE_SETUP_GUIDE.md)
- [Starter Pack Code](./SUPABASE_STARTER_PACK.md)
- [Supabase Dashboard](https://app.supabase.com)

---

**Current Phase**: Phase 1 (Environment Setup)

**Next Action**: Run `./scripts/setup-supabase.sh` or create `.env.local` manually
