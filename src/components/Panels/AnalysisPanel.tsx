// src/components/Panels/AnalysisPanel.tsx
import React, { useState } from 'react';

const AnalysisPanel: React.FC = () => {
  const [analysisText, setAnalysisText] = useState(
    'Insights, feedback, and structure checks will appear here.'
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Story Analysis
      </h2>

      <div className="flex-1 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-200">
        <p>{analysisText}</p>
      </div>

      <div className="mt-4 text-sm italic text-gray-500 dark:text-gray-400">
        (AI-powered analysis tools will be integrated here soon.)
      </div>
    </div>
  );
};

export default AnalysisPanel;
