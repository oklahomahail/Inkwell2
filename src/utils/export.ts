// Export utilities for Inkwell
// Handles Markdown, TXT, and other export formats

import { format } from 'date-fns';

import { Chapter, ExportOptions, ExportFormat } from '../domain/types';

// Encoder map for different formats
type ExportEncoder = (data: unknown) => string;
const encoders: Record<string, ExportEncoder> = {
  json: (x) => JSON.stringify(x, null, 2),
  yaml: (x) => {
    // Simple YAML stringifier for metadata
    if (typeof x === 'object' && x !== null) {
      return Object.entries(x as Record<string, unknown>)
        .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
        .join('\n');
    }
    return String(x);
  },
  toml: (x) => {
    // Simple TOML stringifier for metadata
    if (typeof x === 'object' && x !== null) {
      return Object.entries(x as Record<string, unknown>)
        .map(([key, value]) => `${key} = ${typeof value === 'string' ? `"${value}"` : value}`)
        .join('\n');
    }
    return String(x);
  },
};

export function encodeData(data: unknown, format: 'json' | 'yaml' | 'toml'): string {
  const encoder = encoders[format];
  if (!encoder) {
    throw new Error(`Unknown format: ${format}`);
  }
  return encoder(data);
}

/* ========= Types ========= */
export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface MarkdownExportOptions {
  includeMetadata: boolean;
  includeTOC: boolean;
  chapterNumbers: boolean;
  sceneBreaks: boolean;
  frontMatter: 'yaml' | 'toml' | 'json' | 'none';
}

/* ========= Markdown Export ========= */

/**
 * Export chapters to Markdown format
 */
export async function exportToMarkdown(
  chapters: Chapter[],
  options: Partial<MarkdownExportOptions> = {},
): Promise<ExportResult> {
  const settings = {
    includeMetadata: true,
    includeTOC: true,
    chapterNumbers: true,
    sceneBreaks: true,
    frontMatter: 'yaml' as const,
    ...options,
  };

  let markdown = '';
  const totalWordCount = chapters.reduce((total, ch) => total + ch.totalWordCount, 0);
  const lastUpdated = chapters.reduce(
    (latest, ch) => (ch.updatedAt > latest ? ch.updatedAt : latest),
    new Date(0),
  );

  // Add front matter if enabled
  if (settings.frontMatter !== 'none' && settings.includeMetadata) {
    markdown += generateFrontMatter(chapters, settings.frontMatter);
    markdown += '\n\n';
  }

  // Add title
  markdown += '# Your Story\n\n';

  // Add metadata section
  if (settings.includeMetadata) {
    markdown += '## Manuscript Information\n\n';
    markdown += `- **Chapters**: ${chapters.length}\n`;
    markdown += `- **Total Scenes**: ${chapters.reduce((total, ch) => total + ch.scenes.length, 0)}\n`;
    markdown += `- **Word Count**: ${totalWordCount.toLocaleString()}\n`;
    markdown += `- **Last Updated**: ${format(lastUpdated, "MMMM d, yyyy 'at' h:mm a")}\n\n`;
  }

  // Add table of contents if enabled
  if (settings.includeTOC) {
    markdown += generateTableOfContents(chapters, settings.chapterNumbers);
    markdown += '\n---\n\n';
  }

  // Add chapters
  chapters.forEach((chapter, chapterIndex) => {
    // Chapter header
    if (settings.chapterNumbers) {
      markdown += `## Chapter ${chapterIndex + 1}: ${chapter.title}\n\n`;
    } else {
      markdown += `## ${chapter.title}\n\n`;
    }

    // Chapter metadata
    if (settings.includeMetadata) {
      markdown += `*Word count: ${chapter.totalWordCount.toLocaleString()} • `;
      markdown += `Scenes: ${chapter.scenes.length} • `;
      markdown += `Status: ${chapter.status}*\n\n`;
    }

    // Scenes
    chapter.scenes.forEach((scene, sceneIndex) => {
      // Scene header (if multiple scenes in chapter)
      if (chapter.scenes.length > 1) {
        markdown += `### ${scene.title}\n\n`;
      }

      // Scene content
      markdown += scene.content || '*[No content yet]*';
      markdown += '\n\n';

      // Scene break
      if (settings.sceneBreaks && sceneIndex < chapter.scenes.length - 1) {
        markdown += '* * *\n\n';
      }
    });

    // Chapter break
    if (chapterIndex < chapters.length - 1) {
      markdown += '\n---\n\n';
    }
  });

  const filename = `manuscript-${format(new Date(), 'yyyy-MM-dd')}.md`;

  return {
    content: markdown,
    filename,
    mimeType: 'text/markdown',
    size: new Blob([markdown]).size,
  };
}

