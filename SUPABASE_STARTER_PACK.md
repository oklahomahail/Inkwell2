# Inkwell — Supabase Migration Starter Pack (v0.1)

This pack gives you a clean, copy‑paste baseline to add Supabase‑backed cloud sync while keeping the app local‑first. It includes:

1. SQL schema + RLS
2. Env and client bootstrap
3. Repositories (projects/chapters/characters/notes)
4. Local‑first sync queue and manager (IndexedDB → Supabase)
5. Conflict detection utilities
6. UI toggle and badges
7. Export/backup hook points
8. Docs + GitHub issue checklist
9. **Enhanced migrations** (auto-touch, soft-delete, bulk ops)
10. **Client utilities** (active views, guardrails)

---

## 0) Environment

**File:** `.env.example`

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Optional later (server jobs/webhooks)
# SUPABASE_SERVICE_ROLE=

# Feature flags
VITE_ENABLE_SUPABASE_SYNC=false
```

**File:** `src/env.d.ts`

```ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_SUPABASE_SYNC?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 1) Database: SQL schema + RLS

**See:** `supabase/migrations/2025-10-28_inkwell_schema.sql` (already created)

Creates: profiles, projects, project_members, chapters, characters, notes with RLS policies.

---

## 2) Enhanced SQL Migrations

### Auto-touch `updated_at`

**File:** `supabase/migrations/2025-10-28_touch_updated_at.sql` ✅ Created

Server-controlled timestamps on all updates.

### Profile Auto-creation

**File:** `supabase/migrations/2025-10-28_profiles_autocreate.sql` ✅ Created

Automatically creates profile on user signup.

### Soft Delete Helpers

**File:** `supabase/migrations/2025-10-28_soft_delete_helpers.sql` ✅ Created

Views (`*_active`) and RPC for soft deletes.

### Role-based Write Guards

**File:** `supabase/migrations/2025-10-28_roles_write_guard.sql` ✅ Created

Enforces owner/editor/viewer permissions.

### Bulk Upsert RPCs

**File:** `supabase/migrations/2025-10-28_bulk_upsert.sql` ✅ Created

Efficient batch operations for sync.

### Index Refinements

**File:** `supabase/migrations/2025-10-28_index_refinements.sql` ✅ Created

Performance indexes for conflict detection.

### Seed Data (Optional)

**File:** `supabase/migrations/2025-10-28_seed_minimal.sql` ✅ Created

Demo data for QA testing.

---

## 3) Supabase Client Bootstrap

**File:** `src/lib/supabaseClient.ts` ✅ Exists

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: { fetch: (...args) => fetch(...args) },
  },
);
```

---

## 4) Types and Repositories

### Base Types

**File:** `src/types/persistence.ts`

```ts
export interface BaseEntity {
  id: string;
  project_id: string;
  client_rev: number;
  client_hash?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  summary?: string;
  schema_version: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Chapter extends BaseEntity {
  index_in_project: number;
  title: string;
  body: string;
}

export interface Character extends BaseEntity {
  name: string;
  bio: string;
  traits: Record<string, unknown>;
}

export interface Note extends BaseEntity {
  kind: string;
  content: string;
  tags: string[];
}
```

### Active View Helpers

**File:** `src/data/dbViews.ts`

```ts
// Maps base tables to their "active" views
export const ACTIVE_VIEW: Record<string, string> = {
  chapters: 'chapters_active',
  characters: 'characters_active',
  notes: 'notes_active',
};

export function viewFor(table: string): string {
  return ACTIVE_VIEW[table] ?? table; // fall back to base if no view exists
}
```

**File:** `src/data/supaSelect.ts`

```ts
import { supabase } from '@/lib/supabaseClient';
import { viewFor } from './dbViews';

/**
 * Select helper that automatically targets the `*_active` view if available.
 * Usage: selectFrom('chapters').eq('project_id', id)
 */
export function selectFrom(table: string) {
  return supabase.from(viewFor(table));
}
```

### Repositories (with Active Views)

**File:** `src/data/repositories/projectRepo.ts`

```ts
import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/persistence';

export async function createProject(input: Pick<Project, 'title' | 'summary'>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title: input.title, summary: input.summary })
    .select('*')
    .single();
  if (error) throw error;
  return data as Project;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects_active') // Use active view
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  // Use soft delete RPC
  await supabase.rpc('soft_delete', { _table: 'projects', _id: id });
}
```

**File:** `src/data/repositories/chapterRepo.ts`

```ts
import { supabase } from '@/lib/supabaseClient';
import { selectFrom } from '@/data/supaSelect';
import type { Chapter } from '@/types/persistence';

