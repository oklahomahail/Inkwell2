// src/components/Writing/LazyTipTapEditor.tsx
import React, { lazy, Suspense } from 'react';

// Lazy load the heavy TipTap editor
const TipTapEditor = lazy(() => import('./TipTapEditor'));

interface LazyTipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  wordCount?: number;
  onWordCountChange?: (count: number) => void;
  className?: string;
  autoFocus?: boolean;
}

function TipTapLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex flex-col items-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading editor...</p>
      </div>
    </div>
  );
}

export default function LazyTipTapEditor({ content, ...props }: LazyTipTapEditorProps) {
  return (
    <Suspense fallback={<TipTapLoadingFallback />}>
      <TipTapEditor value={content} {...props} />
    </Suspense>
  );
}
