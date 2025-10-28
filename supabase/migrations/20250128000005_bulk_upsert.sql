-- Bulk upsert RPCs for efficient batch syncing
-- These reduce round-trips during initial sync from client to server

-- Bulk upsert chapters
create or replace function public.bulk_upsert_chapters(rows jsonb)
returns void language plpgsql security definer as $$
begin
  insert into public.chapters
    select * from jsonb_populate_recordset(null::public.chapters, rows)
  on conflict (id) do update
    set title = excluded.title,
        body = excluded.body,
        index_in_project = excluded.index_in_project,
        client_rev = excluded.client_rev,
        client_hash = excluded.client_hash,
        updated_at = now(),
        deleted_at = excluded.deleted_at;
end;
$$;

-- Bulk upsert characters
create or replace function public.bulk_upsert_characters(rows jsonb)
returns void language plpgsql security definer as $$
begin
  insert into public.characters
    select * from jsonb_populate_recordset(null::public.characters, rows)
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

-- Bulk upsert notes
create or replace function public.bulk_upsert_notes(rows jsonb)
returns void language plpgsql security definer as $$
begin
  insert into public.notes
    select * from jsonb_populate_recordset(null::public.notes, rows)
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

-- Comments
comment on function public.bulk_upsert_chapters(jsonb) is 'Bulk upsert chapters for efficient batch sync (200-500 rows recommended)';
comment on function public.bulk_upsert_characters(jsonb) is 'Bulk upsert characters for efficient batch sync (200-500 rows recommended)';
comment on function public.bulk_upsert_notes(jsonb) is 'Bulk upsert notes for efficient batch sync (200-500 rows recommended)';
