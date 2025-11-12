/**
 * Document Formatting Usage Examples
 *
 * This file demonstrates how to use Inkwell's document formatting system
 * in various contexts: editor, preview, and exports.
 */

import React from 'react';

import {
  FormattingProvider,
  useFormatting,
  useFormattingScope,
  ChapterHeader,
  generateFormattedHTML,
  formatToDOCXStyles,
} from '@/lib/formatting';

// ═══════════════════════════════════════════════════════════════════════════
// Example 1: Basic Usage in Preview
// ═══════════════════════════════════════════════════════════════════════════

function DocumentPreview({ projectId, chapters }) {
  // Apply formatting to the preview container
  const ref = useFormattingScope();

  return (
    <FormattingProvider projectId={projectId}>
      <div ref={ref} className="inkwell-project-scope">
        <div className="preview-content">
          {chapters.map((chapter, index) => (
            <div key={chapter.id}>
              <ChapterHeader index={index} title={chapter.title} />
              <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
            </div>
          ))}
        </div>
      </div>
    </FormattingProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 2: Print Preview with Page Layout
// ═══════════════════════════════════════════════════════════════════════════

function PrintPreview({ projectId, content }) {
  const ref = useFormattingScope();

  return (
    <FormattingProvider projectId={projectId}>
      <div ref={ref} className="inkwell-page-preview inkwell-project-scope">
        <div className="preview-content">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </FormattingProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 3: HTML Export
// ═══════════════════════════════════════════════════════════════════════════

function ExportToHTML({ projectId, chapters, projectName }) {
  const { formatting } = useFormatting();

  const handleExport = () => {
    // Combine all chapters with proper headers
    const fullContent = chapters
      .map(
        (ch, idx) => `
      <div class="chapter">
        <div class="inkwell-ch text-center">${ch.title}</div>
        ${ch.content}
      </div>
    `
      )
      .join('\n');

    // Generate complete HTML with formatting
    const html = generateFormattedHTML(fullContent, formatting, projectName);

    // Download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleExport}>Export to HTML</button>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 4: DOCX Export Integration
// ═══════════════════════════════════════════════════════════════════════════

function ExportToDOCX({ projectId, chapters }) {
  const { formatting } = useFormatting();

  const handleExport = async () => {
    // Get DOCX style configuration
    const styles = formatToDOCXStyles(formatting);

    // Use with docx library (example - requires 'docx' package)
    /*
    const { Document, Paragraph, HeadingLevel, TextRun } = await import('docx');

    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: {
              font: styles.normal.font,
              size: styles.normal.size,
            },
            paragraph: {
              spacing: {
                after: styles.normal.spaceAfter,
                line: styles.normal.lineRule,
              },
              indent: {
                firstLine: styles.normal.firstLineIndent,
              },
            },
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            run: {
              font: styles.heading1.font,
              size: styles.heading1.size,
              bold: styles.heading1.bold,
              allCaps: styles.heading1.caps,
            },
            paragraph: {
              alignment: styles.heading1.alignment,
              spacing: {
                before: styles.heading1.spaceBefore,
                after: styles.heading1.spaceAfter,
              },
            },
          },
        ],
      },
      sections: [{
        children: chapters.flatMap(ch => [
          new Paragraph({
            text: ch.title,
            heading: HeadingLevel.HEADING_1,
          }),
          ...parseContentToParagraphs(ch.content),
        ]),
      }],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${projectName}.docx`);
    */
  };

  return <button onClick={handleExport}>Export to DOCX</button>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 5: Dynamic Formatting Controls
// ═══════════════════════════════════════════════════════════════════════════

function QuickFormatting() {
  const { formatting, setFormatting, resetFormatting } = useFormatting();

  return (
    <div className="formatting-controls">
      <label>
        Font Size:
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.05"
          value={formatting.fontSize}
          onChange={(e) => setFormatting({ fontSize: Number(e.target.value) })}
        />
        <span>{(formatting.fontSize * 16).toFixed(0)}px</span>
      </label>

      <label>
        Line Height:
        <input
          type="range"
          min="1.2"
          max="2.0"
          step="0.1"
          value={formatting.lineHeight}
          onChange={(e) => setFormatting({ lineHeight: Number(e.target.value) })}
        />
        <span>{formatting.lineHeight}</span>
      </label>

      <label>
        Chapter Numbering:
        <select
          value={formatting.chapterHeader.numbering}
          onChange={(e) =>
            setFormatting({
              chapterHeader: { numbering: e.target.value as any },
            })
          }
        >
          <option value="none">None</option>
          <option value="arabic">1, 2, 3...</option>
          <option value="roman">I, II, III...</option>
          <option value="words">One, Two, Three...</option>
        </select>
      </label>

      <button onClick={resetFormatting}>Reset to Defaults</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 6: Formatting with Custom Wrapper
// ═══════════════════════════════════════════════════════════════════════════

function FormattedEditor({ projectId, content, onChange }) {
  const { applyToElement } = useFormatting();
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Apply formatting when it changes
  React.useEffect(() => {
    applyToElement(editorRef.current);
  }, [applyToElement]);

  return (
    <FormattingProvider projectId={projectId}>
      <div ref={editorRef} className="inkwell-project-scope">
        <div className="editor-content" contentEditable onInput={onChange}>
          {content}
        </div>
      </div>
    </FormattingProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 7: Formatting Presets (Custom Implementation)
// ═══════════════════════════════════════════════════════════════════════════

const FORMATTING_PRESETS = {
  manuscript: {
    fontFamily: 'Inter',
    fontSize: 1.0,
    lineHeight: 2.0, // Double-spaced
    paragraphSpacing: 0,
    firstLineIndent: 0.5,
    chapterHeader: {
      alignment: 'left' as const,
      numbering: 'none' as const,
      uppercase: true,
    },
  },
  trade: {
    fontFamily: 'Literata',
    fontSize: 1.0,
    lineHeight: 1.6,
    paragraphSpacing: 0.8,
    firstLineIndent: 1.25,
    chapterHeader: {
      alignment: 'center' as const,
      numbering: 'arabic' as const,
      uppercase: false,
    },
  },
  web: {
    fontFamily: 'Source Sans 3',
    fontSize: 1.0,
    lineHeight: 1.5,
    paragraphSpacing: 1.0,
    firstLineIndent: 0,
    chapterHeader: {
      alignment: 'left' as const,
      numbering: 'none' as const,
      uppercase: false,
    },
  },
};

function PresetSelector() {
  const { setFormatting } = useFormatting();

  const applyPreset = (preset: keyof typeof FORMATTING_PRESETS) => {
    setFormatting(FORMATTING_PRESETS[preset]);
  };

  return (
    <div className="preset-buttons">
      <button onClick={() => applyPreset('manuscript')}>Manuscript Style</button>
      <button onClick={() => applyPreset('trade')}>Trade Book Style</button>
      <button onClick={() => applyPreset('web')}>Web Style</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Example 8: Conditional Formatting
// ═══════════════════════════════════════════════════════════════════════════

function AdaptivePreview({ projectId, content, mode }: { mode: 'print' | 'web' | 'ebook' }) {
  const ref = useFormattingScope();
  const { setFormatting } = useFormatting();

  React.useEffect(() => {
    // Adjust formatting based on output mode
    if (mode === 'print') {
      setFormatting({
        fontSize: 1.0,
        lineHeight: 1.6,
        firstLineIndent: 1.25,
        paragraphSpacing: 0.8,
      });
    } else if (mode === 'web') {
      setFormatting({
        fontSize: 1.0,
        lineHeight: 1.5,
        firstLineIndent: 0,
        paragraphSpacing: 1.0,
      });
    } else if (mode === 'ebook') {
      setFormatting({
        fontSize: 1.0,
        lineHeight: 1.7,
        firstLineIndent: 1.0,
        paragraphSpacing: 0.5,
      });
    }
  }, [mode, setFormatting]);

  return (
    <FormattingProvider projectId={projectId}>
      <div ref={ref} className="inkwell-project-scope">
        <div className="preview-content">{content}</div>
      </div>
    </FormattingProvider>
  );
}

export {
  DocumentPreview,
  PrintPreview,
  ExportToHTML,
  ExportToDOCX,
  QuickFormatting,
  FormattedEditor,
  PresetSelector,
  AdaptivePreview,
};
