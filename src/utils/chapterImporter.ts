/**
 * Chapter Importer
 *
 * Split a single manuscript string into titled chapter chunks.
 * Detects headings like "Prologue", "Epilogue", "Chapter 1", "# Chapter Title", "## Title".
 */

export type ImportedChapter = { title: string; content: string };

const HEADING_RE = new RegExp(
  [
    // Markdown headings
    '^\\s{0,3}#{1,2}\\s+(.+)$',
    // Prologue/Epilogue
    '^(prologue|epilogue)\\b[\\s—-]*([^\\n]*)$',
    // Chapter N (with optional title)
    '^chapter\\s+(\\d+)(?:[\\s:—-]+(.+))?$',
  ].join('|'),
  'i',
);

export function splitDocumentIntoChapters(fullText: string): ImportedChapter[] {
  const lines = fullText.replace(/\r\n/g, '\n').split('\n');
  const chunks: { title: string; lines: string[] }[] = [];

  let currentTitle = 'Chapter 1';
  let current: string[] = [];
  let foundAny = false;

  const push = () => {
    chunks.push({ title: currentTitle.trim() || 'Untitled', lines: [...current] });
    current = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const m = line.match(HEADING_RE);
    if (m) {
      // If we already started collecting, flush the previous chapter
      if (current.length || foundAny) push();
      foundAny = true;

      // Try to resolve a reasonable title from matched groups
      // Groups:
      // 1: markdown heading text
      // 2/3: "Prologue|Epilogue" + optional subtitle
      // 4/5: "Chapter N" + optional subtitle
      const mdTitle = (m[1] ?? '').trim();
      const named = (m[2] ?? '').trim();
      const namedTail = (m[3] ?? '').trim();
      const chapNum = (m[4] ?? '').trim();
      const chapTitle = (m[5] ?? '').trim();

      if (mdTitle) {
        currentTitle = normalizeTitle(mdTitle);
      } else if (named) {
        currentTitle = normalizeTitle([capitalize(named), namedTail].filter(Boolean).join(': '));
      } else if (chapNum) {
        currentTitle = normalizeTitle(['Chapter ' + chapNum, chapTitle].filter(Boolean).join(': '));
      } else {
        currentTitle = 'Chapter ' + (chunks.length + 1);
      }
      continue; // don't include heading line in content
    }
    current.push(line);
  }
  // Flush last chunk
  if (current.length || foundAny) push();

  // If we never found headings, return one chapter with the whole text
  if (!chunks.length) {
    return [{ title: 'Chapter 1', content: fullText.trim() }];
  }

  // Clean up chapter content blocks
  return chunks.map((c) => ({
    title: c.title,
    content: trimBlankLines(c.lines).join('\n'),
  }));
}

function trimBlankLines(lines: string[]): string[] {
  let a = 0,
    b = lines.length - 1;
  while (a <= b) {
    const line = lines[a];
    if (line !== undefined && !line.trim()) {
      a++;
    } else {
      break;
    }
  }
  while (b >= a) {
    const line = lines[b];
    if (line !== undefined && !line.trim()) {
      b--;
    } else {
      break;
    }
  }
  return lines.slice(a, b + 1);
}

function normalizeTitle(s: string) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+—\s+/g, ' — ')
    .trim();
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
