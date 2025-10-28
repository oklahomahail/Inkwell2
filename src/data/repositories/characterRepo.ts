import { selectFrom } from '@/data/supaSelect';
import { supabase } from '@/lib/supabaseClient';
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
