-- Soft delete helpers: views and RPC
-- Views filter out deleted rows by default
-- RPC provides safe soft-delete operation

-- Active views (exclude soft-deleted rows)
create or replace view public.projects_active
with (security_invoker = true) as
  select * from public.projects where deleted_at is null;

create or replace view public.chapters_active
with (security_invoker = true) as
  select * from public.chapters where deleted_at is null;

create or replace view public.characters_active
with (security_invoker = true) as
  select * from public.characters where deleted_at is null;

create or replace view public.notes_active
with (security_invoker = true) as
  select * from public.notes where deleted_at is null;

-- RPC for safe soft delete
create or replace function public.soft_delete(_table text, _id uuid)
returns void language plpgsql security definer as $$
begin
  -- Validate table name to prevent SQL injection
  if _table not in ('projects', 'chapters', 'characters', 'notes') then
    raise exception 'Invalid table name: %', _table;
  end if;
  
  execute format('update public.%I set deleted_at = now() where id = $1', _table) using _id;
end;
$$;

-- Grant SELECT on views to authenticated users
grant select on public.projects_active to authenticated;
grant select on public.chapters_active to authenticated;
grant select on public.characters_active to authenticated;
grant select on public.notes_active to authenticated;

-- Comments
comment on view public.projects_active is 'Projects excluding soft-deleted rows';
comment on view public.chapters_active is 'Chapters excluding soft-deleted rows';
comment on view public.characters_active is 'Characters excluding soft-deleted rows';
comment on view public.notes_active is 'Notes excluding soft-deleted rows';
comment on function public.soft_delete(text, uuid) is 'Soft-delete a row by setting deleted_at to now()';
