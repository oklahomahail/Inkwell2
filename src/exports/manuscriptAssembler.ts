// manuscriptAssembler.ts - Deterministic build from project state → ManuscriptDraft

import { ManuscriptDraft, ManuscriptChapter } from './exportTypes';

// Mock project interfaces - these would be imported from your actual state management
interface Project {
  id: string;
  name: string;
  description?: string;
  content?: string;
  chapters?: Chapter[];
  metadata?: Record<string, any>;
  author?: string;
  frontMatter?: {
    dedication?: string;
    acknowledgements?: string;
    epigraph?: string;
  };
  backMatter?: {
    aboutAuthor?: string;
    notes?: string;
  };
}

interface Chapter {
  id: string;
  title?: string;
  order: number;
  scenes?: Scene[];
  content?: string;
}

interface Scene {
  id: string;
  content: string;
  order: number;
}

/**
 * Normalizes rich text content for export by:
 * - Stripping editor artifacts (contenteditable attrs, data-* attrs)
 * - Converting smart quotes and proper ellipses
 * - Cleaning up HTML structure
 * - Preserving intentional formatting
 */
export function normalizeRichText(content: string): string {
  if (!content) return '';

  let normalized = content
    // Remove editor artifacts
    .replace(/\scontenteditable="[^"]*"/g, '')
    .replace(/\sdata-[^=]*="[^"]*"/g, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sstyle="[^"]*"/g, '')
    
    // Convert smart quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    
    // Convert ellipses
    .replace(/\.\.\./g, '…')
    
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();

  // Convert basic HTML to clean structure
  normalized = normalized
    .replace(/<p[^>]*>/g, '<p>')
    .replace(/<div[^>]*>/g, '<p>')
    .replace(/<\/div>/g, '</p>')
    .replace(/<br[^>]*>/g, '<br>');

  return normalized;
}

/**
 * Estimates page count based on word count
 * Uses standard manuscript formatting assumptions:
 * - ~250 words per page for double-spaced manuscript
 * - ~350 words per page for book formatting
 */
export function estimatePageCount(wordCount: number, format: 'manuscript' | 'book' = 'manuscript'): number {
  const wordsPerPage = format === 'manuscript' ? 250 : 350;
  return Math.ceil(wordCount / wordsPerPage);
}

/**
 * Counts words in text content, handling HTML
 */
export function countWords(content: string): number {
  if (!content) return 0;
  
  // Strip HTML tags and count words
  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!plainText) return 0;
  
  return plainText.split(' ').length;
}

/**
 * Retrieves project data - mock implementation
 * In real implementation, this would use your state selectors
 */
async function getProjectData(projectId: string): Promise<Project> {
  // Mock implementation - replace with actual data fetching
  // const project = selectProject(projectId);
  // if (!project) throw new Error(`Project ${projectId} not found`);
  
  return {
    id: projectId,
    name: 'Sample Project',
    description: 'A sample project for testing exports',
    author: 'Sample Author',
    chapters: [
      {
        id: 'ch1',
        title: 'Chapter 1: The Beginning',
        order: 1,
        scenes: [
          {
            id: 'sc1',
            content: '<p>This is the opening scene with <em>some italic text</em> and <strong>bold text</strong>.</p><p>Here is another paragraph with more content to test word counting and formatting.</p>',
            order: 1
          }
        ]
      },
      {
        id: 'ch2',
        title: 'Chapter 2: The Development',
        order: 2,
        scenes: [
          {
            id: 'sc2',
            content: '<p>This is the second chapter with additional content...</p>',
            order: 1
          }
        ]
      }
    ],
    frontMatter: {
      dedication: 'For my readers',
      acknowledgements: 'Thanks to everyone who supported this work'
    },
    backMatter: {
      aboutAuthor: 'Sample Author is a writer who writes things.'
    },
    metadata: {
      genre: 'Fiction',
      keywords: 'sample, test, export'
    }
  };
}

/**
 * Assembles a complete manuscript draft from project data
 */
