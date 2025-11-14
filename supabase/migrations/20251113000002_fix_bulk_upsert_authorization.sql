-- Fix Bulk Upsert Authorization
--
-- SECURITY FIX: The bulk_upsert_*() functions use SECURITY DEFINER without authorization checks,
-- allowing ANY authenticated user to bulk insert/update data in ANY project.
--
-- This migration adds proper authorization checks to ensure users can only bulk upsert
-- data in projects they have write access to.

-- ==============================================================================
-- 1. Fix bulk_upsert_chapters
-- ==============================================================================

drop function if exists public.bulk_upsert_chapters(jsonb);

create or replace function public.bulk_upsert_chapters(rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data record;
  project_ids uuid[];
  pid uuid;
begin
  -- Extract all unique project_ids from input
  select array_agg(distinct (value->>'project_id')::uuid)
  into project_ids
  from jsonb_array_elements(rows);

  -- Validate user has write access to ALL projects
  foreach pid in array project_ids loop
    if not public.can_write_project(pid) then
      raise exception 'Permission denied for project %', pid;
    end if;
  end loop;

  -- Now perform bulk upsert (all projects validated)
  insert into public.chapters (
    id, project_id, title, body, index_in_project, order_index, content,
    client_rev, client_hash, created_at, updated_at, deleted_at
  )
  select
    (value->>'id')::uuid,
    (value->>'project_id')::uuid,
    value->>'title',
    coalesce(value->>'body', ''),
    coalesce((value->>'index_in_project')::int, 0),
    coalesce((value->>'order_index')::int, 0),
    coalesce(value->>'content', value->>'body', ''),
    coalesce((value->>'client_rev')::bigint, 0),
    value->>'client_hash',
    coalesce((value->>'created_at')::timestamptz, now()),
    coalesce((value->>'updated_at')::timestamptz, now()),
    (value->>'deleted_at')::timestamptz
  from jsonb_array_elements(rows)
  on conflict (id) do update
    set title = excluded.title,
        body = excluded.body,
        content = excluded.content,
        index_in_project = excluded.index_in_project,
        order_index = excluded.order_index,
        client_rev = excluded.client_rev,
        client_hash = excluded.client_hash,
        updated_at = now(),
        deleted_at = excluded.deleted_at;
end;
$$;

comment on function public.bulk_upsert_chapters(jsonb) is
  'Bulk upsert chapters with authorization checks (200-500 rows recommended)';

grant execute on function public.bulk_upsert_chapters(jsonb) to authenticated;

-- ==============================================================================
-- 2. Fix bulk_upsert_characters
-- ==============================================================================

drop function if exists public.bulk_upsert_characters(jsonb);

create or replace function public.bulk_upsert_characters(rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data record;
  project_ids uuid[];
  pid uuid;
begin
  -- Extract all unique project_ids from input
  select array_agg(distinct (value->>'project_id')::uuid)
  into project_ids
  from jsonb_array_elements(rows);

  -- Validate user has write access to ALL projects
  foreach pid in array project_ids loop
    if not public.can_write_project(pid) then
      raise exception 'Permission denied for project %', pid;
    end if;
  end loop;

  -- Now perform bulk upsert (all projects validated)
  insert into public.characters (
    id, project_id, name, bio, traits,
    client_rev, client_hash, created_at, updated_at, deleted_at
  )
  select
    (value->>'id')::uuid,
    (value->>'project_id')::uuid,
    value->>'name',
    coalesce(value->>'bio', ''),
    coalesce((value->>'traits')::jsonb, '{}'::jsonb),
    coalesce((value->>'client_rev')::bigint, 0),
    value->>'client_hash',
    coalesce((value->>'created_at')::timestamptz, now()),
    coalesce((value->>'updated_at')::timestamptz, now()),
    (value->>'deleted_at')::timestamptz
  from jsonb_array_elements(rows)
  on conflict (id) do update
    set name = excluded.name,
        bio = excluded.bio,
        traits = excluded.traits,
        client_rev = excluded.client_rev,
        client_hash = excluded.client_hash,
        updated_at = now(),
        deleted_at = excluded.deleted_at;
end;
$$;

comment on function public.bulk_upsert_characters(jsonb) is
  'Bulk upsert characters with authorization checks (200-500 rows recommended)';

grant execute on function public.bulk_upsert_characters(jsonb) to authenticated;

-- ==============================================================================
-- 3. Fix bulk_upsert_notes
-- ==============================================================================

drop function if exists public.bulk_upsert_notes(jsonb);

create or replace function public.bulk_upsert_notes(rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data record;
  project_ids uuid[];
  pid uuid;
begin
  -- Extract all unique project_ids from input
  select array_agg(distinct (value->>'project_id')::uuid)
  into project_ids
  from jsonb_array_elements(rows);

  -- Validate user has write access to ALL projects
  foreach pid in array project_ids loop
    if not public.can_write_project(pid) then
      raise exception 'Permission denied for project %', pid;
    end if;
  end loop;

  -- Now perform bulk upsert (all projects validated)
  insert into public.notes (
    id, project_id, kind, content, tags,
    client_rev, client_hash, created_at, updated_at, deleted_at
  )
  select
    (value->>'id')::uuid,
    (value->>'project_id')::uuid,
    coalesce(value->>'kind', 'note'),
    coalesce(value->>'content', ''),
    coalesce((value->>'tags')::text[], '{}'::text[]),
    coalesce((value->>'client_rev')::bigint, 0),
    value->>'client_hash',
    coalesce((value->>'created_at')::timestamptz, now()),
    coalesce((value->>'updated_at')::timestamptz, now()),
    (value->>'deleted_at')::timestamptz
  from jsonb_array_elements(rows)
  on conflict (id) do update
    set kind = excluded.kind,
        content = excluded.content,
        tags = excluded.tags,
        client_rev = excluded.client_rev,
        client_hash = excluded.client_hash,
        updated_at = now(),
        deleted_at = excluded.deleted_at;
end;
$$;

comment on function public.bulk_upsert_notes(jsonb) is
  'Bulk upsert notes with authorization checks (200-500 rows recommended)';

grant execute on function public.bulk_upsert_notes(jsonb) to authenticated;
