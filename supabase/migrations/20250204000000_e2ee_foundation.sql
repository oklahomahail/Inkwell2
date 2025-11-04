-- E2EE Foundation Migration
-- Adds optional client-side encryption support to projects and chapters
-- Safe to run multiple times (idempotent)

-- Projects: toggle and key wrap materials
alter table public.projects
  add column if not exists crypto_enabled boolean not null default false,
  add column if not exists wrapped_dek text,               -- base64
  add column if not exists kdf_params jsonb,               -- { type, opslimit, memlimit, salt, v }
  add column if not exists crypto_version int not null default 1;

comment on column public.projects.crypto_enabled is 'Whether E2EE is enabled for this project';
comment on column public.projects.wrapped_dek is 'Encrypted DEK (data encryption key) wrapped with user passphrase-derived master key';
comment on column public.projects.kdf_params is 'KDF parameters for deriving master key from passphrase (Argon2id or PBKDF2)';
comment on column public.projects.crypto_version is 'Crypto schema version for forward compatibility';

-- Chapters: store ciphertext (keep minimal plaintext for sorting/joins)
alter table public.chapters
  add column if not exists content_ciphertext text,        -- base64
  add column if not exists content_nonce text,             -- base64 (24b for XChaCha20-Poly1305)
  add column if not exists crypto_version int not null default 1;

comment on column public.chapters.content_ciphertext is 'Encrypted chapter content (when E2EE enabled)';
comment on column public.chapters.content_nonce is 'Nonce for AEAD encryption';
comment on column public.chapters.crypto_version is 'Crypto schema version for this chapter';

-- (Optional) Add updated_at if not already present
-- Note: This is handled by trigger in 20250128000001_touch_updated_at.sql
-- Verify chapters.updated_at exists and is timestamptz

-- Indexes for encrypted content queries (minimal; most queries still use project_id)
create index if not exists idx_chapters_crypto_version on public.chapters (crypto_version) where content_ciphertext is not null;
create index if not exists idx_projects_crypto_enabled on public.projects (crypto_enabled) where crypto_enabled = true;

-- RLS: These columns are read/write only by project owners or members (existing policies cover this)
-- No additional RLS changes needed; existing can_access_project policies apply.

-- Verification query (comment out in production; useful for local dev)
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'projects'
--   and column_name in ('crypto_enabled', 'wrapped_dek', 'kdf_params', 'crypto_version');