export async function assembleManuscript(projectId: string): Promise<ManuscriptDraft> {
  const project = await getProjectData(projectId);
  
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Sort chapters by order and compile scenes
  const sortedChapters = (project.chapters || [])
    .sort((a, b) => a.order - b.order);

  const chapters: ManuscriptChapter[] = sortedChapters.map((chapter, index) => {
    // Sort scenes by order and normalize content
    const sortedScenes = (chapter.scenes || [])
      .sort((a, b) => a.order - b.order)
      .map(scene => normalizeRichText(scene.content));

    // If chapter has direct content (no scenes), use that
    if (!sortedScenes.length && chapter.content) {
      sortedScenes.push(normalizeRichText(chapter.content));
    }

    return {
      number: index + 1,
      title: chapter.title,
      scenes: sortedScenes
    };
  });

  // Calculate total word count
  let totalWordCount = 0;
  chapters.forEach(chapter => {
    chapter.scenes.forEach(scene => {
      totalWordCount += countWords(scene);
    });
  });

  // Add front/back matter to word count
  if (project.frontMatter?.dedication) {
    totalWordCount += countWords(project.frontMatter.dedication);
  }
  if (project.frontMatter?.acknowledgements) {
    totalWordCount += countWords(project.frontMatter.acknowledgements);
  }
  if (project.frontMatter?.epigraph) {
    totalWordCount += countWords(project.frontMatter.epigraph);
  }
  if (project.backMatter?.aboutAuthor) {
    totalWordCount += countWords(project.backMatter.aboutAuthor);
  }
  if (project.backMatter?.notes) {
    totalWordCount += countWords(project.backMatter.notes);
  }

  const estimatedPages = estimatePageCount(totalWordCount);

  return {
    title: project.name || 'Untitled',
    author: project.author,
    projectId,
    chapters,
    frontMatter: project.frontMatter,
    backMatter: project.backMatter,
    metadata: project.metadata || {},
    wordCount: totalWordCount,
    estimatedPages
  };
}

/**
 * Validates a manuscript draft for export readiness
 */
export function validateManuscriptForExport(draft: ManuscriptDraft): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required validations
  if (!draft.title || draft.title.trim() === '') {
    errors.push('Manuscript must have a title');
  }

  if (!draft.chapters || draft.chapters.length === 0) {
    errors.push('Manuscript must have at least one chapter');
  }

  if (draft.wordCount < 100) {
    errors.push('Manuscript must have at least 100 words');
  }

  // Warning validations
  if (!draft.author) {
    warnings.push('Author name is not specified');
  }

  if (draft.wordCount < 1000) {
    warnings.push('Manuscript is quite short (less than 1000 words)');
  }

  const chaptersWithoutTitles = draft.chapters.filter(ch => !ch.title || ch.title.trim() === '');
  if (chaptersWithoutTitles.length > 0) {
    warnings.push(`${chaptersWithoutTitles.length} chapters are missing titles`);
  }

  const emptyChapters = draft.chapters.filter(ch => 
    !ch.scenes || ch.scenes.length === 0 || ch.scenes.every(scene => !scene || scene.trim() === '')
  );
  if (emptyChapters.length > 0) {
    warnings.push(`${emptyChapters.length} chapters are empty`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets a summary of the manuscript for display
 */
export function getManuscriptSummary(draft: ManuscriptDraft) {
  const validation = validateManuscriptForExport(draft);
  
  return {
    title: draft.title,
    author: draft.author || 'Unknown Author',
    chapterCount: draft.chapters.length,
    sceneCount: draft.chapters.reduce((total, ch) => total + (ch.scenes?.length || 0), 0),
    wordCount: draft.wordCount,
    estimatedPages: draft.estimatedPages,
    estimatedReadingTime: Math.ceil(draft.wordCount / 200), // minutes at ~200 wpm
    hasValidation: validation,
    hasFrontMatter: !!(draft.frontMatter && (
      draft.frontMatter.dedication || 
      draft.frontMatter.acknowledgements || 
      draft.frontMatter.epigraph
    )),
    hasBackMatter: !!(draft.backMatter && (
      draft.backMatter.aboutAuthor || 
      draft.backMatter.notes
    ))
  };
}