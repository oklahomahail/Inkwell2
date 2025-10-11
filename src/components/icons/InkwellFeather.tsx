// File: src/components/icons/InkwellFeather.tsx
import {
  House,
  PenTool,
  Clock,
  ChartColumn,
  Settings,
  ChevronLeft,
  type LucideProps,
} from 'lucide-react';
import * as React from 'react';

import type { SVGProps } from 'react';

export const INKWELL_ICONS = {
  home: House,
  writing: PenTool,
  timeline: Clock,
  analytics: ChartColumn,
  settings: Settings,
  'chevron-left': ChevronLeft,
} as const;

export type InkwellIconName = keyof typeof INKWELL_ICONS;

export const ICON_SIZES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  '2xl': 'w-8 h-8',
};

export const ICON_COLORS: Record<
  'default' | 'brand' | 'error' | 'muted' | 'success' | 'warning',
  string
> = {
  default: 'text-gray-600',
  brand: 'text-indigo-600',
  error: 'text-red-600',
  muted: 'text-gray-400',
  success: 'text-green-600',
  warning: 'text-amber-600',
};

export interface InkwellFeatherProps extends Omit<LucideProps, 'ref'> {
  /** Icon name from the registry */
  name: InkwellIconName | (string & {});
  /** semantic size token */
  size?: keyof typeof ICON_SIZES;
  /** semantic color token */
  color?: keyof typeof ICON_COLORS;
  /** optional accessible label; defaults to normalized name */
  'aria-label'?: string;
  /** test id passthrough */
  'data-testid'?: string;
}

/**
 * Unified icon component for Inkwell
 */
export function InkwellFeather({
  name,
  size = 'md',
  color = 'default',
  className,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  ...rest
}: InkwellFeatherProps) {
  const Icon = (INKWELL_ICONS as Record<string, React.ComponentType<LucideProps>>)[name];

  if (!Icon) {
    // Keep tests happy: warn and return null

    console.warn('InkwellFeather: Unknown icon name', name);
    return null;
  }

  const sizeClasses = ICON_SIZES[size] ?? ICON_SIZES.md;
  const colorClasses = ICON_COLORS[color] ?? ICON_COLORS.default;

  const label = ariaLabel ?? String(name).replace(/[-_]+/g, ' ').trim();

  return (
    <Icon
      role="img"
      aria-label={label}
      data-testid={dataTestId}
      className={[sizeClasses, colorClasses, className].filter(Boolean).join(' ')}
      {...(rest as SVGProps<SVGSVGElement>)}
    />
  );
}

export default InkwellFeather;
