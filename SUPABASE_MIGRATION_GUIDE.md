# Supabase Migration Guide - Inkwell

## Overview

This guide walks you through integrating Supabase cloud sync into Inkwell while maintaining local-first architecture.

**Important**: Inkwell is **local-first** and works fully offline. Cloud sync is optional and can be enabled per user.

## What You're Getting

- **Local-first architecture preserved**: All reads/writes happen locally in IndexedDB
- **Optional cloud sync**: Users can enable/disable sync in settings
- **Full schema**: projects, chapters, characters, notes, profiles with RLS
- **Conflict detection**: Track changes with client_rev and client_hash
- **Secure access**: Row Level Security (RLS) ensures users only see their data

## Applying Migrations

### All-in-One (Recommended)

Push all migrations at once:

```bash
npx supabase db push
```

This applies migrations in alphabetical order automatically.

### Manual Order (if needed)

If applying manually via Dashboard SQL Editor:

1. `2025-10-28_inkwell_schema.sql` (core schema + RLS)
2. `2025-10-28_touch_updated_at.sql` (auto-touch timestamps)
3. `2025-10-28_profiles_autocreate.sql` (auto-create profiles)
4. `2025-10-28_soft_delete_helpers.sql` (views + RPC)
5. `2025-10-28_roles_write_guard.sql` (stricter permissions)
6. `2025-10-28_bulk_upsert.sql` (batch sync RPCs)
7. `2025-10-28_index_refinements.sql` (performance indexes)
8. `2025-10-28_seed_minimal.sql` (optional - for QA only)

## Architecture

```
┌─────────────────────────────────────────┐
│ User Action (edit chapter, add note)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 1. Write to IndexedDB (instant)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Queue for sync (if enabled)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Background sync to Supabase          │
│    (every 5s, batched)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Conflict detection on merge          │
│    (client_rev comparison)              │
└─────────────────────────────────────────┘
```

## Quick Start (3 Options)

### Option 1: Automated Script (Recommended)

```bash
./scripts/setup-supabase.sh
```

This will:

1. Create `.env.local` with your credentials
2. Link to your Supabase project
3. Push migrations (creates all tables)
4. Optionally generate TypeScript types

### Option 2: VS Code Tasks

1. Press `Cmd+Shift+P`
2. Type "Run Task"
3. Select "Supabase: Setup (Interactive)"

### Option 3: Manual Steps

```bash
# 1. Create .env.local
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 2. Link to project
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. Push migrations
npx supabase db push

# 4. Generate types (optional)
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_REF --schema public \
  > src/types/supabase.ts
```

## Migration File Details

**Location**: `supabase/migrations/`

### Core Schema Migration

**File**: `2025-10-28_inkwell_schema.sql`

**What it creates**:

### Tables

1. **`profiles`** - User profiles (auto-created on signup)
   - Links to auth.users
   - Stores display_name

2. **`projects`** - Writing projects
   - owner_id (references auth.users)
   - title, summary, schema_version
   - Soft delete support (deleted_at)

3. **`project_members`** - Collaboration (future)
   - Maps users to projects with roles
   - Roles: owner, editor, viewer

4. **`chapters`** - Book chapters
   - Linked to projects
   - title, body, index_in_project
   - Revision tracking: client_rev, client_hash

5. **`characters`** - Character profiles
   - name, bio, traits (jsonb)
   - Revision tracking

6. **`notes`** - Project notes
   - kind, content, tags[]
   - Revision tracking

### RLS Policies

All tables have Row Level Security enabled:

- **Projects**: Users can only see projects they own or are members of
- **Chapters/Characters/Notes**: Access controlled via `can_access_project()` function
- **Profiles**: Users can only see/edit their own profile

### Indexes

Optimized for common queries:

- `idx_projects_owner_updated` - Fast project listing
- `idx_chapters_project_updated` - Chapter queries per project
- Similar indexes for characters and notes

### Enhancement Migrations (Apply in Order)

After the core schema, apply these enhancement migrations:

#### 1. Auto-touch `updated_at`

**File**: `2025-10-28_touch_updated_at.sql`

Ensures `updated_at` is always server-controlled and accurate on every update:

