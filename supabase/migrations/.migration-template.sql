-- Migration Template with Security Best Practices
-- Copy this template when creating new migrations
-- Date: YYYY-MM-DD
-- Purpose: [Brief description of what this migration does]

-- ==============================================================================
-- SECURITY CHECKLIST (Delete this section before committing)
-- ==============================================================================
-- [ ] All new tables have RLS enabled
-- [ ] All new tables have SELECT, INSERT, UPDATE, DELETE policies
-- [ ] All new views use 'with (security_invoker = true)'
-- [ ] All new SECURITY DEFINER functions have authorization checks
-- [ ] All new functions validate user input
-- [ ] No new GRANT statements to 'anon' role
-- [ ] Tested locally with 'pnpm test:security'
-- [ ] Migration is idempotent (safe to run multiple times)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. CREATE TABLES
-- ==============================================================================

-- Example table creation
create table if not exists public.example_table (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Add indexes for performance
create index if not exists idx_example_user_updated
  on public.example_table(user_id, updated_at desc);

-- Add comments for documentation
comment on table public.example_table is 'Example table with proper security';
comment on column public.example_table.deleted_at is 'Soft delete timestamp';

-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==============================================================================

-- ✅ REQUIRED: Enable RLS on all tables
alter table public.example_table enable row level security;

-- ==============================================================================
-- 3. CREATE HELPER FUNCTIONS (Optional)
-- ==============================================================================

-- ✅ GOOD: Security invoker (default) - respects RLS
create or replace function public.can_access_example(example_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.example_table
    where id = example_id
    and user_id = auth.uid()
  );
$$;

-- ⚠️ USE WITH CAUTION: Security definer - bypasses RLS
-- create or replace function public.admin_function()
-- returns void language plpgsql security definer as $$
-- begin
--   -- ✅ REQUIRED: Always check authorization first!
--   if not is_admin(auth.uid()) then
--     raise exception 'Permission denied: admin role required';
--   end if;
--
--   -- ✅ REQUIRED: Validate all user input
--   if input_param is null or input_param = '' then
--     raise exception 'Invalid input parameter';
--   end if;
--
--   -- Now perform privileged operation
--   -- ...
-- end;
-- $$;

-- ==============================================================================
-- 4. CREATE RLS POLICIES
-- ==============================================================================

-- ✅ REQUIRED: SELECT policy (read access)
drop policy if exists "example_read" on public.example_table;
create policy "example_read" on public.example_table
for select using (
  user_id = auth.uid()
);

-- ✅ REQUIRED: INSERT policy (create access)
drop policy if exists "example_insert" on public.example_table;
create policy "example_insert" on public.example_table
for insert with check (
  user_id = auth.uid()
);

-- ✅ REQUIRED: UPDATE policy (modify access)
drop policy if exists "example_update" on public.example_table;
create policy "example_update" on public.example_table
for update using (
  user_id = auth.uid()
);

-- ✅ REQUIRED: DELETE policy (remove access)
drop policy if exists "example_delete" on public.example_table;
create policy "example_delete" on public.example_table
for delete using (
  user_id = auth.uid()
);

-- ==============================================================================
-- 5. CREATE VIEWS (Optional)
-- ==============================================================================

-- ✅ REQUIRED: Always use 'with (security_invoker = true)'
drop view if exists public.example_table_active;
create view public.example_table_active
with (security_invoker = true) as
  select * from public.example_table
  where deleted_at is null;

-- Grant appropriate permissions
grant select on public.example_table_active to authenticated;

-- Add comments
comment on view public.example_table_active is
  'Active examples excluding soft-deleted rows (SECURITY INVOKER - respects RLS)';

-- ==============================================================================
-- 6. CREATE TRIGGERS (Optional)
-- ==============================================================================

-- Example: Auto-update updated_at timestamp
-- Note: Trigger functions are SECURITY DEFINER by default, but that's OK
-- because they only modify the row being updated
create or replace function public.example_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_example_touch_updated_at on public.example_table;
create trigger trg_example_touch_updated_at
  before update on public.example_table
  for each row
  execute function public.example_touch_updated_at();

-- ==============================================================================
-- 7. GRANT PERMISSIONS (Optional)
-- ==============================================================================

-- ⚠️ CAREFUL: Only grant necessary permissions
-- Never grant to 'anon' unless specifically needed for public data

-- Example: Grant SELECT to authenticated users (views only)
-- grant select on public.example_table_active to authenticated;

-- ❌ AVOID: Granting permissions on tables directly
-- Direct grants can bypass RLS if not careful
-- Let RLS policies control access instead

-- ==============================================================================
-- 8. DATA MIGRATION (Optional)
-- ==============================================================================

-- If migrating existing data, do it here
-- Example:
-- update public.example_table
-- set new_column = old_column
-- where new_column is null;

-- ==============================================================================
-- 9. CLEANUP (Optional)
-- ==============================================================================

-- Drop old columns, tables, functions, etc.
-- Example:
-- alter table public.example_table drop column if exists old_column;
-- drop function if exists public.old_function();

COMMIT;

-- ==============================================================================
-- 10. VERIFICATION QUERIES (Comment out before committing)
-- ==============================================================================

-- Verify RLS is enabled
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- and tablename = 'example_table';
-- -- Should return: rowsecurity = true

-- Verify policies exist
-- select policyname, cmd
-- from pg_policies
-- where tablename = 'example_table';
-- -- Should return policies for SELECT, INSERT, UPDATE, DELETE

-- Verify views use security_invoker
-- select viewname, definition
-- from pg_views
-- where schemaname = 'public'
-- and viewname = 'example_table_active';
-- -- Check definition includes "security_invoker"

-- ==============================================================================
-- COMMON PATTERNS
-- ==============================================================================

-- Pattern 1: Owner-only access
-- create policy "owner_only" on public.table_name
-- for select using (owner_id = auth.uid());

-- Pattern 2: Membership-based access
-- create policy "member_access" on public.table_name
-- for select using (
--   exists(
--     select 1 from public.project_members m
--     where m.project_id = table_name.project_id
--     and m.user_id = auth.uid()
--   )
-- );

-- Pattern 3: Role-based write access
-- create policy "editor_write" on public.table_name
-- for insert with check (
--   exists(
--     select 1 from public.project_members m
--     where m.project_id = table_name.project_id
--     and m.user_id = auth.uid()
--     and m.role in ('owner', 'editor')
--   )
-- );

-- Pattern 4: Soft delete view
-- create view table_name_active
-- with (security_invoker = true) as
-- select * from table_name where deleted_at is null;

-- Pattern 5: Safe SECURITY DEFINER function
-- create function safe_admin_function()
-- returns void language plpgsql security definer
-- set search_path = public
-- as $$
-- begin
--   -- Check authorization
--   if not is_authorized() then
--     raise exception 'Permission denied';
--   end if;
--
--   -- Validate input
--   if param is null then
--     raise exception 'Invalid input';
--   end if;
--
--   -- Perform operation
--   -- ...
-- end;
-- $$;

-- ==============================================================================
-- TESTING CHECKLIST (Run these locally before committing)
-- ==============================================================================

-- 1. Apply migration locally
--    $ supabase db reset

-- 2. Run security tests
--    $ pnpm test:security

-- 3. Manual testing (in Supabase Studio SQL Editor):
--    a. Try to access data as different users
--    b. Try to insert/update/delete as viewer/editor/owner
--    c. Verify soft-deleted items are hidden in active views
--    d. Test edge cases (NULL values, non-existent IDs, etc.)

-- 4. Check for performance issues
--    a. Run EXPLAIN ANALYZE on common queries
--    b. Verify indexes are being used
--    c. Check if policies add significant overhead

-- 5. Review with team
--    a. Have another developer review the migration
--    b. Discuss any security implications
--    c. Update documentation if needed

-- ==============================================================================
-- REFERENCES
-- ==============================================================================
-- - Security Audit: docs/SECURITY_AUDIT.md
-- - Hardening Checklist: docs/SECURITY_HARDENING_CHECKLIST.md
-- - Testing Guide: docs/SECURITY_TESTING.md
-- - Quick Reference: docs/SECURITY_QUICK_REFERENCE.md
-- ==============================================================================
