import React, { useEffect, useState } from "react";

interface DraftStats {
  wordCount: number;
  charCount: number;
  chapters: number;
}

const TARGET_WORD_COUNT = 50000; // Example: NaNoWriMo-style target

const AnalysisPanel: React.FC = () => {
  const [stats, setStats] = useState<DraftStats>({
    wordCount: 0,
    charCount: 0,
    chapters: 0,
  });

  // Load content from localStorage and calculate stats
  useEffect(() => {
    try {
      const stored = localStorage.getItem("writing_content");
      if (stored) {
        const { content = "" } = JSON.parse(stored);
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        setStats({
          wordCount: words,
          charCount: content.length,
          chapters: Math.ceil(words / 2000), // Roughly 2k words per chapter
        });
      }
    } catch (error) {
      console.warn("Failed to load draft stats", error);
    }
  }, []);

  const progressPercent = Math.min(stats.wordCount / TARGET_WORD_COUNT, 1) * 100;

  return (
    <div className="p-6 bg-[#0A0F1C] text-gray-100 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-[#0073E6] border-b border-gray-700 pb-2">
        Project Analysis
      </h2>

      {/* Word Count Summary */}
      <div className="p-5 bg-[#1A2233] rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-white mb-2">Word Count</h3>
        <p className="text-3xl font-bold text-[#0073E6]">
          {stats.wordCount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {stats.chapters} estimated chapter(s) • {stats.charCount} characters
        </p>
      </div>

      {/* Progress Visualization */}
      <div className="p-5 bg-[#1A2233] rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-white mb-3">Progress</h3>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-[#0073E6] h-4 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Goal: {TARGET_WORD_COUNT.toLocaleString()} words
        </p>
      </div>

      {/* Placeholder for charts */}
      <div className="p-5 bg-[#1A2233] rounded-lg shadow-md">
        <h3 className="text-md font-semibold text-white mb-2">
          Chapter Breakdown (Coming Soon)
        </h3>
        <p className="text-sm text-gray-400">
          This section will visualize chapter-by-chapter progress, pacing, and
          scene balance.
        </p>
      </div>
    </div>
  );
};

export default AnalysisPanel;
