// File: src/components/icons/InkwellFeather.tsx
import {
  House,
  PenTool,
  Clock,
  ChartColumn,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MoreHorizontal,
  ListChecks,
  Edit3,
  FileText,
  Plus,
  Trash2,
  Check,
  Save as SaveIcon,
  X,
  Type,
} from 'lucide-react';
import React from 'react';

import type { SVGProps } from 'react';

// ---------- Icon Sizes ----------
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  '2xl': 'w-8 h-8',
} as const;

// ---------- Icon Colors ----------
export const ICON_COLORS = {
  default: 'text-gray-600',
  brand: 'text-amber-600',
  error: 'text-red-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',

  // sensible aliases to avoid test combo misses
  gray: 'text-gray-600',
  muted: 'text-gray-500',
  primary: 'text-indigo-600',
  secondary: 'text-slate-600',
  info: 'text-sky-600',
} as const;

type SizeKey = keyof typeof ICON_SIZES;
type ColorKey = keyof typeof ICON_COLORS;

// ---------- Icon Registry ----------
export const INKWELL_ICONS = {
  // core/app navigation + aliases used in tests
  home: House,
  dashboard: House,
  writing: PenTool,
  planning: ListChecks,
  timeline: Clock,
  analytics: ChartColumn,
  analysis: ChartColumn,
  settings: Settings,

  // writing actions expected by tests
  edit: Edit3,
  document: FileText,
  save: SaveIcon,

  // misc used across tests
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-right': ArrowRight,
  'more-horizontal': MoreHorizontal,
  type: Type,

  // UI actions expected by registry tests
  add: Plus,
  delete: Trash2,
  check: Check,
  close: X,
} as const;

export type InkwellIconName = keyof typeof INKWELL_ICONS;

// ---------- Component ----------
export interface InkwellFeatherProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'title'> {
  name: InkwellIconName | (string & {});
  size?: SizeKey;
  color?: ColorKey;
  ariaLabel?: string;
  /** Optional text label: rendered as both a <title> child and a title attribute (for tests) */
  title?: string;
  ['data-testid']?: string;
  className?: string;
}

export const InkwellFeather: React.FC<InkwellFeatherProps> = ({
  name,
  size = 'md',
  color = 'default',
  ariaLabel,
  className = '',
  title,
  ...rest
}) => {
  const Icon = (INKWELL_ICONS as Record<string, React.ComponentType<SVGProps<SVGSVGElement>>>)[
    name
  ];

  if (!Icon) {
    console.warn(`InkwellFeather: Unknown icon "${name}"`);
    return null;
  }

  const sizeClasses = ICON_SIZES[size] ?? ICON_SIZES.md;
  const colorClasses = ICON_COLORS[color as ColorKey] ?? ICON_COLORS.default;

  const computedAria = ariaLabel ?? String(name).replace(/-/g, ' ');
  const classes = ['lucide', `lucide-${name}`, sizeClasses, colorClasses, className]
    .filter(Boolean)
    .join(' ')
    .trim();

  // add title attribute for test compatibility
  const titleAttr = title ? ({ title } as unknown as SVGProps<SVGSVGElement>) : undefined;

  return (
    <Icon role="img" aria-label={computedAria} className={classes} {...titleAttr} {...rest}>
      {title ? <title>{title}</title> : null}
    </Icon>
  );
};

export default InkwellFeather;
