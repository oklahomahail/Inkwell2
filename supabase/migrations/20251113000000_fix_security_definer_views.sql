-- Fix Security Definer Views
--
-- SECURITY ISSUE: The active views were created without explicit SECURITY INVOKER,
-- which means they default to SECURITY DEFINER in PostgreSQL. This bypasses RLS policies.
--
-- SECURITY DEFINER = View runs with owner's privileges (bypasses RLS)
-- SECURITY INVOKER = View runs with caller's privileges (respects RLS)
--
-- This migration recreates all *_active views with SECURITY INVOKER to ensure
-- Row-Level Security policies are properly enforced.

-- Drop existing views
drop view if exists public.projects_active;
drop view if exists public.chapters_active;
drop view if exists public.characters_active;
drop view if exists public.notes_active;

-- Recreate views with SECURITY INVOKER (enforces RLS)
create view public.projects_active
with (security_invoker = true) as
  select * from public.projects where deleted_at is null;

create view public.chapters_active
with (security_invoker = true) as
  select * from public.chapters where deleted_at is null;

create view public.characters_active
with (security_invoker = true) as
  select * from public.characters where deleted_at is null;

create view public.notes_active
with (security_invoker = true) as
  select * from public.notes where deleted_at is null;

-- Grant SELECT on views to authenticated users
grant select on public.projects_active to authenticated;
grant select on public.chapters_active to authenticated;
grant select on public.characters_active to authenticated;
grant select on public.notes_active to authenticated;

-- Add comments
comment on view public.projects_active is 'Projects excluding soft-deleted rows (SECURITY INVOKER - respects RLS)';
comment on view public.chapters_active is 'Chapters excluding soft-deleted rows (SECURITY INVOKER - respects RLS)';
comment on view public.characters_active is 'Characters excluding soft-deleted rows (SECURITY INVOKER - respects RLS)';
comment on view public.notes_active is 'Notes excluding soft-deleted rows (SECURITY INVOKER - respects RLS)';