export async function fetchChapters(projectId: string): Promise<Chapter[]> {
  const { data, error } = await selectFrom('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('index_in_project', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Chapter[];
}

export async function upsertChapters(rows: Partial<Chapter>[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('chapters').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function bulkUpsertChapters(rows: Chapter[]): Promise<void> {
  if (!rows.length) return;
  // Use bulk RPC for efficiency (200-500 rows recommended)
  await supabase.rpc('bulk_upsert_chapters', { rows: JSON.stringify(rows) });
}

export async function deleteChapter(id: string): Promise<void> {
  await supabase.rpc('soft_delete', { _table: 'chapters', _id: id });
}
```

**File:** `src/data/repositories/characterRepo.ts`

```ts
import { supabase } from '@/lib/supabaseClient';
import { selectFrom } from '@/data/supaSelect';
import type { Character } from '@/types/persistence';

export async function fetchCharacters(projectId: string): Promise<Character[]> {
  const { data, error } = await selectFrom('characters')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Character[];
}

export async function upsertCharacters(rows: Partial<Character>[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('characters').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function bulkUpsertCharacters(rows: Character[]): Promise<void> {
  if (!rows.length) return;
  await supabase.rpc('bulk_upsert_characters', { rows: JSON.stringify(rows) });
}

export async function deleteCharacter(id: string): Promise<void> {
  await supabase.rpc('soft_delete', { _table: 'characters', _id: id });
}
```

**File:** `src/data/repositories/noteRepo.ts`

```ts
import { supabase } from '@/lib/supabaseClient';
import { selectFrom } from '@/data/supaSelect';
import type { Note } from '@/types/persistence';

export async function fetchNotes(projectId: string): Promise<Note[]> {
  const { data, error } = await selectFrom('notes')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function upsertNotes(rows: Partial<Note>[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('notes').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function bulkUpsertNotes(rows: Note[]): Promise<void> {
  if (!rows.length) return;
  await supabase.rpc('bulk_upsert_notes', { rows: JSON.stringify(rows) });
}

export async function deleteNote(id: string): Promise<void> {
  await supabase.rpc('soft_delete', { _table: 'notes', _id: id });
}
```

---

## 5) Local‑first Sync Queue (IndexedDB)

**File:** `src/sync/queue.ts`

```ts
// Minimal interface so you can swap into your existing IDB service
export type SyncOp = 'upsert' | 'delete';
export interface SyncItem<T = any> {
  id: string;
  table: 'chapters' | 'characters' | 'notes';
  project_id: string;
  op: SyncOp;
  payload?: T;
  client_rev: number;
  created_at: number;
}

const STORE = 'sync_queue';

export const SyncQueue = {
  async enqueue<T>(db: IDBDatabase, item: SyncItem<T>) {
    return tx(db, STORE, 'readwrite').objectStore(STORE).add(item);
  },
  async dequeueBatch(db: IDBDatabase, limit = 100): Promise<SyncItem[]> {
    const items: SyncItem[] = [];
    await iterate(db, STORE, (val) => {
      if (items.length < limit) items.push(val as SyncItem);
    });
    return items;
  },
  async acknowledge(db: IDBDatabase, ids: string[]) {
    await Promise.all(ids.map((id) => tx(db, STORE, 'readwrite').objectStore(STORE).delete(id)));
  },
};

// Helpers (replace with your own IDB utils if you prefer)
function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
  const t = db.transaction(store, mode);
  return Object.assign(t, { objectStore: (s: string) => t.objectStore(s) });
}

async function iterate(db: IDBDatabase, store: string, onValue: (v: unknown) => void) {
  await new Promise<void>((resolve, reject) => {
    const req = tx(db, store, 'readonly').objectStore(store).openCursor();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve();
      onValue(cursor.value);
      cursor.continue();
    };
  });
}
```

---

## 6) Conflict Detection Utilities

**File:** `src/sync/conflict.ts`

```ts
export type WithRev = { client_rev: number; updated_at: string };
export type Conflict<T> = { table: string; local: T; remote: T };

export function isConflict(local: WithRev, remote: WithRev): boolean {
  return Number(remote.client_rev) > Number(local.client_rev);
}

export function nextRev(current: number) {
  return (current || 0) + 1;
}
```

---

## 7) Sync Manager (Hook + Worker)

**File:** `src/sync/useSyncManager.ts`

```ts
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SyncQueue, SyncItem } from './queue';

const BATCH = 100;
const INTERVAL_MS = 5_000;

export function useSyncManager(db: IDBDatabase | null, enabled: boolean) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!db || !enabled) return;

    async function tick() {
      try {
        setStatus('syncing');
        const batch = await SyncQueue.dequeueBatch(db, BATCH);
        if (!batch.length) {
          setStatus('idle');
          return;
        }
        await pushBatch(batch);
        await SyncQueue.acknowledge(
          db,
          batch.map((b) => b.id),
        );
        setStatus('idle');
      } catch (e) {
        console.warn('sync error', e);
        setStatus('error');
      }
    }

    timer.current = window.setInterval(tick, INTERVAL_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [db, enabled]);

  return { status };
}

async function pushBatch(batch: SyncItem[]) {
  const groups = groupBy(batch, (b) => b.table);

  for (const [table, items] of Object.entries(groups)) {
    const upserts = items.filter((i) => i.op === 'upsert').map((i) => i.payload);
    const deletes = items.filter((i) => i.op === 'delete').map((i) => i.payload);

    // Use bulk RPC for efficiency if batch is large
    if (upserts.length > 50) {
      const rpcName = `bulk_upsert_${table}`;
      const { error } = await supabase.rpc(rpcName as any, { rows: JSON.stringify(upserts) });
      if (error) throw error;
    } else if (upserts.length) {
      const { error } = await supabase.from(table).upsert(upserts as any[], { onConflict: 'id' });
      if (error) throw error;
    }

    if (deletes.length) {
      const ids = (deletes as any[]).map((d) => d.id);
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    }
  }
}

function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, cur) => {
      const k = key(cur);
      (acc[k] ||= []).push(cur);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}
```

---

## 8) UI Toggle and Status Badge

**File:** `src/features/settings/CloudSyncToggle.tsx`

```tsx
import { useEffect, useState } from 'react';

export function CloudSyncToggle({
  value,
  onChange,
}: {
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  const [checked, setChecked] = useState(
    Boolean(value ?? import.meta.env.VITE_ENABLE_SUPABASE_SYNC === 'true'),
  );

  useEffect(() => {
    onChange(checked);
  }, [checked, onChange]);

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      <span>Enable cloud sync (local‑first remains active)</span>
    </label>
  );
}
```

**File:** `src/components/Badges/LocalFirstBadge.tsx`

```tsx
export function LocalFirstBadge({ online, syncing }: { online: boolean; syncing: boolean }) {
  const label = !online ? 'Offline, saved locally' : syncing ? 'Syncing…' : 'Local‑first, synced';
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border">
      {label}
    </span>
  );
}
```

---

## 9) Integration Points in Existing Flows

### Enqueue on Local Write

```ts
import { SyncQueue } from '@/sync/queue';
import { nextRev } from '@/sync/conflict';
import { v4 as uuid } from 'uuid';

async function saveChapter(db: IDBDatabase, chapter: any) {
  // 1) Increment revision
  chapter.client_rev = nextRev(chapter.client_rev);

  // 2) Local write (existing code)
  await idb.chapters.put(chapter);

  // 3) Queue for sync
  await SyncQueue.enqueue(db, {
    id: uuid(),
    table: 'chapters',
    project_id: chapter.project_id,
    op: 'upsert',
    payload: chapter,
    client_rev: chapter.client_rev,
    created_at: Date.now(),
  });
}
```

### Project Open (Merge Server → Local)

```ts
import { supabase } from '@/lib/supabaseClient';
import { selectFrom } from '@/data/supaSelect';
import { isConflict } from '@/sync/conflict';

async function openProject(db: IDBDatabase, projectId: string) {
  const local = await idb.loadProject(projectId);

  if (navigator.onLine) {
    // Fetch from active views (excludes deleted)
    const { data } = await selectFrom('chapters').select('*').eq('project_id', projectId);

    // Merge with conflict detection
    await idb.merge('chapters', data ?? [], isConflict);
  }

  return local;
}
```

---

## 10) Guardrails & DX

### Lint Rule (Prevent Direct Base Table Queries)

**File:** `eslint.config.js` (add custom rule)

```js
export default [
  // ...existing config
  {
    rules: {
      'no-direct-base-selects': 'warn',
    },
    plugins: {
      'no-direct-base-selects': {
        create(context) {
          return {
            CallExpression(node) {
              const callee = node.callee;
              if (
                callee?.type === 'MemberExpression' &&
                callee.property?.name === 'from' &&
                node.arguments?.[0]?.type === 'Literal'
              ) {
                const name = node.arguments[0].value;
                const disallow = new Set(['chapters', 'characters', 'notes']);
                if (disallow.has(name)) {
                  context.report({
                    node,
                    message: `Select from \`${name}\` should use selectFrom() to target *_active view.`,
                  });
                }
              }
            },
          };
        },
      },
    },
  },
];
```

### Test for View Helper

**File:** `src/data/__tests__/supaSelect.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { viewFor } from '@/data/dbViews';

describe('viewFor', () => {
  it('maps to *_active when available', () => {
    expect(viewFor('chapters')).toBe('chapters_active');
    expect(viewFor('characters')).toBe('characters_active');
    expect(viewFor('notes')).toBe('notes_active');
  });

  it('falls back to base for tables without views', () => {
    expect(viewFor('projects')).toBe('projects');
  });
});
```

---

## 11) Dev Utilities

### Preflight Check

**File:** `src/dev/preflight.ts`

```ts
export function assertSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      '[Inkwell] Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
}
```

**Usage in app bootstrap:**

```ts
if (import.meta.env.DEV) {
  import('@/dev/preflight').then((m) => m.assertSupabaseEnv());
}
```

### Health Check Route

**File:** `src/routes/Health.tsx`

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Health() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData, error: sErr } = await supabase.auth.getSession();
        if (sErr) throw sErr;
        const authed = Boolean(sessionData.session);

        const { error: qErr } = await supabase
          .from('projects')
          .select('id', { head: true, count: 'exact' })
          .limit(0);
        if (qErr) throw qErr;

        setStatus('ok');
        setDetails(`auth=${authed ? 'yes' : 'no'}, query=head-select ok`);
      } catch (e: any) {
        setStatus('error');
        setDetails(e?.message || 'unknown error');
      }
    })();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Health</h1>
      <p className="mt-2">
        Status: <strong>{status}</strong>
      </p>
      {details && <pre className="mt-2 whitespace-pre-wrap text-sm">{details}</pre>}
      <p className="mt-4 text-sm opacity-75">Note: run while signed in to fully exercise RLS.</p>
    </main>
  );
}
```

