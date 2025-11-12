/**
 * FormattingPanel - Project Typography & Layout Settings
 *
 * UI for configuring project-level document formatting including:
 * - Font selection
 * - Typography (size, line height, spacing)
 * - Chapter header styling
 * - Page layout (margins, dimensions)
 */

import React, { useEffect, useRef } from 'react';

import { ChapterHeader } from '@/components/Document/ChapterHeader';
import { Button } from '@/components/ui/Button';
import { useFormatting } from '@/context/FormattingContext';
import { AVAILABLE_FONTS } from '@/types/formatting';

export const FormattingPanel: React.FC = () => {
  const { formatting, setFormatting, resetFormatting, applyToElement } = useFormatting();
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Apply formatting to preview container
  useEffect(() => {
    applyToElement(previewRef.current);
  }, [applyToElement, formatting]);

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-inkwell-blue to-inkwell-navy px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Document Formatting</h2>
        <p className="mt-1 text-sm text-gray-100">
          Configure typography and layout for your manuscript
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Base Typography Section */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Base Typography</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Font Family */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Font Family</span>
              <select
                value={formatting.fontFamily}
                onChange={(e) => setFormatting({ fontFamily: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>

            {/* Base Font Size */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">
                Base Size (rem)
                <span className="ml-2 text-xs text-gray-500">
                  {(formatting.fontSize * 16).toFixed(0)}px
                </span>
              </span>
              <input
                type="number"
                step="0.025"
                min="0.75"
                max="1.5"
                value={formatting.fontSize}
                onChange={(e) => setFormatting({ fontSize: Number(e.target.value) })}
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>

            {/* Line Height */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Line Height</span>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="2.5"
                value={formatting.lineHeight}
                onChange={(e) => setFormatting({ lineHeight: Number(e.target.value) })}
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>

            {/* Paragraph Spacing */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">
                Paragraph Spacing (rem)
              </span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={formatting.paragraphSpacing}
                onChange={(e) => setFormatting({ paragraphSpacing: Number(e.target.value) })}
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>

            {/* First Line Indent */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">
                First Line Indent (rem)
              </span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="3"
                value={formatting.firstLineIndent ?? 0}
                onChange={(e) => setFormatting({ firstLineIndent: Number(e.target.value) })}
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>
          </div>
        </section>

        {/* Chapter Header Section */}
        <section className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Chapter Headers</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Chapter Font */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Font</span>
              <select
                value={formatting.chapterHeader.fontFamily ?? ''}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: { fontFamily: e.target.value || undefined },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              >
                <option value="">Inherit from base</option>
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>

            {/* Chapter Font Size */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Size (rem)</span>
              <input
                type="number"
                step="0.05"
                min="1"
                max="4"
                value={formatting.chapterHeader.fontSize ?? 1.75}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: { fontSize: Number(e.target.value) },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>

            {/* Alignment */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Alignment</span>
              <select
                value={formatting.chapterHeader.alignment ?? 'center'}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: {
                      alignment: e.target.value as 'left' | 'center' | 'right',
                    },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>

            {/* Numbering Style */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Numbering</span>
              <select
                value={formatting.chapterHeader.numbering ?? 'arabic'}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: {
                      numbering: e.target.value as 'none' | 'arabic' | 'roman' | 'words',
                    },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              >
                <option value="none">None</option>
                <option value="arabic">Arabic (1, 2, 3...)</option>
                <option value="roman">Roman (I, II, III...)</option>
                <option value="words">Words (One, Two, Three...)</option>
              </select>
            </label>

            {/* Prefix */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Prefix</span>
              <input
                type="text"
                value={formatting.chapterHeader.prefix ?? 'Chapter '}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: { prefix: e.target.value },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
                placeholder="Chapter "
              />
            </label>

            {/* Spacing Above */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Spacing Above (rem)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formatting.chapterHeader.spacingAbove ?? 1.5}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: { spacingAbove: Number(e.target.value) },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>

            {/* Spacing Below */}
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium text-gray-700">Spacing Below (rem)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formatting.chapterHeader.spacingBelow ?? 0.75}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: { spacingBelow: Number(e.target.value) },
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
              />
            </label>

            {/* Uppercase Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!formatting.chapterHeader.uppercase}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: { uppercase: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-inkwell-blue focus:ring-inkwell-blue"
              />
              <span className="text-sm font-medium text-gray-700">Uppercase</span>
            </label>

            {/* Divider Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!formatting.chapterHeader.divider?.show}
                onChange={(e) =>
                  setFormatting({
                    chapterHeader: {
                      divider: {
                        show: e.target.checked,
                        pattern: formatting.chapterHeader.divider?.pattern ?? 'rule',
                      },
                    },
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-inkwell-blue focus:ring-inkwell-blue"
              />
              <span className="text-sm font-medium text-gray-700">Show divider</span>
            </label>

            {/* Divider Pattern (conditional) */}
            {formatting.chapterHeader.divider?.show && (
              <label className="flex flex-col">
                <span className="mb-1 text-sm font-medium text-gray-700">Divider Style</span>
                <select
                  value={formatting.chapterHeader.divider?.pattern ?? 'rule'}
                  onChange={(e) =>
                    setFormatting({
                      chapterHeader: {
                        divider: {
                          show: true,
                          pattern: e.target.value as 'none' | 'rule' | 'ornament',
                        },
                      },
                    })
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-inkwell-blue focus:outline-none focus:ring-1 focus:ring-inkwell-blue"
                >
                  <option value="rule">Horizontal Rule</option>
                  <option value="ornament">Ornament (❦)</option>
                </select>
              </label>
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="flex gap-3 border-t border-gray-200 pt-6">
          <Button onClick={resetFormatting} variant="outline">
            Reset to Defaults
          </Button>
        </section>

        {/* Live Preview */}
        <section className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Preview</h3>
          <div
            ref={previewRef}
            className="inkwell-project-scope rounded-lg border border-gray-300 bg-white p-8 shadow-sm"
          >
            <div className="preview-content">
              <ChapterHeader index={1} title="A Sample Chapter" />
              <p>
                First paragraph starts with a first-line indent if configured. Lorem ipsum dolor
                sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum
                mauris.
              </p>
              <p>
                Another paragraph follows with paragraph spacing applied. Cras id dui lectus.
                Phasellus vel sapien semper, mollis elit id, aliquet lacus. Sed eget eros id
                libero hendrerit rhoncus.
              </p>
              <p>
                The preview updates in real-time as you adjust the formatting settings above,
                giving you an accurate representation of how your manuscript will appear.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FormattingPanel;
