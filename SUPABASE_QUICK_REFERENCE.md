# Supabase Migration Quick Reference

One-page reference for Inkwell's Supabase setup.

## 🚀 Quick Setup (3 Steps)

```bash
# 1. Setup environment and link project
./scripts/setup-supabase.sh

# 2. Verify in Supabase Dashboard
# → Check tables, views, functions exist

# 3. Generate types (optional)
export SUPABASE_PROJECT_REF=your-ref
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF --schema public > src/types/supabase.ts
```

## 📦 What Gets Created

### Tables (6)

- `profiles` - User profiles (auto-created on signup)
- `projects` - Writing projects
- `project_members` - Collaboration roles
- `chapters` - Book chapters with revision tracking
- `characters` - Character profiles
- `notes` - Project notes

### Views (4)

- `projects_active` - Excludes soft-deleted projects
- `chapters_active` - Excludes soft-deleted chapters
- `characters_active` - Excludes soft-deleted characters
- `notes_active` - Excludes soft-deleted notes

### Functions (8)

- `touch_updated_at()` - Auto-set updated_at (trigger)
- `handle_new_user()` - Auto-create profile (trigger)
- `can_access_project(uuid)` - Check read access
- `can_write_project(uuid)` - Check write access (owner/editor only)
- `soft_delete(table, id)` - Safe soft delete RPC
- `bulk_upsert_chapters(jsonb)` - Batch upsert
- `bulk_upsert_characters(jsonb)` - Batch upsert
- `bulk_upsert_notes(jsonb)` - Batch upsert

## 💻 Common Operations

### Query Active Rows

```ts
// Use _active views to exclude deleted
const { data } = await supabase.from('chapters_active').select('*');
```

### Soft Delete

```ts
// Via RPC (recommended)
await supabase.rpc('soft_delete', { _table: 'chapters', _id: chapterId });

// Or manually
await supabase
  .from('chapters')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', chapterId);
```

### Batch Sync

```ts
// Batch 200-500 rows for efficiency
const chapters = [...] // array of chapters
await supabase.rpc('bulk_upsert_chapters', { rows: JSON.stringify(chapters) })
```

### Check User Access

```ts
// Is user a member of project?
const { data } = await supabase.rpc('can_access_project', { pid: projectId });

// Can user write to project?
const { data } = await supabase.rpc('can_write_project', { pid: projectId });
```

### Add Project Member

```ts
// Add with role (owner, editor, viewer)
await supabase.from('project_members').insert({
  project_id: projectId,
  user_id: userId,
  role: 'editor', // or 'viewer' for read-only
});
```

## 🔒 Role Permissions

| Role   | Read | Write | Delete |
| ------ | ---- | ----- | ------ |
| Owner  | ✅   | ✅    | ✅     |
| Editor | ✅   | ✅    | ✅     |
| Viewer | ✅   | ❌    | ❌     |

## ✅ Validation Checklist

After setup, verify:

- [ ] Tables exist (profiles, projects, chapters, characters, notes, project_members)
- [ ] Views exist (\*\_active for each entity type)
- [ ] RLS enabled on all tables
- [ ] Triggers created (check pg_trigger)
- [ ] Functions created (8 total)
- [ ] Indexes created (performance + conflict detection)
- [ ] Test user signup → profile auto-created
- [ ] Test soft delete → row appears in base table but not \*\_active view
- [ ] Test viewer role → can read but not write

## 🛠️ VS Code Tasks

Press `Cmd+Shift+P` → "Run Task":

- **Supabase: Setup (Interactive)** - Full setup wizard
- **Supabase: Link Project** - Link to Supabase project
- **Supabase: Push Migrations** - Apply all migrations
- **Supabase: Generate Types** - Generate TypeScript types
- **Supabase: Status** - Check local Supabase status

## 📊 Monitoring Queries

```sql
-- Count active vs deleted
SELECT
  'chapters' as table_name,
  count(*) filter (where deleted_at is null) as active,
  count(*) filter (where deleted_at is not null) as deleted
FROM chapters
UNION ALL
SELECT 'characters',
  count(*) filter (where deleted_at is null),
  count(*) filter (where deleted_at is not null)
FROM characters;

-- Check client_rev distribution (for conflict detection)
SELECT project_id, max(client_rev) as latest_rev, count(*) as total
FROM chapters
GROUP BY project_id;

-- Recent updates (server-controlled timestamps)
SELECT id, title, updated_at
FROM chapters
ORDER BY updated_at DESC
LIMIT 10;
```

## 🐛 Quick Troubleshooting

| Issue                     | Solution                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------- |
| "Missing env vars"        | Create `.env.local` with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY                  |
| Migration fails           | Use Supabase Dashboard SQL Editor (copy/paste migration)                               |
| RLS blocking access       | Check `auth.uid()` returns UUID, verify membership in `project_members`                |
| `updated_at` not updating | Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trg_touch_chapters';` |
| Profile not created       | Check trigger: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`       |
| Bulk upsert fails         | Check batch size (<500), verify JSON structure                                         |

## 📁 File Locations

```
supabase/migrations/
├── 2025-10-28_inkwell_schema.sql          # Core schema
├── 2025-10-28_touch_updated_at.sql        # Timestamp triggers
├── 2025-10-28_profiles_autocreate.sql     # Profile auto-creation
├── 2025-10-28_soft_delete_helpers.sql     # Views + RPC
├── 2025-10-28_roles_write_guard.sql       # Role-based RLS
├── 2025-10-28_bulk_upsert.sql             # Batch operations
├── 2025-10-28_index_refinements.sql       # Performance indexes
└── 2025-10-28_seed_minimal.sql            # Optional test data

scripts/
├── setup-supabase.sh                       # Interactive setup
└── find-offline-claims.sh                  # Find messaging to update

docs/
├── SUPABASE_MIGRATION_GUIDE.md            # Full guide
├── SUPABASE_MIGRATIONS_REFERENCE.md       # Detailed reference
├── SUPABASE_QUICKSTART.md                 # 5-min quick start
└── SUPABASE_INTEGRATION_COMPLETE_CHECKLIST.md  # 16-phase checklist
```

## 🔗 Resources

- [Supabase Dashboard](https://app.supabase.com)
- [Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)
- [Migrations Reference](./SUPABASE_MIGRATIONS_REFERENCE.md)
- [Complete Checklist](./SUPABASE_INTEGRATION_COMPLETE_CHECKLIST.md)

---

**Pro Tips**:

- Use `*_active` views by default
- Batch sync in chunks of 200-500
- Let server handle `updated_at`
- Regenerate types after migrations
- Query `auth.uid()` to verify authentication
