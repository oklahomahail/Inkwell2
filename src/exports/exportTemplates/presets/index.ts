// presets/index.ts - Style preset loader and utilities

import { StylePresetMeta, TemplateContext } from '../../exportTypes';

// Import preset JSON files
import classicManuscript from './classicManuscript.json';
import modernBook from './modernBook.json';
import screenplay from './screenplay.json';

// Available presets
const presets: Record<string, StylePresetMeta> = {
  'classic-manuscript': classicManuscript as StylePresetMeta,
  'modern-book': modernBook as StylePresetMeta,
  'screenplay': screenplay as StylePresetMeta,
};

/**
 * Gets all available style presets
 */
export function getAllStylePresets(): StylePresetMeta[] {
  return Object.values(presets);
}

/**
 * Gets a specific style preset by ID
 */
export async function getStylePreset(id: string): Promise<StylePresetMeta | null> {
  return presets[id] || null;
}

/**
 * Gets presets suitable for a specific format
 */
export function getPresetsForFormat(format: 'PDF' | 'DOCX' | 'EPUB'): StylePresetMeta[] {
  const allPresets = getAllStylePresets();
  
  switch (format) {
    case 'PDF':
      // All presets work with PDF
      return allPresets;
    case 'DOCX':
      // DOCX works well with most presets
      return allPresets.filter(p => p.id !== 'screenplay');
    case 'EPUB':
      // EPUB prefers simpler styling
      return allPresets.filter(p => ['modern-book', 'classic-manuscript'].includes(p.id));
    default:
      return allPresets;
  }
}

/**
 * Replaces template variables in a string
 */
export function replaceTemplateVariables(template: string, context: TemplateContext): string {
  if (!template) return '';
  
  return template
    .replace(/\{title\}/g, context.title || '')
    .replace(/\{author\}/g, context.author || '')
    .replace(/\{chapterTitle\}/g, context.chapterTitle || '')
    .replace(/\{chapterNumber\}/g, context.chapterNumber?.toString() || '')
    .replace(/\{page\}/g, context.page?.toString() || '')
    .replace(/\{totalPages\}/g, context.totalPages?.toString() || '')
    .replace(/\{date\}/g, context.date || new Date().toLocaleDateString())
    .replace(/\{projectName\}/g, context.projectName || '');
}

/**
 * Generates CSS from a style preset
 */
export function generateCSS(preset: StylePresetMeta): string {
  const marginTop = `${preset.marginsIn.top}in`;
  const marginRight = `${preset.marginsIn.right}in`;
  const marginBottom = `${preset.marginsIn.bottom}in`;
  const marginLeft = `${preset.marginsIn.left}in`;

  return `
@page {
  margin: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft};
  size: 8.5in 11in;
}

@page :first {
  margin-top: ${preset.marginsIn.top + 0.5}in;
}

body {
  font-family: '${preset.baseFont}', serif;
  font-size: ${preset.fontSizePt}pt;
  line-height: ${preset.lineSpacing};
  color: #000;
  background: #fff;
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: '${preset.baseFont}', serif;
  font-weight: normal;
  margin: 0 0 1em 0;
  page-break-after: avoid;
}

h1.chapter-title {
  font-size: ${preset.fontSizePt + 2}pt;
  text-align: center;
  margin-bottom: 2em;
  ${preset.chapterPageBreak ? 'page-break-before: always;' : ''}
}

p {
  margin: 0 0 1em 0;
  text-indent: 0.5in;
  orphans: 2;
  widows: 2;
}

p.first-paragraph,
p.after-scene-break {
  text-indent: 0;
}

.scene-break {
  text-align: center;
  margin: 2em 0;
  font-size: ${preset.fontSizePt}pt;
  page-break-inside: avoid;
}

.front-matter,
.back-matter {
  ${preset.chapterPageBreak ? 'page-break-before: always;' : ''}
  page-break-after: always;
}

.front-matter h2,
.back-matter h2 {
  text-align: center;
  margin-bottom: 2em;
}

/* Headers and footers would be handled by the rendering engine */
.header {
  font-family: '${preset.baseFont}', serif;
  font-size: ${preset.fontSizePt - 1}pt;
}

.footer {
  font-family: '${preset.baseFont}', serif;
  font-size: ${preset.fontSizePt - 1}pt;
}

/* Watermark styles */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: ${preset.watermark?.opacity || 0.05};
  z-index: -1;
  pointer-events: none;
}

/* Print optimizations */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  body {
    background: white !important;
  }
}
`.trim();
}

/**
 * Generates HTML template for a manuscript
 */
export function generateHTMLTemplate(preset: StylePresetMeta): string {
  const css = generateCSS(preset);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
${css}
  </style>
</head>
<body>
  {{#if watermark}}
  <div class="watermark">
    <img src="{{watermark.svgPath}}" alt="" />
  </div>
  {{/if}}
  
  {{#if frontMatter}}
  <div class="front-matter">
    {{#if frontMatter.dedication}}
    <div class="dedication">
      <h2>Dedication</h2>
      {{{frontMatter.dedication}}}
    </div>
    {{/if}}
    
    {{#if frontMatter.acknowledgements}}
    <div class="acknowledgements">
      <h2>Acknowledgements</h2>
      {{{frontMatter.acknowledgements}}}
    </div>
    {{/if}}
    
    {{#if frontMatter.epigraph}}
    <div class="epigraph">
      {{{frontMatter.epigraph}}}
    </div>
    {{/if}}
  </div>
  {{/if}}
  
  <div class="manuscript-body">
    {{#each chapters}}
    <div class="chapter" data-chapter="{{number}}">
      {{#if title}}
      <h1 class="chapter-title">{{title}}</h1>
      {{/if}}
      
      {{#each scenes}}
      <div class="scene">
        {{{this}}}
      </div>
      {{#unless @last}}
      {{#if ../sceneBreak}}
      <div class="scene-break">{{../sceneBreak}}</div>
      {{/if}}
      {{/unless}}
      {{/each}}
    </div>
    {{/each}}
  </div>
  
  {{#if backMatter}}
  <div class="back-matter">
    {{#if backMatter.aboutAuthor}}
    <div class="about-author">
      <h2>About the Author</h2>
      {{{backMatter.aboutAuthor}}}
    </div>
    {{/if}}
    
    {{#if backMatter.notes}}
    <div class="notes">
      <h2>Notes</h2>
      {{{backMatter.notes}}}
    </div>
    {{/if}}
  </div>
  {{/if}}
</body>
</html>`;
}

/**
 * Gets the default preset for a format
 */
export function getDefaultPresetForFormat(format: 'PDF' | 'DOCX' | 'EPUB'): string {
  switch (format) {
    case 'PDF':
      return 'classic-manuscript';
    case 'DOCX':
      return 'modern-book';
    case 'EPUB':
      return 'modern-book';
    default:
      return 'classic-manuscript';
  }
}