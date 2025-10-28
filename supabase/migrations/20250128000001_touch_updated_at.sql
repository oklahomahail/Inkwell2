-- Auto-touch updated_at on all entity updates
-- This ensures updated_at is always server-controlled and accurate

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach to projects table
drop trigger if exists trg_touch_projects on public.projects;
create trigger trg_touch_projects
before update on public.projects
for each row execute function public.touch_updated_at();

-- Attach to profiles table
drop trigger if exists trg_touch_profiles on public.profiles;
create trigger trg_touch_profiles
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Attach to chapters table
drop trigger if exists trg_touch_chapters on public.chapters;
create trigger trg_touch_chapters
before update on public.chapters
for each row execute function public.touch_updated_at();

-- Attach to characters table
drop trigger if exists trg_touch_characters on public.characters;
create trigger trg_touch_characters
before update on public.characters
for each row execute function public.touch_updated_at();

-- Attach to notes table
drop trigger if exists trg_touch_notes on public.notes;
create trigger trg_touch_notes
before update on public.notes
for each row execute function public.touch_updated_at();

-- Comment
comment on function public.touch_updated_at() is 'Automatically updates updated_at timestamp on UPDATE operations';
