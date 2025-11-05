// src/components/Views/WritingView.tsx - Integration component for your ViewSwitcher
import React, { lazy, Suspense } from 'react';

import { useAppContext } from '@/context/AppContext';
import { FEATURE_FLAGS } from '@/utils/featureFlags.config';

// Lazy load the writing editors
const ChapterWritingPanel = lazy(() => import('../Writing/ChapterWritingPanel'));
const EnhancedWritingEditor = lazy(() => import('../Writing/EnhancedWritingEditor'));

function WritingLoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading writing editor...</p>
      </div>
    </div>
  );
}

const WritingView: React.FC = () => {
  const { currentProject } = useAppContext();
  const useChapterModel = FEATURE_FLAGS.CHAPTER_MODEL?.defaultValue ?? false;

  // If no project selected, show message
  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            No project selected. Please select or create a project to start writing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <Suspense fallback={<WritingLoadingFallback />}>
        {useChapterModel ? (
          // New chapter-based editor
          <ChapterWritingPanel projectId={currentProject.id} />
        ) : (
          // Legacy scene-based editor
          <EnhancedWritingEditor className="h-full" />
        )}
      </Suspense>
    </div>
  );
};

export default WritingView;
