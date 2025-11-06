# Applying Database Migrations

## Quick Start

To apply the latest migration that fixes the `order_index` error:

### Option 1: Using Supabase CLI (Recommended)

```bash
# Apply all pending migrations
supabase db push

# Or apply to remote database
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### Option 2: Manual SQL Execution

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20251105000000_add_chapters_columns.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

### Option 3: Using psql

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20251105000000_add_chapters_columns.sql
```

## What This Migration Does

The `20251105000000_add_chapters_columns.sql` migration:

- ✅ Adds `order_index` column (fixes the 400 error)
- ✅ Adds `content` column (separate from `body`)
- ✅ Adds `summary` column for chapter summaries
- ✅ Adds `word_count` column (cached count)
- ✅ Adds `status` column (`draft`, `revising`, `final`)
- ✅ Creates indexes for performance
- ✅ Adds auto-increment trigger for `order_index`
- ✅ Backfills existing data safely

## Verification

After applying the migration, verify it worked:

```sql
-- Check the new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chapters'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the query that was failing
SELECT id, title, order_index, status
FROM chapters
WHERE project_id = '[YOUR-PROJECT-ID]'
ORDER BY order_index ASC;
```

You should see output like:

```
 column_name   | data_type | is_nullable
---------------+-----------+-------------
 id            | uuid      | NO
 project_id    | uuid      | NO
 order_index   | integer   | NO
 title         | text      | NO
 body          | text      | NO
 content       | text      | NO
 summary       | text      | YES
 word_count    | integer   | NO
 status        | text      | NO
 ...
```

## Testing in the App

After applying the migration:

1. Clear your browser's Application Data (DevTools → Application → Clear site data)
2. Reload the app
3. Open a project
4. Check the console - the errors should be gone:
   ```
   ✅ [Sync] Pulled 3 chapters from remote
   ✅ [Hook] Synced successfully
   ```

## Rollback (if needed)

If you need to rollback this migration:

```sql
BEGIN;

-- Remove new columns
ALTER TABLE public.chapters DROP COLUMN IF EXISTS order_index;
ALTER TABLE public.chapters DROP COLUMN IF EXISTS content;
ALTER TABLE public.chapters DROP COLUMN IF EXISTS summary;
ALTER TABLE public.chapters DROP COLUMN IF EXISTS word_count;
ALTER TABLE public.chapters DROP COLUMN IF EXISTS status;

-- Remove trigger
DROP TRIGGER IF EXISTS trg_set_chapter_order ON public.chapters;
DROP FUNCTION IF EXISTS public.set_chapter_order();

-- Restore old index
CREATE INDEX IF NOT EXISTS idx_chapters_project_updated
ON public.chapters(project_id, updated_at DESC);

COMMIT;
```

## Migration History

- `20251105000000_add_chapters_columns.sql` - Added missing columns to support chapter sync service
- `20250204000000_e2ee_foundation.sql` - E2EE foundation
- `20250128000007_seed_minimal.sql` - Minimal seed data
- `20250128000006_index_refinements.sql` - Index improvements
- `20250128000000_inkwell_schema.sql` - Initial schema

## Troubleshooting

### "relation already exists" errors

The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

### "column already exists" errors

Same as above - the migration checks before adding columns.

### Permission errors

Make sure you're using the `postgres` role or have `ALTER TABLE` permissions on the `public` schema.

### Migration not taking effect

1. Check that you're connected to the correct database
2. Verify the transaction committed (check for `COMMIT` in output)
3. Try running `VACUUM ANALYZE public.chapters;` to refresh statistics