---

## 12) Package Scripts

**File:** `package.json` (add to scripts)

```json
{
  "scripts": {
    "supabase:setup": "bash scripts/setup-supabase.sh",
    "supabase:push": "npx supabase db push",
    "supabase:types": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF --schema public > src/types/supabase.ts",
    "supabase:health": "open http://localhost:5173/health"
  }
}
```

---

## 13) Documentation

### User-facing Copy

**File:** `docs/features/sync.md`

```md
# Sync and Storage in Inkwell

Inkwell is **local‑first**. Your work saves instantly on your device and **works offline**. When you're online, Inkwell can **sync securely to the cloud** so your projects stay backed up and available across devices.

- Local storage: IndexedDB for fast, reliable offline access.
- Cloud sync (optional): Supabase Postgres with Row Level Security.
- Privacy: You control sync. Turn it on or off anytime in Settings.
- Backups: You can export a portable `.inkwell` bundle at any time.
- Conflicts: If changes happen in two places, Inkwell will ask you which version to keep or how to merge.

**Dev tip:** When reading from Supabase, use the `selectFrom()` helper so you automatically query the `*_active` views and avoid pulling soft‑deleted rows into the UI.
```

### Messaging Guide

**File:** `docs/product/messaging-changes.md`

```md
## Messaging updates

Replace "offline‑first" with:

- "Local‑first writing app with optional cloud sync," or
- "Works offline, syncs when you're online," or
- "Your work saves on your device and syncs securely to the cloud when available."

Update these surfaces:

- Website hero + meta description
- README and docs/overview
- In‑app About/Welcome content
- Store listings or landing pages if applicable
```

