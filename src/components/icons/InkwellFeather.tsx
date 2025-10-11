// InkwellFeather Icon System
// Provides consistent icon usage across the application with size variants and theming

import {
  // Navigation & Core
  Home,
  Settings,
  BarChart3,
  Clock,
  PenTool,
  BookOpen,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,

  // Writing & Content
  Edit3,
  FileText,
  Save,
  Copy,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  HelpCircle,

  // Analysis & Data
  TrendingUp,
  Target,
  Calendar,
  Users,
  Lightbulb,
  Sparkles,
  Star,
  Award,

  // Actions & States
  Play,
  Pause,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,

  // UI Elements
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  Filter,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Icon registry - centralized icon management
export const INKWELL_ICONS = {
  // Navigation & Core
  home: Home,
  settings: Settings,
  analytics: BarChart3,
  timeline: Clock,
  writing: PenTool,
  planning: BookOpen,
  search: Search,
  menu: Menu,
  close: X,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,

  // Writing & Content
  edit: Edit3,
  document: FileText,
  save: Save,
  copy: Copy,
  delete: Trash2,
  add: Plus,
  remove: Minus,
  check: Check,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle,

  // Analysis & Data
  trending: TrendingUp,
  target: Target,
  calendar: Calendar,
  users: Users,
  idea: Lightbulb,
  magic: Sparkles,
  star: Star,
  award: Award,

  // Actions & States
  play: Play,
  pause: Pause,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  show: Eye,
  hide: EyeOff,
  lock: Lock,
  unlock: Unlock,

  // UI Elements
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  grid: Grid,
  list: List,
  filter: Filter,
  sort: ArrowUpDown,
  maximize: Maximize2,
  minimize: Minimize2,
} as const;

type InkwellIcons = typeof INKWELL_ICONS;
export type InkwellIconName = keyof InkwellIcons | Lowercase<keyof InkwellIcons>;

// Size variants for consistent sizing
export const ICON_SIZES = {
  xs: 'w-3 h-3', // 12px
  sm: 'w-4 h-4', // 16px
  md: 'w-5 h-5', // 20px
  lg: 'w-6 h-6', // 24px
  xl: 'w-8 h-8', // 32px
  '2xl': 'w-12 h-12', // 48px
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// Color variants for theming
export const ICON_COLORS = {
  default: 'text-gray-600 dark:text-gray-400',
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-gray-500 dark:text-gray-500',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  muted: 'text-gray-400 dark:text-gray-600',
  accent: 'text-indigo-600 dark:text-indigo-400',
  brand: 'text-amber-600 dark:text-amber-400', // Brand gold color
} as const;

export type IconColor = keyof typeof ICON_COLORS;

import type { LucideProps } from 'lucide-react';

export interface InkwellFeatherProps extends Omit<LucideProps, 'size' | 'color'> {
  name: InkwellIconName;
  size?: IconSize;
  color?: IconColor;
  title?: string;
  'data-testid'?: string;
}

/**
 * InkwellFeather - Standardized icon component
 *
 * Features:
 * - Centralized icon registry for consistency
 * - Standardized size variants
 * - Theme-aware color variants
 * - Accessibility support
 * - Type-safe icon names
 *
 * @example
 * <InkwellFeather name="home" size="md" color="primary" />
 * <InkwellFeather name="writing" size="lg" className="hover:text-blue-500" />
 */
export const InkwellFeather: React.FC<InkwellFeatherProps> = ({
  name,
  size = 'md',
  color = 'default',
  className,
  'aria-label': ariaLabel,
  title,
  'data-testid': dataTestId,
  ...rest
}) => {
  const IconComponent = INKWELL_ICONS[name];

  if (!IconComponent) {
    console.warn(`InkwellFeather: Unknown icon "${name}"`);
    return null;
  }

  const iconClasses = cn(ICON_SIZES[size], ICON_COLORS[color], className);

  // Compose accessibility attributes
  const computedAria = ariaLabel || name.replace('-', ' ');
  const computedTitle = title ?? (ariaLabel ? undefined : undefined);

  return (
    <IconComponent
      className={iconClasses}
      aria-label={computedAria}
      title={title}
      data-testid={dataTestId}
      {...rest}
    />
  );
};

// Convenience exports for direct icon usage (when you need the Lucide component)
export { INKWELL_ICONS as Icons };
export type { LucideIcon };

// Re-export specific commonly used icons for backwards compatibility
export {
  Home,
  Settings,
  BarChart3,
  Clock,
  PenTool,
  BookOpen,
  Edit3,
  FileText,
  Plus,
  Search,
} from 'lucide-react';

export default InkwellFeather;
