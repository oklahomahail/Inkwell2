/**
 * Section Type Tests
 *
 * Tests for section type helpers and metadata
 */

import { describe, expect, it } from 'vitest';

import {
  getSectionTypeMeta,
  SECTION_TYPE_META,
  shouldIncludeInChapterCount,
  shouldIncludeInWordCount,
  type SectionType,
} from '../section';

describe('Section Type Helpers', () => {
  describe('SECTION_TYPE_META', () => {
    it('has metadata for all section types', () => {
      const types: SectionType[] = [
        'chapter',
        'prologue',
        'epilogue',
        'foreword',
        'afterword',
        'acknowledgements',
        'dedication',
        'title-page',
        'appendix',
        'custom',
      ];

      types.forEach((type) => {
        expect(SECTION_TYPE_META[type]).toBeDefined();
        expect(SECTION_TYPE_META[type].type).toBe(type);
        expect(SECTION_TYPE_META[type].label).toBeTruthy();
        expect(SECTION_TYPE_META[type].description).toBeTruthy();
        expect(typeof SECTION_TYPE_META[type].includeInWordCount).toBe('boolean');
        expect(typeof SECTION_TYPE_META[type].includeInChapterCount).toBe('boolean');
      });
    });

    it('correctly configures chapter metadata', () => {
      const meta = SECTION_TYPE_META.chapter;
      expect(meta.label).toBe('Chapter');
      expect(meta.includeInWordCount).toBe(true);
      expect(meta.includeInChapterCount).toBe(true);
    });

    it('correctly configures prologue metadata', () => {
      const meta = SECTION_TYPE_META.prologue;
      expect(meta.label).toBe('Prologue');
      expect(meta.includeInWordCount).toBe(true);
      expect(meta.includeInChapterCount).toBe(false);
    });

    it('correctly configures epilogue metadata', () => {
      const meta = SECTION_TYPE_META.epilogue;
      expect(meta.label).toBe('Epilogue');
      expect(meta.includeInWordCount).toBe(true);
      expect(meta.includeInChapterCount).toBe(false);
    });

    it('correctly configures front/back matter to exclude from counts', () => {
      const frontBackMatter: SectionType[] = [
        'foreword',
        'afterword',
        'acknowledgements',
        'dedication',
        'title-page',
        'appendix',
      ];

      frontBackMatter.forEach((type) => {
        const meta = SECTION_TYPE_META[type];
        expect(meta.includeInWordCount).toBe(false);
        expect(meta.includeInChapterCount).toBe(false);
      });
    });

    it('correctly configures custom section', () => {
      const meta = SECTION_TYPE_META.custom;
      expect(meta.label).toBe('Custom');
      expect(meta.includeInWordCount).toBe(true);
      expect(meta.includeInChapterCount).toBe(false);
    });
  });

  describe('getSectionTypeMeta', () => {
    it('returns correct metadata for chapter', () => {
      const meta = getSectionTypeMeta('chapter');
      expect(meta.type).toBe('chapter');
      expect(meta.label).toBe('Chapter');
      expect(meta.includeInWordCount).toBe(true);
      expect(meta.includeInChapterCount).toBe(true);
    });

    it('returns correct metadata for prologue', () => {
      const meta = getSectionTypeMeta('prologue');
      expect(meta.type).toBe('prologue');
      expect(meta.label).toBe('Prologue');
    });

    it('returns correct metadata for epilogue', () => {
      const meta = getSectionTypeMeta('epilogue');
      expect(meta.type).toBe('epilogue');
      expect(meta.label).toBe('Epilogue');
    });

    it('returns correct metadata for foreword', () => {
      const meta = getSectionTypeMeta('foreword');
      expect(meta.type).toBe('foreword');
      expect(meta.label).toBe('Foreword');
    });

    it('returns correct metadata for afterword', () => {
      const meta = getSectionTypeMeta('afterword');
      expect(meta.type).toBe('afterword');
      expect(meta.label).toBe('Afterword');
    });

    it('returns correct metadata for acknowledgements', () => {
      const meta = getSectionTypeMeta('acknowledgements');
      expect(meta.type).toBe('acknowledgements');
      expect(meta.label).toBe('Acknowledgements');
    });

    it('returns correct metadata for dedication', () => {
      const meta = getSectionTypeMeta('dedication');
      expect(meta.type).toBe('dedication');
      expect(meta.label).toBe('Dedication');
    });

    it('returns correct metadata for title-page', () => {
      const meta = getSectionTypeMeta('title-page');
      expect(meta.type).toBe('title-page');
      expect(meta.label).toBe('Title Page');
    });

    it('returns correct metadata for appendix', () => {
      const meta = getSectionTypeMeta('appendix');
      expect(meta.type).toBe('appendix');
      expect(meta.label).toBe('Appendix');
    });

    it('returns correct metadata for custom', () => {
      const meta = getSectionTypeMeta('custom');
      expect(meta.type).toBe('custom');
      expect(meta.label).toBe('Custom');
    });
  });

  describe('shouldIncludeInWordCount', () => {
    it('returns true for chapter', () => {
      expect(shouldIncludeInWordCount('chapter')).toBe(true);
    });

    it('returns true for prologue', () => {
      expect(shouldIncludeInWordCount('prologue')).toBe(true);
    });

    it('returns true for epilogue', () => {
      expect(shouldIncludeInWordCount('epilogue')).toBe(true);
    });

    it('returns true for custom', () => {
      expect(shouldIncludeInWordCount('custom')).toBe(true);
    });

    it('returns false for foreword', () => {
      expect(shouldIncludeInWordCount('foreword')).toBe(false);
    });

    it('returns false for afterword', () => {
      expect(shouldIncludeInWordCount('afterword')).toBe(false);
    });

    it('returns false for acknowledgements', () => {
      expect(shouldIncludeInWordCount('acknowledgements')).toBe(false);
    });

    it('returns false for dedication', () => {
      expect(shouldIncludeInWordCount('dedication')).toBe(false);
    });

    it('returns false for title-page', () => {
      expect(shouldIncludeInWordCount('title-page')).toBe(false);
    });

    it('returns false for appendix', () => {
      expect(shouldIncludeInWordCount('appendix')).toBe(false);
    });
  });

  describe('shouldIncludeInChapterCount', () => {
    it('returns true only for chapter type', () => {
      expect(shouldIncludeInChapterCount('chapter')).toBe(true);
    });

    it('returns false for prologue', () => {
      expect(shouldIncludeInChapterCount('prologue')).toBe(false);
    });

    it('returns false for epilogue', () => {
      expect(shouldIncludeInChapterCount('epilogue')).toBe(false);
    });

    it('returns false for custom', () => {
      expect(shouldIncludeInChapterCount('custom')).toBe(false);
    });

    it('returns false for foreword', () => {
      expect(shouldIncludeInChapterCount('foreword')).toBe(false);
    });

    it('returns false for afterword', () => {
      expect(shouldIncludeInChapterCount('afterword')).toBe(false);
    });

    it('returns false for acknowledgements', () => {
      expect(shouldIncludeInChapterCount('acknowledgements')).toBe(false);
    });

    it('returns false for dedication', () => {
      expect(shouldIncludeInChapterCount('dedication')).toBe(false);
    });

    it('returns false for title-page', () => {
      expect(shouldIncludeInChapterCount('title-page')).toBe(false);
    });

    it('returns false for appendix', () => {
      expect(shouldIncludeInChapterCount('appendix')).toBe(false);
    });
  });

  describe('Word Count Logic', () => {
    it('includes narrative sections in word count', () => {
      const narrativeSections: SectionType[] = ['chapter', 'prologue', 'epilogue', 'custom'];

      narrativeSections.forEach((type) => {
        expect(shouldIncludeInWordCount(type)).toBe(true);
      });
    });

    it('excludes meta sections from word count', () => {
      const metaSections: SectionType[] = [
        'foreword',
        'afterword',
        'acknowledgements',
        'dedication',
        'title-page',
        'appendix',
      ];

      metaSections.forEach((type) => {
        expect(shouldIncludeInWordCount(type)).toBe(false);
      });
    });
  });

  describe('Chapter Count Logic', () => {
    it('includes only chapters in chapter count', () => {
      const allTypes: SectionType[] = [
        'chapter',
        'prologue',
        'epilogue',
        'foreword',
        'afterword',
        'acknowledgements',
        'dedication',
        'title-page',
        'appendix',
        'custom',
      ];

      allTypes.forEach((type) => {
        const shouldInclude = shouldIncludeInChapterCount(type);
        if (type === 'chapter') {
          expect(shouldInclude).toBe(true);
        } else {
          expect(shouldInclude).toBe(false);
        }
      });
    });
  });
});
