// src/export/templates/__tests__/manuscript.spec.ts
import { describe, it, expect } from 'vitest';

import { renderManuscriptHTML } from '../manuscript';

describe('manuscript template', () => {
  it('renders basic manuscript structure with chapters', () => {
    const html = renderManuscriptHTML({
      title: 'My Book',
      author: 'A. Writer',
      chapters: [
        { title: 'One', text: 'Hello world' },
        { title: 'Two', text: 'Second chapter' },
      ],
    } as any);

    expect(html).toContain('My Book');
    expect(html).toContain('A. Writer');
    expect(html).toContain('One');
    expect(html).toContain('Two');
    expect(html).toContain('<p>Hello world</p>');
    expect(html).toContain('<p>Second chapter</p>');
  });
});
