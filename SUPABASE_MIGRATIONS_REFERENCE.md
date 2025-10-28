# Supabase Migrations Reference

Complete reference for all Inkwell Supabase migrations.

## Migration Files

All migrations are in `supabase/migrations/` and should be applied in order.

### 1. Core Schema (2025-10-28_inkwell_schema.sql)

**Purpose**: Create all tables, RLS policies, and basic helper functions

**Creates**:

- Tables: `profiles`, `projects`, `project_members`, `chapters`, `characters`, `notes`
- RLS policies for all tables
- Helper function: `can_access_project(uuid)`
- Indexes for performance
- Triggers on `auth.users` for profile creation

**Key Features**:

- UUID primary keys with `gen_random_uuid()`
- Soft delete support (`deleted_at` column)
- Revision tracking (`client_rev`, `client_hash`)
- Foreign key constraints with cascade delete
- Row Level Security enabled on all tables

---

### 2. Auto-touch Updated At (2025-10-28_touch_updated_at.sql)

**Purpose**: Ensure `updated_at` is always server-controlled

**Creates**:

- Function: `touch_updated_at()` - sets `updated_at = now()`
- Triggers on: `projects`, `profiles`, `chapters`, `characters`, `notes`

**Benefit**:

- No client-side timestamp management
- Prevents clock skew issues
- Always accurate server timestamps

**Usage**:

```ts
// Just update normally - updated_at is automatic
await supabase.from('chapters').update({ title: 'New' }).eq('id', id);
```

---

### 3. Profile Auto-creation (2025-10-28_profiles_autocreate.sql)

**Purpose**: Automatically create profile on user signup

**Creates**:

- Function: `handle_new_user()` - creates profile row
- Trigger on: `auth.users` (after insert)

**Benefit**:

- No race conditions
- Profile always exists when user is authenticated
- Pulls display name from user metadata or email

**Flow**:

1. User signs up via Supabase Auth
2. Row inserted into `auth.users`
3. Trigger fires → `handle_new_user()` called
4. Profile created in `public.profiles`

---

### 4. Soft Delete Helpers (2025-10-28_soft_delete_helpers.sql)

**Purpose**: Simplify working with soft-deleted rows

**Creates**:

- Views: `projects_active`, `chapters_active`, `characters_active`, `notes_active`
- Function: `soft_delete(table_name, id)` - RPC for soft delete

**Benefit**:

- Query active rows without remembering `deleted_at is null`
- Safe soft-delete via RPC (prevents SQL injection)
- Separate view grants for read permissions

**Usage**:

```ts
// Query active rows (excludes deleted)
const { data } = await supabase.from('chapters_active').select('*');

// Soft delete via RPC
await supabase.rpc('soft_delete', { _table: 'chapters', _id: chapterId });
```

---

### 5. Role-based Write Guards (2025-10-28_roles_write_guard.sql)

**Purpose**: Enforce role-based permissions for project writes

**Creates**:

- Function: `can_write_project(uuid)` - checks if user can write
- Updated RLS policies for chapters, characters, notes

**Roles**:

- **Owner**: Full access (read + write)
- **Editor**: Read + write
- **Viewer**: Read only

**Benefit**:

- Prevents viewers from accidentally overwriting data
- Enforced at database level (not just UI)
- Works with existing `project_members` table

**Usage**:

```ts
// Add viewer (read-only)
await supabase.from('project_members').insert({
  project_id: pid,
  user_id: viewerId,
  role: 'viewer',
});

// Viewer can read
const { data } = await supabase.from('chapters').select('*'); // ✅

// But viewer cannot write (RLS blocks)
const { error } = await supabase.from('chapters').update({ title: 'X' }); // ❌
```

---

### 6. Bulk Upsert RPCs (2025-10-28_bulk_upsert.sql)

**Purpose**: Efficient batch operations for sync

**Creates**:

- Function: `bulk_upsert_chapters(jsonb)` - batch upsert
- Function: `bulk_upsert_characters(jsonb)` - batch upsert
- Function: `bulk_upsert_notes(jsonb)` - batch upsert

**Benefit**:

- Reduces network round-trips (1 call vs N calls)
- Faster initial sync from IndexedDB to Supabase
- Recommended batch size: 200-500 rows

**Usage**:

```ts
// Batch upsert chapters
const chapters = [...] // array of 200-500 chapter objects
await supabase.rpc('bulk_upsert_chapters', {
  rows: JSON.stringify(chapters)
})

// Equivalent to:
// await supabase.from('chapters').upsert(chapters)
// But more efficient with security definer
```

---

### 7. Index Refinements (2025-10-28_index_refinements.sql)

**Purpose**: Optimize queries for conflict detection and views

**Creates**:

- Composite indexes: `(project_id, client_rev desc)`
- Partial indexes: `(deleted_at) where deleted_at is null`

**Benefit**:

- Faster conflict scans during sync
- Efficient `*_active` view queries
- Better performance with large datasets

**Indexes**:

```sql
-- For conflict detection
idx_chapters_project_rev on chapters(project_id, client_rev desc)
idx_characters_project_rev on characters(project_id, client_rev desc)
idx_notes_project_rev on notes(project_id, client_rev desc)

-- For active views
idx_chapters_deleted on chapters(deleted_at) where deleted_at is null
idx_characters_deleted on characters(deleted_at) where deleted_at is null
idx_notes_deleted on notes(deleted_at) where deleted_at is null
```

---

### 8. Seed Data (2025-10-28_seed_minimal.sql)

