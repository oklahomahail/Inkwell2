// src/components/Views/WritingView.tsx - Integration component for your ViewSwitcher
import React from 'react';
import EnhancedWritingEditor from '../Writing/EnhancedWritingEditor';

const WritingView: React.FC = () => {
  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <EnhancedWritingEditor className="h-full" />
    </div>
  );
};

export default WritingView;
