/**
 * ChapterHeader Component
 *
 * Renders chapter headers with formatting from FormattingContext
 * Supports various numbering styles, alignment, and optional dividers
 */

import React from 'react';

import { useFormatting } from '@/context/FormattingContext';
import { formatChapterNumber } from '@/lib/formatting/numbering';

export interface ChapterHeaderProps {
  /** Chapter number (1-indexed) */
  index: number;
  /** Chapter title */
  title: string;
  /** Additional CSS classes */
  className?: string;
}

export const ChapterHeader: React.FC<ChapterHeaderProps> = ({ index, title, className = '' }) => {
  const { formatting } = useFormatting();
  const f = formatting.chapterHeader;

  // Build the full chapter label with numbering
  const label = React.useMemo(() => {
    if (f.numbering === 'none') {
      return title;
    }

    const number = formatChapterNumber(index, f.numbering ?? 'arabic');
    const prefix = f.prefix ?? '';

    // If title is empty, just show number with prefix
    if (!title || title.trim() === '') {
      return `${prefix}${number}`;
    }

    // Format: "Chapter 1: Title" or "One: Title" etc.
    return `${prefix}${number}: ${title}`;
  }, [index, title, f.numbering, f.prefix]);

  // Determine alignment class
  const alignClass = React.useMemo(() => {
    switch (f.alignment) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  }, [f.alignment]);

  return (
    <div className={`inkwell-ch ${alignClass} ${className}`.trim()}>
      <div
        style={{
          textTransform: f.uppercase ? 'uppercase' : 'none',
        }}
      >
        {label}
      </div>
      {f.divider?.show && (
        <hr
          className={`inkwell-ch-divider ${f.divider.pattern === 'ornament' ? 'ornament' : ''}`}
        />
      )}
    </div>
  );
};

/**
 * Simple chapter title (no numbering, minimal formatting)
 * Useful for parts, epilogues, etc.
 */
export const SimpleChapterHeader: React.FC<{ title: string; className?: string }> = ({
  title,
  className = '',
}) => {
  return <div className={`inkwell-ch text-center ${className}`.trim()}>{title}</div>;
};
