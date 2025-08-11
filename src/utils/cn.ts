// src/utils/cn.ts
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes
    .filter((cls): cls is string => Boolean(cls) && typeof cls === 'string')
    .join(' ')
    .trim();
}

// Usage examples:
// cn('base-class', condition && 'conditional-class')
// cn('text-lg', isActive ? 'text-blue-500' : 'text-gray-500', 'font-bold')