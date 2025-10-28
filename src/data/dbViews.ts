// Maps base tables to their "active" views
export const ACTIVE_VIEW: Record<string, string> = {
  chapters: 'chapters_active',
  characters: 'characters_active',
  notes: 'notes_active',
};

export function viewFor(table: string): string {
  return ACTIVE_VIEW[table] ?? table; // fall back to base if no view exists
}
