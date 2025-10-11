import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function _cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} // Usage examples: // cn('base-class', condition && 'conditional-class') // cn('text-lg', isActive ? 'text-blue-500' : 'text-gray-500', 'font-bold')