---

## 14) Quick Reference

**All migrations:** ✅ Created in `supabase/migrations/`
**All scripts:** ✅ Created in `scripts/`
**All docs:** ✅ Created in root

### Key Files Status

| File                          | Status     |
| ----------------------------- | ---------- |
| Core schema migration         | ✅ Created |
| Enhanced migrations (7 files) | ✅ Created |
| Setup script                  | ✅ Created |
| VS Code tasks                 | ✅ Created |
| Documentation                 | ✅ Created |

### To Implement

Create these files in your project:

- [ ] `src/types/persistence.ts` - Type definitions
- [ ] `src/data/dbViews.ts` - View mapping helper
- [ ] `src/data/supaSelect.ts` - Select helper for active views
- [ ] `src/data/repositories/projectRepo.ts` - Project repository
- [ ] `src/data/repositories/chapterRepo.ts` - Chapter repository (with selectFrom)
- [ ] `src/data/repositories/characterRepo.ts` - Character repository (with selectFrom)
- [ ] `src/data/repositories/noteRepo.ts` - Note repository (with selectFrom)
- [ ] `src/sync/queue.ts` - Sync queue for IndexedDB
- [ ] `src/sync/conflict.ts` - Conflict detection utilities
- [ ] `src/sync/useSyncManager.ts` - Sync manager hook
- [ ] `src/features/settings/CloudSyncToggle.tsx` - Settings UI
- [ ] `src/components/Badges/LocalFirstBadge.tsx` - Status badge
- [ ] `src/dev/preflight.ts` - Environment check
- [ ] `src/routes/Health.tsx` - Health check route
- [ ] `src/data/__tests__/supaSelect.test.ts` - View helper test
- [ ] `docs/features/sync.md` - User documentation
- [ ] `docs/product/messaging-changes.md` - Messaging guide