/**
 * Generate front matter for the document
 */
function generateFrontMatter(chapters: Chapter[], formatType: 'yaml' | 'toml' | 'json'): string {
  const metadata = {
    title: 'Your Story',
    author: 'Author Name',
    created: format(new Date(), 'yyyy-MM-dd'),
    wordCount: chapters.reduce((total, ch) => total + ch.totalWordCount, 0),
    chapters: chapters.length,
    scenes: chapters.reduce((total, ch) => total + ch.scenes.length, 0),
    status: 'draft',
    generator: 'Inkwell',
  };

  switch (formatType) {
    case 'yaml':
      return `---\n${Object.entries(metadata)
        .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
        .join('\n')}\n---`;

    case 'toml':
      return `+++\n${Object.entries(metadata)
        .map(([key, value]) => `${key} = ${typeof value === 'string' ? `"${value}"` : value}`)
        .join('\n')}\n+++`;

    case 'json':
      return `\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``;

    default:
      return '';
  }
}

/**
 * Generate table of contents
 */
function generateTableOfContents(chapters: Chapter[], useNumbers: boolean): string {
  let toc = '## Table of Contents\n\n';

  chapters.forEach((chapter, index) => {
    const chapterTitle = useNumbers ? `Chapter ${index + 1}: ${chapter.title}` : chapter.title;

    // Convert title to anchor link
    const anchor = chapter.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    toc += `${index + 1}. [${chapterTitle}](#${useNumbers ? `chapter-${index + 1}-` : ''}${anchor})\n`;
  });

  return toc;
}

/* ========= TXT Export ========= */

/**
 * Export chapters to plain text format
 */
export async function exportToTXT(
  chapters: Chapter[],
  options: { includeMetadata?: boolean } = {},
): Promise<ExportResult> {
  let content = '';

  if (options.includeMetadata) {
    const totalWordCount = chapters.reduce((total, ch) => total + ch.totalWordCount, 0);
    const lastUpdated = chapters.reduce(
      (latest, ch) => (ch.updatedAt > latest ? ch.updatedAt : latest),
      new Date(0),
    );

    content += 'YOUR STORY\n';
    content += '='.repeat(50) + '\n\n';
    content += `Chapters: ${chapters.length}\n`;
    content += `Total Word Count: ${totalWordCount.toLocaleString()}\n`;
    content += `Last Updated: ${format(lastUpdated, "MMMM d, yyyy 'at' h:mm a")}\n\n`;
    content += '='.repeat(50) + '\n\n';
  }

  chapters.forEach((chapter, chapterIndex) => {
    // Chapter header
    content += `CHAPTER ${chapterIndex + 1}: ${chapter.title.toUpperCase()}\n`;
    content += '-'.repeat(Math.max(chapter.title.length + 15, 30)) + '\n\n';

    // Scenes
    chapter.scenes.forEach((scene, sceneIndex) => {
      if (chapter.scenes.length > 1) {
        content += `${scene.title}\n\n`;
      }

      content += scene.content || '[No content yet]';
      content += '\n\n';

      // Scene break
      if (sceneIndex < chapter.scenes.length - 1) {
        content += '* * *\n\n';
      }
    });

    // Chapter break
    if (chapterIndex < chapters.length - 1) {
      content += '\n' + '='.repeat(50) + '\n\n';
    }
  });

  const filename = `manuscript-${format(new Date(), 'yyyy-MM-dd')}.txt`;

  return {
    content,
    filename,
    mimeType: 'text/plain',
    size: new Blob([content]).size,
  };
}

/* ========= Export Orchestration ========= */

/**
 * Export chapters based on format and options
 */