- Creates `touch_updated_at()` trigger function
- Attaches to: projects, profiles, chapters, characters, notes
- **Benefit**: No client-side timestamp management needed

#### 2. Profile Auto-creation

**File**: `2025-10-28_profiles_autocreate.sql`

Automatically creates profile row on user sign-up:

- Creates `handle_new_user()` trigger function
- Triggers on `auth.users` insert
- Extracts display name from user metadata or email
- **Benefit**: No race conditions; profile always exists

#### 3. Soft Delete Helpers

**File**: `2025-10-28_soft_delete_helpers.sql`

Provides views and RPC for soft delete operations:

- Views: `*_active` (filters out deleted rows)
- RPC: `soft_delete(table, id)` for safe deletes
- **Benefit**: Clients don't need to remember `deleted_at is null` filter

#### 4. Role-based Write Guards

**File**: `2025-10-28_roles_write_guard.sql`

Enforces role-based write permissions:

- Function: `can_write_project(pid)` - checks owner/editor roles
- Updates RLS policies for stricter access control
- Viewers can read but not write
- **Benefit**: Prevents accidental overwrites by viewers

#### 5. Bulk Upsert RPCs

**File**: `2025-10-28_bulk_upsert.sql`

Efficient batch operations for sync:

- `bulk_upsert_chapters(jsonb)` - batch upsert chapters
- `bulk_upsert_characters(jsonb)` - batch upsert characters
- `bulk_upsert_notes(jsonb)` - batch upsert notes
- **Benefit**: Reduces round-trips during initial sync (200-500 rows recommended)

#### 6. Index Refinements

**File**: `2025-10-28_index_refinements.sql`

Performance indexes for conflict detection:

- Composite indexes on `(project_id, client_rev desc)`
- Partial indexes on `deleted_at is null`
- **Benefit**: Faster conflict scans and view queries

#### 7. Minimal Seed Data (Optional)

**File**: `2025-10-28_seed_minimal.sql`

Creates demo project with sample data for QA:

- Demo project with chapter, character, and note
- Run manually when needed for testing
- **Benefit**: Quick validation of RLS and sync

## Verification Steps

### 1. Check Tables Exist

Go to: https://app.supabase.com/project/YOUR_PROJECT/editor

You should see:

- ✅ profiles
- ✅ projects
- ✅ project_members
- ✅ chapters
- ✅ characters
- ✅ notes

### 2. Verify RLS Enabled

Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/policies

Each table should show:

- ✅ RLS enabled
- ✅ Multiple policies (read, insert, update)

### 3. Test with SQL

In SQL Editor:

```sql
-- Should return your user ID (when authenticated)
SELECT auth.uid();

-- Should only show your projects
SELECT * FROM projects;

-- Check RLS helper function exists
SELECT public.can_access_project('00000000-0000-0000-0000-000000000000'::uuid);
```

## Configure Auth URLs

**Required for authentication to work!**

Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration

### Site URL

**Development**: `http://localhost:5173`  
**Production**: `https://inkwell.leadwithnexus.com`

### Redirect URLs

Add all of these:

```
http://localhost:5173
http://localhost:5173/auth/callback
http://localhost:5173/auth/update-password
https://inkwell.leadwithnexus.com
https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/auth/update-password
```

## Testing the Integration

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Create Test User

- Sign up with a test email
- Check Supabase Dashboard → Authentication → Users
- Should see new user

### 3. Create Project

- Create a new project in the UI
- Check Supabase Dashboard → Table Editor → projects
- Should see a new row with your `auth.uid()` as `owner_id`

### 4. Test Sync (when enabled)

- Toggle "Cloud Sync" in Settings (future feature)
- Edit a chapter
- Check Table Editor → chapters
- Should see new/updated row

### 5. Test RLS

- Create second test user
- Try to access first user's projects
- Should return empty (RLS blocking)

## Using New Features

### Auto-touch `updated_at`

No client-side code needed! Just update rows normally:

```ts
// updated_at is automatically set by the server
await supabase.from('chapters').update({ title: 'New Title' }).eq('id', chapterId);
```

### Active Views (Hide Deleted)

