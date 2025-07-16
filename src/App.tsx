// src/App.tsx
import React, { Suspense } from 'react';
import CompleteWritingPlatform from './CompleteWritingPlatform';
import WritingPlatformProvider from './context/WritingPlatformProvider';
import ClaudeProvider from './context/ClaudeProvider';
import ErrorBoundary from './components/Shared/ErrorBoundary';
import LoadingScreen from './components/Shared/LoadingScreen';

const App: React.FC = () => {
  return (
    <WritingPlatformProvider>
      <ClaudeProvider>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <CompleteWritingPlatform />
          </Suspense>
        </ErrorBoundary>
      </ClaudeProvider>
    </WritingPlatformProvider>
  );
};

export default App;