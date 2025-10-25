// Data preparation for Plot Analysis

import type { Project } from '@/context/AppContext';

import type { BookMetrics, ChapterMetrics, PlotAnalysisFilters } from './types';

const MAX_SUMMARY_CHARS = 1200;
const MAX_SUMMARY_TOKENS = 220; // Rough estimate: ~5.5 chars per token
const MAX_CHAPTERS = 30;
const CONFLICT_VERBS = [
  'struggle',
  'lose',
  'risk',
  'discover',
  'chase',
  'fight',
  'escape',
  'confront',
];

/**
 * Truncate text to max chars on sentence boundary
 */
function truncateOnSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclaim = truncated.lastIndexOf('!');

  const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);

  if (lastSentence > maxChars * 0.7) {
    return truncated.slice(0, lastSentence + 1);
  }

  return truncated + '...';
}

/**
 * Redact PII (emails, URLs) from text
 */
function redactPII(text: string): string {
  // Redact emails
  let cleaned = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED]');

  // Redact URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '[REDACTED]');

  return cleaned;
}

/**
 * Extract first N words from chapter content as summary
 */
function extractSummary(content: string, maxWords: number = 200): string {
  if (!content) return '';

  const words = content.trim().split(/\s+/);
  const summary = words.slice(0, maxWords).join(' ');

  return truncateOnSentence(summary, MAX_SUMMARY_CHARS);
}

/**
 * Compute word count for text
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Extract tags from chapter (POV, arc markers, etc.)
 */
function extractTags(chapter: any): string[] {
  const tags: string[] = [];

  // Add POV if present
  if (chapter.pov) {
    tags.push(`pov:${chapter.pov}`);
  }

  // Add status tags
  if (chapter.status) {
    tags.push(chapter.status.toLowerCase());
  }

  // Add arc markers if present
  if (chapter.arcMarker) {
    tags.push(chapter.arcMarker.toLowerCase());
  }

  // Check content for structural markers
  const content = (chapter.content || '').toLowerCase();
  if (content.includes('setup') || content.includes('introduction')) tags.push('setup');
  if (CONFLICT_VERBS.some((verb) => content.includes(verb))) tags.push('conflict');
  if (content.includes('turn') || content.includes('twist')) tags.push('turn');
  if (content.includes('resolution') || content.includes('payoff')) tags.push('payoff');
  if (content.includes('aftermath') || content.includes('epilogue')) tags.push('aftermath');

  return [...new Set(tags)]; // Deduplicate
}

/**
 * Sample chapters evenly if count exceeds limit
 */
function sampleChapters(chapters: any[], maxCount: number): { chapters: any[]; sampled: boolean } {
  if (chapters.length <= maxCount) {
    return { chapters, sampled: false };
  }

  const step = chapters.length / maxCount;
  const sampled = [];

  for (let i = 0; i < maxCount; i++) {
    const index = Math.floor(i * step);
    sampled.push(chapters[index]);
  }

  return { chapters: sampled, sampled: true };
}

/**
 * Prepare chapter metrics from project data
 */
export function prepareChapterMetrics(
  project: Project,
  filters: PlotAnalysisFilters,
): ChapterMetrics[] {
  if (!project.chapters || project.chapters.length === 0) {
    return [];
  }

  let chapters = project.chapters;

  // Apply filters
  if (!filters.includeNotes) {
    chapters = chapters.filter((ch) => ch.status !== 'notes');
  }

  if (!filters.includeDrafts) {
    chapters = chapters.filter((ch) => ch.status !== 'draft');
  }

  if (filters.excludedChapterIds.length > 0) {
    chapters = chapters.filter((ch) => !filters.excludedChapterIds.includes(ch.id));
  }

  // Convert to metrics
  const metrics: ChapterMetrics[] = chapters.map((ch, index) => {
    const content = ch.content || '';
    const summary = extractSummary(content);
    const cleanSummary = redactPII(summary);

    return {
      i: index,
      title: ch.title || `Chapter ${index + 1}`,
      words: countWords(content),
      pov: ch.pov,
      tags: extractTags(ch),
      updatedAt: ch.updatedAt ? new Date(ch.updatedAt).toISOString() : new Date().toISOString(),
      summary: cleanSummary,
    };
  });

  return metrics;
}

/**
 * Prepare book-level metrics for analysis
 */
export function prepareBookMetrics(
  project: Project,
  filters: PlotAnalysisFilters,
): { data: BookMetrics; sampled: boolean } {
  const allMetrics = prepareChapterMetrics(project, filters);
  const { chapters, sampled } = sampleChapters(allMetrics, MAX_CHAPTERS);

  const totalWords = chapters.reduce((sum, ch) => sum + ch.words, 0);

  return {
    data: {
      chapters,
      totalWords,
      targets: {
        midpointPct: [0.45, 0.55],
        incitingPctMax: 0.2,
        climaxPct: [0.8, 0.95],
      },
    },
    sampled,
  };
}

/**
 * Compute project hash for cache invalidation
 */
export function computeProjectHash(project: Project): string {
  const content = project.chapters?.map((ch) => `${ch.id}:${ch.updatedAt}`).join('|') || '';

  // Simple hash (not cryptographic, just for cache busting)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}
