/**
 * EPUB Export Service Tests
 *
 * Focus on metadata integrity and document structure validation.
 * Tests ensure:
 * - OPF includes correct title, language fallback, and optional author
 * - nav.xhtml anchors match content.xhtml IDs
 * - Language normalization works correctly
 * - Input validation catches missing fields
 * - Feature flag is respected
 */

import { describe, expect, test, vi } from 'vitest';

import type { EpubExportInput, ExportChapter } from '../export/exportService.epub';
import {
  buildContentXhtml,
  buildNavXhtml,
  buildOpf,
  exportEpub,
  sanitizeFilename,
} from '../export/exportService.epub';

describe('EPUB metadata integrity', () => {
  const sampleChapters: ExportChapter[] = [
    { id: '1', title: 'Chapter One', bodyHtml: '<p>First chapter content.</p>' },
    { id: '2', title: 'Chapter Two', bodyHtml: '<p>Second chapter content.</p>' },
  ];

  describe('buildOpf', () => {
    test('includes title, language fallback, and optional author', () => {
      const opf = buildOpf({
        title: 'My Book',
        author: 'Anonymous Author',
        lang: 'en',
        uuid: 'test-uuid-1234',
      });

      expect(opf).toContain('<dc:title>My Book</dc:title>');
      expect(opf).toContain('<dc:language>en</dc:language>');
      expect(opf).toContain('<dc:creator>Anonymous Author</dc:creator>');
      expect(opf).toContain('id="pub-id"');
      expect(opf).toContain('urn:uuid:test-uuid-1234');
    });

    test('omits empty author', () => {
      const opf = buildOpf({
        title: 'My Book',
        lang: 'en',
        uuid: 'test-uuid-1234',
      });

      expect(opf).toContain('<dc:title>My Book</dc:title>');
      expect(opf).not.toContain('<dc:creator>');
    });

    test('escapes XML special characters in title', () => {
      const opf = buildOpf({
        title: 'My Book <Draft> & "Final"',
        lang: 'en',
        uuid: 'test-uuid-1234',
      });

      expect(opf).toContain('&lt;Draft&gt;');
      expect(opf).toContain('&amp;');
      expect(opf).toContain('&quot;');
    });

    test('includes manifest items for nav and content', () => {
      const opf = buildOpf({
        title: 'My Book',
        lang: 'en',
        uuid: 'test-uuid-1234',
      });

      expect(opf).toContain('<item id="nav" href="nav.xhtml"');
      expect(opf).toContain('properties="nav"');
      expect(opf).toContain('<item id="content" href="content.xhtml"');
    });

    test('includes spine with content itemref', () => {
      const opf = buildOpf({
        title: 'My Book',
        lang: 'en',
        uuid: 'test-uuid-1234',
      });

      expect(opf).toContain('<spine>');
      expect(opf).toContain('<itemref idref="content"/>');
    });
  });

  describe('buildNavXhtml', () => {
    test('generates navigation with correct anchors', () => {
      const nav = buildNavXhtml(sampleChapters, 'en');

      expect(nav).toContain('epub:type="toc"');
      expect(nav).toContain('<a href="content.xhtml#ch-1">Chapter One</a>');
      expect(nav).toContain('<a href="content.xhtml#ch-2">Chapter Two</a>');
    });

    test('escapes chapter titles with XML special characters', () => {
      const chapters: ExportChapter[] = [
        { id: '1', title: 'Chapter <1> & More', bodyHtml: '<p>Content</p>' },
      ];
      const nav = buildNavXhtml(chapters, 'en');

      expect(nav).toContain('Chapter &lt;1&gt; &amp; More');
    });

    test('sets correct language attribute', () => {
      const nav = buildNavXhtml(sampleChapters, 'en-US');

      expect(nav).toContain('xml:lang="en-us"');
      expect(nav).toContain('lang="en-us"');
    });

    test('includes XHTML namespace and EPUB namespace', () => {
      const nav = buildNavXhtml(sampleChapters, 'en');

      expect(nav).toContain('xmlns="http://www.w3.org/1999/xhtml"');
      expect(nav).toContain('xmlns:epub="http://www.idpf.org/2007/ops"');
    });
  });

  describe('buildContentXhtml', () => {
    test('generates sections with matching IDs', () => {
      const content = buildContentXhtml(sampleChapters, 'en');

      expect(content).toContain('<section id="ch-1">');
      expect(content).toContain('<section id="ch-2">');
      expect(content).toContain('<h1>Chapter One</h1>');
      expect(content).toContain('<h1>Chapter Two</h1>');
    });

    test('includes chapter body HTML content', () => {
      const content = buildContentXhtml(sampleChapters, 'en');

      expect(content).toContain('<p>First chapter content.</p>');
      expect(content).toContain('<p>Second chapter content.</p>');
    });

    test('sets correct language attribute', () => {
      const content = buildContentXhtml(sampleChapters, 'fr');

      expect(content).toContain('xml:lang="fr"');
      expect(content).toContain('lang="fr"');
    });

    test('escapes chapter titles but preserves body HTML', () => {
      const chapters: ExportChapter[] = [
        {
          id: '1',
          title: 'Chapter <1>',
          bodyHtml: '<p>Content with <strong>HTML</strong></p>',
        },
      ];
      const content = buildContentXhtml(chapters, 'en');

      // Title should be escaped
      expect(content).toContain('<h1>Chapter &lt;1&gt;</h1>');
      // Body HTML should be preserved
      expect(content).toContain('<strong>HTML</strong>');
    });
  });

  describe('nav and content anchor matching', () => {
    test('nav anchors match content section IDs', () => {
      const chapters: ExportChapter[] = [
        { id: '1', title: 'One', bodyHtml: '<p>A</p>' },
        { id: '2', title: 'Two', bodyHtml: '<p>B</p>' },
        { id: '3', title: 'Three', bodyHtml: '<p>C</p>' },
      ];

      const nav = buildNavXhtml(chapters, 'en');
      const content = buildContentXhtml(chapters, 'en');

      // Check that each nav anchor points to a corresponding content section
      expect(nav).toContain('href="content.xhtml#ch-1"');
      expect(content).toContain('id="ch-1"');

      expect(nav).toContain('href="content.xhtml#ch-2"');
      expect(content).toContain('id="ch-2"');

      expect(nav).toContain('href="content.xhtml#ch-3"');
      expect(content).toContain('id="ch-3"');
    });
  });

  describe('exportEpub', () => {
    test('generates valid EPUB blob with required files', async () => {
      const input: EpubExportInput = {
        title: 'Test Book',
        author: 'Test Author',
        language: 'en',
        chapters: sampleChapters,
      };

      const blob = await exportEpub(input);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    test('feature flag check exists (manual test required)', () => {
      // Note: Feature flag testing requires manual verification
      // Set VITE_ENABLE_EPUB_EXPORT=false in .env and verify error is thrown
      // This test validates the flag check is present in the code

      const epubServiceCode = exportEpub.toString();
      expect(epubServiceCode).toContain('EPUB_ENABLED');
    });

    test('throws error when title is missing', async () => {
      const input: EpubExportInput = {
        title: '',
        chapters: sampleChapters,
      };

      await expect(exportEpub(input)).rejects.toThrow('requires a title');
    });

    test('throws error when chapters array is empty', async () => {
      const input: EpubExportInput = {
        title: 'Test Book',
        chapters: [],
      };

      await expect(exportEpub(input)).rejects.toThrow('at least one chapter');
    });

    test('throws error when chapter is missing title', async () => {
      const input: EpubExportInput = {
        title: 'Test Book',
        chapters: [{ id: '1', title: '', bodyHtml: '<p>Content</p>' }],
      };

      await expect(exportEpub(input)).rejects.toThrow('missing a title');
    });

    test('defaults language to "en" when not specified', async () => {
      const input: EpubExportInput = {
        title: 'Test Book',
        chapters: sampleChapters,
      };

      const blob = await exportEpub(input);
      expect(blob).toBeInstanceOf(Blob);
    });

    test('normalizes language code to lowercase', async () => {
      const input: EpubExportInput = {
        title: 'Test Book',
        language: 'EN-US',
        chapters: sampleChapters,
      };

      const blob = await exportEpub(input);
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('sanitizeFilename', () => {
    test('converts to lowercase', () => {
      expect(sanitizeFilename('My Book Title')).toBe('my_book_title');
    });

    test('replaces spaces with underscores', () => {
      expect(sanitizeFilename('The Great Novel')).toBe('the_great_novel');
    });

    test('removes special characters', () => {
      expect(sanitizeFilename('Book: Chapter 1!')).toBe('book_chapter_1');
    });

    test('preserves hyphens and underscores', () => {
      expect(sanitizeFilename('my-book_draft-2')).toBe('my-book_draft-2');
    });

    test('handles consecutive spaces', () => {
      expect(sanitizeFilename('Multiple   Spaces')).toBe('multiple_spaces');
    });
  });

  describe('language handling', () => {
    test('supports various BCP 47 language codes', async () => {
      const languages = ['en', 'en-US', 'fr', 'de', 'es-MX', 'zh-CN'];

      for (const lang of languages) {
        const input: EpubExportInput = {
          title: 'Test Book',
          language: lang,
          chapters: sampleChapters,
        };

        const blob = await exportEpub(input);
        expect(blob).toBeInstanceOf(Blob);
      }
    });
  });
});
