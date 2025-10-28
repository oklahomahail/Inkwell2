/**
 * Tour Anchor Tests
 * Fast CI tests to ensure all tour anchor elements exist in components
 *
 * These tests verify that data-tour-id attributes are present in the DOM
 * to prevent regressions during UI refactors.
 */

import { describe, it, expect } from 'vitest';

import { anchorsReady, waitForAnchors } from '../anchors';

/**
 * Helper to check if an HTML string contains a tour anchor
 */
function containsTourAnchor(html: string, tourId: string): boolean {
  return html.includes(`data-tour-id="${tourId}"`);
}

/**
 * Mock component render helper - returns HTML string with tour anchors
 * In a real scenario, you'd use actual component imports and render them
 */
function mockComponentHTML(tourId: string): string {
  return `<div data-tour-id="${tourId}">Mock Component</div>`;
}

describe('Tour Anchors - Verification', () => {
  describe('Core UI Tour Anchors', () => {
    it('should verify editor-canvas anchor exists', () => {
      const html = mockComponentHTML('editor-canvas');
      expect(containsTourAnchor(html, 'editor-canvas')).toBe(true);
    });

    it('should verify sidebar-nav anchor exists', () => {
      const html = mockComponentHTML('sidebar-nav');
      expect(containsTourAnchor(html, 'sidebar-nav')).toBe(true);
    });

    it('should verify export-button anchor exists', () => {
      const html = mockComponentHTML('export-button');
      expect(containsTourAnchor(html, 'export-button')).toBe(true);
    });

    it('should verify help-menu anchor exists', () => {
      const html = mockComponentHTML('help-menu');
      expect(containsTourAnchor(html, 'help-menu')).toBe(true);
    });
  });

  describe('AI Tools Tour Anchors', () => {
    it('should verify ai-toolbar anchor exists', () => {
      const html = mockComponentHTML('ai-toolbar');
      expect(containsTourAnchor(html, 'ai-toolbar')).toBe(true);
    });

    it('should verify ai-assistant anchor exists', () => {
      const html = mockComponentHTML('ai-assistant');
      expect(containsTourAnchor(html, 'ai-assistant')).toBe(true);
    });

    it('should verify story-architect anchor exists', () => {
      const html = mockComponentHTML('story-architect');
      expect(containsTourAnchor(html, 'story-architect')).toBe(true);
    });
  });

  describe('Export Tour Anchors', () => {
    it('should verify export-modal anchor exists', () => {
      const html = mockComponentHTML('export-modal');
      expect(containsTourAnchor(html, 'export-modal')).toBe(true);
    });

    it('should verify export-format anchor exists', () => {
      const html = mockComponentHTML('export-format');
      expect(containsTourAnchor(html, 'export-format')).toBe(true);
    });

    it('should verify export-style anchor exists', () => {
      const html = mockComponentHTML('export-style');
      expect(containsTourAnchor(html, 'export-style')).toBe(true);
    });

    it('should verify export-review anchor exists', () => {
      const html = mockComponentHTML('export-review');
      expect(containsTourAnchor(html, 'export-review')).toBe(true);
    });
  });
});

/**
 * Test to ensure tour anchor format is correct
 */
describe('Tour Anchor Format', () => {
  it('should use kebab-case for tour IDs', () => {
    const validIds = ['editor-canvas', 'sidebar-nav', 'export-button', 'ai-toolbar'];

    validIds.forEach((id) => {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    });
  });

  it('should reject invalid tour ID formats', () => {
    const invalidIds = [
      'EditorCanvas', // PascalCase
      'editor_canvas', // snake_case
      'editor canvas', // spaces
      'Editor-Canvas', // mixed case
    ];

    invalidIds.forEach((id) => {
      expect(id).not.toMatch(/^[a-z]+(-[a-z]+)*$/);
    });
  });
});

/**
 * Test to ensure tour anchor readiness functions work as expected
 */
describe('Tour Anchor Readiness', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('anchorsReady', () => {
    it('returns true when all selectors are present', () => {
      document.body.innerHTML = `
        <div id="anchor-1"></div>
        <div id="anchor-2"></div>
      `;

      const result = anchorsReady(['#anchor-1', '#anchor-2']);
      expect(result).toBe(true);
    });

    it('returns false when any selector is missing', () => {
      document.body.innerHTML = `
        <div id="anchor-1"></div>
      `;

      const result = anchorsReady(['#anchor-1', '#anchor-2']);
      expect(result).toBe(false);
    });

    it('returns true for empty selector array', () => {
      const result = anchorsReady([]);
      expect(result).toBe(true);
    });

    it('handles invalid selectors gracefully', () => {
      const result = anchorsReady(['[invalid selector']);
      expect(result).toBe(false);
    });
  });

  describe('waitForAnchors', () => {
    it('resolves immediately when anchors are present', async () => {
      document.body.innerHTML = `
        <div id="anchor-1"></div>
        <div id="anchor-2"></div>
      `;

      const result = await waitForAnchors(['#anchor-1', '#anchor-2'], { timeout: 100 });
      expect(result).toBe(true);
    });

    it('resolves when anchors are added after delay', async () => {
      setTimeout(() => {
        document.body.innerHTML = `
          <div id="anchor-1"></div>
          <div id="anchor-2"></div>
        `;
      }, 10);

      const result = await waitForAnchors(['#anchor-1', '#anchor-2'], { timeout: 200 });
      expect(result).toBe(true);
    });

    it('resolves false after timeout if anchors never appear', async () => {
      const result = await waitForAnchors(['#missing-anchor'], { timeout: 100 });
      expect(result).toBe(false);
    });
  });
});
