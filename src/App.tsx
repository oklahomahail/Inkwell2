import React from "react";
import CompleteWritingPlatform from "@/components/CompleteWritingPlatform";
import ClaudeProvider from "@/context/ClaudeProvider";
import { WritingPlatformProvider } from "@/context/WritingPlatformProvider";

const App: React.FC = () => {
  return (
    <WritingPlatformProvider>
      <ClaudeProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <CompleteWritingPlatform />
        </div>
      </ClaudeProvider>
    </WritingPlatformProvider>
  );
};

export default App;