export async function exportChapters(
  chapters: Chapter[],
  format: ExportFormat,
  options: ExportOptions,
): Promise<ExportResult> {
  // Filter chapters if needed
  let chaptersToExport = chapters;

  if (options.dateRange) {
    chaptersToExport = chapters.filter((chapter) => {
      const updatedAt = new Date(chapter.updatedAt);
      return updatedAt >= options.dateRange!.from && updatedAt <= options.dateRange!.to;
    });
  }

  switch (format) {
    case ExportFormat.MARKDOWN:
      return exportToMarkdown(chaptersToExport, {
        includeMetadata: options.includeMetadata,
        includeTOC: true,
        chapterNumbers: true,
        sceneBreaks: true,
        frontMatter: options.includeMetadata ? 'yaml' : 'none',
      });

    case ExportFormat.TXT:
      return exportToTXT(chaptersToExport, {
        includeMetadata: options.includeMetadata,
      });

    case ExportFormat.HTML:
      return exportToHTML(chaptersToExport, options);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/* ========= HTML Export (Basic) ========= */

/**
 * Export chapters to HTML format
 */
export async function exportToHTML(
  chapters: Chapter[],
  options: ExportOptions,
): Promise<ExportResult> {
  const totalWordCount = chapters.reduce((total, ch) => total + ch.totalWordCount, 0);
  const lastUpdated = chapters.reduce(
    (latest, ch) => (ch.updatedAt > latest ? ch.updatedAt : latest),
    new Date(0),
  );

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Story</title>
    <style>
        body { 
            font-family: Georgia, serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 2rem;
            color: #333;
        }
        h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
        h2 { margin-top: 2rem; color: #555; }
        .metadata { 
            background: #f5f5f5; 
            padding: 1rem; 
            border-left: 4px solid #007acc; 
            margin: 1rem 0;
        }
        .scene-break { 
            text-align: center; 
            margin: 2rem 0; 
            font-size: 1.5rem;
        }
        .chapter-break { 
            border-bottom: 1px solid #ddd; 
            margin: 3rem 0 2rem;
        }
        @media print {
            body { font-size: 12pt; }
        }
    </style>
</head>
<body>
    <h1>Your Story</h1>`;

  if (options.includeMetadata) {
    html += `
    <div class="metadata">
        <strong>Manuscript Information:</strong><br>
        Chapters: ${chapters.length}<br>
        Total Scenes: ${chapters.reduce((total, ch) => total + ch.scenes.length, 0)}<br>
        Word Count: ${totalWordCount.toLocaleString()}<br>
        Last Updated: ${format(lastUpdated, "MMMM d, yyyy 'at' h:mm a")}
    </div>`;
  }

  chapters.forEach((chapter, chapterIndex) => {
    html += `<h2>Chapter ${chapterIndex + 1}: ${escapeHtml(chapter.title)}</h2>\n`;

    if (options.includeMetadata) {
      html += `<p><em>Word count: ${chapter.totalWordCount.toLocaleString()} • Scenes: ${chapter.scenes.length}</em></p>\n`;
    }

    chapter.scenes.forEach((scene, sceneIndex) => {
      if (chapter.scenes.length > 1) {
        html += `<h3>${escapeHtml(scene.title)}</h3>\n`;
      }

      const content = scene.content || '<em>[No content yet]</em>';
      // Convert basic markdown-like formatting
      const formattedContent = content
        .replace(/\n\s*\n/g, '</p>\n<p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      html += `<p>${formattedContent}</p>\n`;

      if (sceneIndex < chapter.scenes.length - 1) {
        html += '<div class="scene-break">* * *</div>\n';
      }
    });

    if (chapterIndex < chapters.length - 1) {
      html += '<div class="chapter-break"></div>\n';
    }
  });

  html += '</body>\n</html>';

  const filename = `manuscript-${format(new Date(), 'yyyy-MM-dd')}.html`;

  return {
    content: html,
    filename,
    mimeType: 'text/html',
    size: new Blob([html]).size,
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ========= Download Utilities ========= */

/**
 * Download export result as file
 */
export function downloadExportResult(result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Create export blob for further processing
 */
export function createExportBlob(result: ExportResult): Blob {
  return new Blob([result.content], { type: result.mimeType });
}
