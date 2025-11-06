// src/types/section.ts

/**
 * Section types supported by Inkwell
 * Extends beyond simple "chapters" to support full manuscript structure
 */
export type SectionType =
  | 'chapter'
  | 'prologue'
  | 'epilogue'
  | 'foreword'
  | 'afterword'
  | 'acknowledgements'
  | 'dedication'
  | 'title-page'
  | 'appendix'
  | 'custom';

/**
 * A section represents any structural unit in a manuscript
 * Can be a chapter, prologue, acknowledgements, etc.
 */
export interface Section {
  id: string;
  title: string;
  type: SectionType;
  order: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  wordCount?: number;
}

/**
 * Section type metadata for UI display
 */
export interface SectionTypeMeta {
  type: SectionType;
  label: string;
  description: string;
  includeInWordCount: boolean;
  includeInChapterCount: boolean;
}

/**
 * Metadata for each section type
 */
export const SECTION_TYPE_META: Record<SectionType, SectionTypeMeta> = {
  chapter: {
    type: 'chapter',
    label: 'Chapter',
    description: 'Main narrative chapter',
    includeInWordCount: true,
    includeInChapterCount: true,
  },
  prologue: {
    type: 'prologue',
    label: 'Prologue',
    description: 'Opening scene before the main story',
    includeInWordCount: true,
    includeInChapterCount: false,
  },
  epilogue: {
    type: 'epilogue',
    label: 'Epilogue',
    description: 'Closing scene after the main story',
    includeInWordCount: true,
    includeInChapterCount: false,
  },
  foreword: {
    type: 'foreword',
    label: 'Foreword',
    description: 'Introduction by another author',
    includeInWordCount: false,
    includeInChapterCount: false,
  },
  afterword: {
    type: 'afterword',
    label: 'Afterword',
    description: "Author's notes after the story",
    includeInWordCount: false,
    includeInChapterCount: false,
  },
  acknowledgements: {
    type: 'acknowledgements',
    label: 'Acknowledgements',
    description: 'Thank you notes',
    includeInWordCount: false,
    includeInChapterCount: false,
  },
  dedication: {
    type: 'dedication',
    label: 'Dedication',
    description: 'Dedication to someone',
    includeInWordCount: false,
    includeInChapterCount: false,
  },
  'title-page': {
    type: 'title-page',
    label: 'Title Page',
    description: 'Book title and author info',
    includeInWordCount: false,
    includeInChapterCount: false,
  },
  appendix: {
    type: 'appendix',
    label: 'Appendix',
    description: 'Supplementary material',
    includeInWordCount: false,
    includeInChapterCount: false,
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    description: 'Custom section type',
    includeInWordCount: true,
    includeInChapterCount: false,
  },
};

/**
 * Helper function to get section type metadata
 */
export function getSectionTypeMeta(type: SectionType): SectionTypeMeta {
  return SECTION_TYPE_META[type];
}

/**
 * Helper function to determine if a section should be included in word count
 */
export function shouldIncludeInWordCount(type: SectionType): boolean {
  return SECTION_TYPE_META[type].includeInWordCount;
}

/**
 * Helper function to determine if a section should be counted as a chapter
 */
export function shouldIncludeInChapterCount(type: SectionType): boolean {
  return SECTION_TYPE_META[type].includeInChapterCount;
}