Query active records without deleted rows:

```ts
// Old way: manual filter
const { data } = await supabase.from('chapters').select('*').is('deleted_at', null);

// New way: use _active view
const { data } = await supabase.from('chapters_active').select('*');
```

### Soft Delete RPC

Safe soft-delete without writing UPDATE queries:

```ts
// Soft delete a chapter
await supabase.rpc('soft_delete', {
  _table: 'chapters',
  _id: chapterId,
});
```

### Bulk Upsert for Sync

Efficiently sync batches of 200-500 rows:

```ts
// Batch sync chapters
const chapters = [...] // array of chapter objects
await supabase.rpc('bulk_upsert_chapters', {
  rows: JSON.stringify(chapters)
})

// Repeat for characters and notes
await supabase.rpc('bulk_upsert_characters', { rows: JSON.stringify(characters) })
await supabase.rpc('bulk_upsert_notes', { rows: JSON.stringify(notes) })
```

### Role-based Access

Viewers are automatically read-only:

```ts
// Project owner adds a viewer
await supabase.from('project_members').insert({
  project_id: projectId,
  user_id: viewerUserId,
  role: 'viewer',
});

// Viewer can read but not write (blocked by RLS)
const { data } = await supabase.from('chapters').select('*'); // ✅ works
const { error } = await supabase.from('chapters').update({ title: 'X' }); // ❌ blocked
```

## Feature Flag: Cloud Sync

By default, cloud sync is **disabled** to preserve local-first behavior.

In `.env.local`:

```env
VITE_ENABLE_SUPABASE_SYNC=false  # Local-first only
VITE_ENABLE_SUPABASE_SYNC=true   # Enable cloud sync
```

Users will be able to toggle this in Settings UI (to be implemented).

## Deployment Checklist

### Vercel/Production

1. Add environment variables:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_ENABLE_SUPABASE_SYNC=false
   ```

2. Update Supabase auth URLs (see above)

3. Deploy and test

### GitHub Secrets

For CI/CD, add these secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### "Missing Supabase environment variables"

- ✅ Verify `.env.local` exists
- ✅ Check variable names exactly match: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- ✅ Restart dev server

### Migration fails

- ✅ Use Supabase Dashboard SQL Editor (copy/paste migration file)
- ✅ Check you're on the correct project
- ✅ Verify you have admin permissions

### Tables not showing up

- ✅ Refresh Supabase Dashboard
- ✅ Check SQL Editor for errors
- ✅ Verify migration ran successfully

### RLS blocking legitimate access

- ✅ Make sure user is authenticated: `SELECT auth.uid();` should return UUID
- ✅ Check user owns the project or is a member
- ✅ Review policies in Authentication → Policies

### Auth redirects not working

- ✅ Verify all URLs are in Redirect URLs list
- ✅ Check URLs match exactly (http vs https, trailing slash)
- ✅ Clear browser cookies/cache

## Next Steps

After successful integration:

1. [ ] Implement sync queue (`src/sync/queue.ts`)
2. [ ] Add sync manager hook (`src/sync/useSyncManager.ts`)
3. [ ] Create conflict detection UI
4. [ ] Add Cloud Sync toggle in Settings
5. [ ] Implement repository pattern for all entities
6. [ ] Add LocalFirstBadge component
7. [ ] Test two-device sync workflow
8. [ ] Add export/backup functionality
9. [ ] Update user-facing documentation
10. [ ] Enable feature flag in production

## Resources

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Migration Starter Pack](./SUPABASE_STARTER_PACK.md) (full code samples)

## Schema Reference

See the full SQL in: `supabase/migrations/2025-10-28_inkwell_schema.sql`

### Key Fields for Sync

All synced entities have:

- `client_rev` (bigint) - Increments on each local edit
- `client_hash` (text) - Optional content hash for conflict detection
- `created_at`, `updated_at` - Timestamps
- `deleted_at` - Soft delete support

## Support

If you run into issues:

1. Check this guide's troubleshooting section
2. Review `SUPABASE_QUICKSTART.md`
3. Check Supabase Dashboard logs
4. Verify RLS policies in SQL Editor
