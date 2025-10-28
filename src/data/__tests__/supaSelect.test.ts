import { describe, it, expect } from 'vitest';

import { viewFor } from '../dbViews';

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
