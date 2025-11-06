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

  it('escapes HTML special characters in content', () => {
    const html = renderManuscriptHTML({
      title: 'Test & Book',
      author: 'A. Writer <test@example.com>',
      chapters: [
        {
          title: 'Chapter "One"',
          text: 'Hello & goodbye\n<script>alert("xss")</script>\n"quoted" and \'single\'',
        },
      ],
    } as any);

    // Check title escaping
    expect(html).toContain('Test &amp; Book');

    // Check author escaping
    expect(html).toContain('A. Writer &lt;test@example.com&gt;');

    // Check chapter title escaping
    expect(html).toContain('Chapter &quot;One&quot;');

    // Check content escaping - all special chars should be escaped
    expect(html).toContain('Hello &amp; goodbye');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;xss&quot;');
    expect(html).toContain('&quot;quoted&quot;');
    expect(html).toContain('&#039;single&#039;');

    // Ensure raw HTML is not present
    expect(html).not.toContain('<script>alert');
  });
});
