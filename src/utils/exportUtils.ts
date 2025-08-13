// src/utils/exportUtils.ts - NEW FILE
import { Scene, Chapter } from '@/types/writing';

export type ExportFormat = 'markdown' | 'txt' | 'docx' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeWordCounts: boolean;
  separateScenes: boolean;
}

// Strip HTML tags for plain text formats
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Convert HTML to Markdown (basic conversion)
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .replace(/\n\n+/g, '\n\n') // Clean up multiple newlines
    .trim();
}

// Format scene metadata
function formatSceneMetadata(scene: Scene, includeWordCounts: boolean): string {
  const metadata: string[] = [];

  if (includeWordCounts) {
    metadata.push(`Words: ${scene.wordCount}`);
    if (scene.wordCountGoal) {
      const progress = Math.round((scene.wordCount / scene.wordCountGoal) * 100);
      metadata.push(`Goal: ${scene.wordCountGoal} (${progress}%)`);
    }
  }

  metadata.push(`Status: ${scene.status}`);
  metadata.push(`Updated: ${scene.updatedAt.toLocaleDateString()}`);

  if (scene.summary) {
    metadata.push(`Summary: ${scene.summary}`);
  }

  return metadata.join(' • ');
}

// Export single scene
export function exportScene(
  scene: Scene,
  options: ExportOptions,
): { content: string; filename: string } {
  const { format, includeMetadata, includeWordCounts } = options;
  let content = '';
  let filename = `${scene.title || 'Untitled Scene'}`;

  // Add metadata header if requested
  if (includeMetadata) {
    const metadata = formatSceneMetadata(scene, includeWordCounts);

    switch (format) {
      case 'markdown':
        content += `<!-- ${metadata} -->\n\n`;
        break;
      case 'html':
        content += `<!-- ${metadata} -->\n\n`;
        break;
      default:
        content += `[${metadata}]\n\n`;
    }
  }

  // Add title and content based on format
  switch (format) {
    case 'markdown':
      content += `# ${scene.title}\n\n`;
      content += htmlToMarkdown(scene.content);
      filename += '.md';
      break;

    case 'html':
      content += `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${scene.title}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
    <h1>${scene.title}</h1>
    ${scene.content}
</body>
</html>`;
      filename += '.html';
      break;

    case 'txt':
      content += `${scene.title}\n${'='.repeat(scene.title.length)}\n\n`;
      content += stripHtml(scene.content);
      filename += '.txt';
      break;

    case 'docx':
      // For now, export as rich text that can be opened in Word
      content += `${scene.title}\n${'='.repeat(scene.title.length)}\n\n`;
      content += stripHtml(scene.content);
      filename += '.rtf';
      break;
  }

  return { content, filename };
}

// Export full chapter
export function exportChapter(
  chapter: Chapter,
  options: ExportOptions,
): { content: string; filename: string } {
  const { format, includeMetadata, includeWordCounts, separateScenes } = options;
  let content = '';
  let filename = `${chapter.title || 'Untitled Chapter'}`;

  // Chapter header
  if (includeMetadata) {
    const chapterMeta = [
      `Total Words: ${chapter.totalWordCount}`,
      `Scenes: ${chapter.scenes.length}`,
      `Updated: ${chapter.updatedAt.toLocaleDateString()}`,
    ].join(' • ');

    switch (format) {
      case 'markdown':
        content += `<!-- Chapter: ${chapterMeta} -->\n\n`;
        break;
      case 'html':
        content += `<!-- Chapter: ${chapterMeta} -->\n\n`;
        break;
      default:
        content += `[Chapter: ${chapterMeta}]\n\n`;
    }
  }

  // Chapter title
  switch (format) {
    case 'markdown':
      content += `# ${chapter.title}\n\n`;
      break;
    case 'html':
      content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${chapter.title}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 2em; }
        p { margin-bottom: 1em; }
        .scene-break { border-top: 1px solid #ddd; margin: 2em 0; padding-top: 2em; }
    </style>
</head>
<body>
    <h1>${chapter.title}</h1>
`;
      break;
    case 'txt':
      content += `${chapter.title}\n${'='.repeat(chapter.title.length)}\n\n`;
      break;
    case 'docx':
      content += `${chapter.title}\n${'='.repeat(chapter.title.length)}\n\n`;
      break;
  }

  // Add scenes
  chapter.scenes.forEach((scene, index) => {
    if (separateScenes && index > 0) {
      switch (format) {
        case 'markdown':
          content += '\n---\n\n';
          break;
        case 'html':
          content += '<div class="scene-break"></div>\n';
          break;
        default:
          content += '\n' + '* * *'.repeat(3) + '\n\n';
      }
    }

    // Scene metadata
    if (includeMetadata) {
      const metadata = formatSceneMetadata(scene, includeWordCounts);
      switch (format) {
        case 'markdown':
          content += `<!-- Scene: ${metadata} -->\n\n`;
          break;
        case 'html':
          content += `<!-- Scene: ${metadata} -->\n`;
          break;
        default:
          content += `[Scene: ${metadata}]\n\n`;
      }
    }

    // Scene content
    switch (format) {
      case 'markdown':
        content += `## ${scene.title}\n\n`;
        content += htmlToMarkdown(scene.content) + '\n\n';
        break;
      case 'html':
        content += `<h2>${scene.title}</h2>\n`;
        content += scene.content + '\n';
        break;
      default:
        content += `${scene.title}\n${'-'.repeat(scene.title.length)}\n\n`;
        content += stripHtml(scene.content) + '\n\n';
    }
  });

  // Close HTML
  if (format === 'html') {
    content += '</body>\n</html>';
  }

  // Set filename extension
  switch (format) {
    case 'markdown':
      filename += '.md';
      break;
    case 'html':
      filename += '.html';
      break;
    case 'txt':
      filename += '.txt';
      break;
    case 'docx':
      filename += '.rtf';
      break;
  }

  return { content, filename };
}

// Download file
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain',
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Main export function
export function performExport(
  type: 'scene' | 'chapter',
  data: Scene | Chapter,
  options: ExportOptions,
): void {
  try {
    let result: { content: string; filename: string };

    if (type === 'scene') {
      result = exportScene(data as Scene, options);
    } else {
      result = exportChapter(data as Chapter, options);
    }

    // Determine MIME type
    let mimeType = 'text/plain';
    switch (options.format) {
      case 'markdown':
        mimeType = 'text/markdown';
        break;
      case 'html':
        mimeType = 'text/html';
        break;
      case 'docx':
        mimeType = 'application/rtf';
        break;
    }

    downloadFile(result.content, result.filename, mimeType);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Export failed. Please try again.');
  }
}
