// src/lib/sectionIcons.tsx
import {
  BookOpen,
  PenLine,
  Star,
  FileText,
  Bookmark,
  FileCode,
  Heart,
  File,
  type LucideIcon,
} from 'lucide-react';

import { SectionType } from '@/types/section';

/**
 * Get the appropriate icon component for a section type
 */
export function getSectionIcon(type: SectionType): LucideIcon {
  switch (type) {
    case 'chapter':
      return BookOpen;
    case 'prologue':
      return PenLine;
    case 'epilogue':
      return Star;
    case 'foreword':
      return FileText;
    case 'afterword':
      return FileText;
    case 'acknowledgements':
      return Bookmark;
    case 'dedication':
      return Heart;
    case 'title-page':
      return File;
    case 'appendix':
      return FileCode;
    case 'custom':
      return BookOpen;
    default:
      return BookOpen;
  }
}

/**
 * Get the appropriate color class for a section type icon
 */
export function getSectionIconColor(type: SectionType): string {
  switch (type) {
    case 'chapter':
      return 'text-amber-400';
    case 'prologue':
      return 'text-blue-400';
    case 'epilogue':
      return 'text-purple-400';
    case 'foreword':
      return 'text-slate-400';
    case 'afterword':
      return 'text-slate-400';
    case 'acknowledgements':
      return 'text-green-400';
    case 'dedication':
      return 'text-pink-400';
    case 'title-page':
      return 'text-cyan-400';
    case 'appendix':
      return 'text-orange-400';
    case 'custom':
      return 'text-gray-400';
    default:
      return 'text-amber-400';
  }
}