**Purpose**: Create demo data for QA and testing

**Creates**:

- Demo project: "Demo Project - QA"
- Demo chapter, character, and note

**Benefit**:

- Quick validation of RLS policies
- Test data for sync workflows
- Verify row-level permissions

**Usage**:
Run manually in SQL Editor when authenticated:

```sql
-- Already in migration file, just execute
-- Creates demo project for auth.uid()
```

**Note**: This is optional and safe to skip in production.

---

## Quick Reference

### Migration Order

```bash
# All at once (recommended)
npx supabase db push

# Or individually in SQL Editor:
1. inkwell_schema.sql          # Core tables
2. touch_updated_at.sql         # Timestamp triggers
3. profiles_autocreate.sql      # Profile trigger
4. soft_delete_helpers.sql      # Views + RPC
5. roles_write_guard.sql        # Stricter RLS
6. bulk_upsert.sql              # Batch RPCs
7. index_refinements.sql        # Performance
8. seed_minimal.sql             # Optional QA data
```

### Key Functions

| Function                        | Purpose                | Example                                 |
| ------------------------------- | ---------------------- | --------------------------------------- |
| `touch_updated_at()`            | Auto-set updated_at    | Trigger (automatic)                     |
| `handle_new_user()`             | Auto-create profile    | Trigger (automatic)                     |
| `can_access_project(uuid)`      | Check project access   | Used in RLS policies                    |
| `can_write_project(uuid)`       | Check write permission | Used in RLS policies                    |
| `soft_delete(text, uuid)`       | Soft delete row        | `rpc('soft_delete', {_table, _id})`     |
| `bulk_upsert_chapters(jsonb)`   | Batch upsert           | `rpc('bulk_upsert_chapters', {rows})`   |
| `bulk_upsert_characters(jsonb)` | Batch upsert           | `rpc('bulk_upsert_characters', {rows})` |
| `bulk_upsert_notes(jsonb)`      | Batch upsert           | `rpc('bulk_upsert_notes', {rows})`      |

### Key Views

| View                | Purpose           | Filter               |
| ------------------- | ----------------- | -------------------- |
| `projects_active`   | Active projects   | `deleted_at is null` |
| `chapters_active`   | Active chapters   | `deleted_at is null` |
| `characters_active` | Active characters | `deleted_at is null` |
| `notes_active`      | Active notes      | `deleted_at is null` |

## Verification Queries

After applying migrations:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
-- Should return: profiles, projects, project_members, chapters, characters, notes

-- Check all views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
-- Should return: projects_active, chapters_active, characters_active, notes_active

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity should be 't' (true) for all tables

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Should see: trg_touch_*, on_auth_user_created

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
-- Should see: touch_updated_at, handle_new_user, can_access_project,
--             can_write_project, soft_delete, bulk_upsert_*

-- Test auto-touch (when authenticated)
UPDATE chapters SET title = 'Test' WHERE id = 'some-id';
SELECT updated_at FROM chapters WHERE id = 'some-id';
-- updated_at should be current server time

-- Test soft delete RPC
SELECT public.soft_delete('chapters', 'some-id');
SELECT deleted_at FROM chapters WHERE id = 'some-id';
-- deleted_at should be set

-- Test active view
SELECT count(*) FROM chapters;        -- includes deleted
SELECT count(*) FROM chapters_active; -- excludes deleted
```

## Rollback

If you need to rollback (⚠️ destructive):

```sql
-- Drop in reverse order
DROP FUNCTION IF EXISTS public.bulk_upsert_notes(jsonb);
DROP FUNCTION IF EXISTS public.bulk_upsert_characters(jsonb);
DROP FUNCTION IF EXISTS public.bulk_upsert_chapters(jsonb);
DROP FUNCTION IF EXISTS public.soft_delete(text, uuid);
DROP FUNCTION IF EXISTS public.can_write_project(uuid);
DROP VIEW IF EXISTS public.notes_active;
DROP VIEW IF EXISTS public.characters_active;
DROP VIEW IF EXISTS public.chapters_active;
DROP VIEW IF EXISTS public.projects_active;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.touch_updated_at();

-- Then drop tables (from core schema)
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.characters;
DROP TABLE IF EXISTS public.chapters;
DROP TABLE IF EXISTS public.project_members;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.profiles;
DROP FUNCTION IF EXISTS public.can_access_project(uuid);
```

## Best Practices

1. **Always use `npx supabase db push`** - Applies in correct order
2. **Query `*_active` views** - Excludes soft-deleted rows
3. **Use bulk RPCs for sync** - Batch 200-500 rows for efficiency
4. **Let triggers handle timestamps** - Don't set `updated_at` client-side
5. **Regenerate types after migrations**:
   ```bash
   npx supabase gen types typescript --project-id $PROJECT_REF \
     --schema public > src/types/supabase.ts
   ```

## Troubleshooting

**Issue**: Migration fails with "already exists"

- **Solution**: Migrations are idempotent; safe to re-run
- Check if using `CREATE OR REPLACE` and `IF NOT EXISTS`

**Issue**: RLS blocking legitimate access

- **Solution**: Check user is authenticated: `SELECT auth.uid();`
- Verify role in `project_members` table

**Issue**: `updated_at` not updating

- **Solution**: Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE 'trg_touch%';`
- Ensure migration 2 was applied

**Issue**: Bulk upsert fails

- **Solution**: Check batch size (keep under 500 rows)
- Verify JSON structure matches table schema
- Check for required fields (project_id, etc.)

## Resources

- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)
