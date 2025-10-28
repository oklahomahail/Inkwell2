import { selectFrom } from '@/data/supaSelect';
import { supabase } from '@/lib/supabaseClient';
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