### Integration Checklist

1. [ ] Run `./scripts/setup-supabase.sh`
2. [ ] Apply all 8 migrations via `npx supabase db push`
3. [ ] Generate types: `npm run supabase:types`
4. [ ] Create repository files with `selectFrom()` helper
5. [ ] Implement sync queue in existing IndexedDB service
6. [ ] Add `CloudSyncToggle` to Settings page
7. [ ] Add `LocalFirstBadge` to app header
8. [ ] Hook up sync on all local writes
9. [ ] Add merge logic on project open
10. [ ] Test offline→online sync flow
11. [ ] Test conflict detection
12. [ ] Update user-facing documentation

---

## Best Practices

1. **Always use `selectFrom()` for reads** - Automatically queries `*_active` views
2. **Use bulk RPCs for large batches** - 200-500 rows recommended
3. **Let server handle timestamps** - Don't set `updated_at` client-side
4. **Increment `client_rev` on every write** - For conflict detection
5. **Use soft delete RPC** - `supabase.rpc('soft_delete', {...})`
6. **Query `*_active` views by default** - Exclude deleted rows
7. **Batch sync in background** - Every 5 seconds when online
8. **Regenerate types after migrations** - Keep TypeScript in sync

---

## Quick Commands

```bash
# Full setup
./scripts/setup-supabase.sh

# Push migrations
npx supabase db push

# Generate types
npm run supabase:types

# Find messaging to update
./scripts/find-offline-claims.sh

# Run health check
npm run dev
# Visit http://localhost:5173/health
```

---

**See also:**

- [Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)
- [Migrations Reference](./SUPABASE_MIGRATIONS_REFERENCE.md)
- [Quick Reference](./SUPABASE_QUICK_REFERENCE.md)
- [Complete Checklist](./SUPABASE_INTEGRATION_COMPLETE_CHECKLIST.md)
