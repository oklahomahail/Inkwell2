// src/export/utils/__tests__/svgCapture.spec.ts
import { describe, it, expect, vi } from 'vitest';

import { captureSVGBySelector } from '../svgCapture';

describe('svg capture', () => {
  it('returns a data URI for an SVG selector', async () => {
    const fake = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fake.setAttribute('width', '10');
    fake.setAttribute('height', '10');
    document.body.appendChild(fake);

    const query = vi.spyOn(document, 'querySelector').mockReturnValue(fake as any);
    const uri = captureSVGBySelector('#fake');
    expect(uri).toMatch(/^data:image\/svg\+xml;base64,/);
    query.mockRestore();
  });
});
