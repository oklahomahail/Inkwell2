import React, { useEffect, useState, useMemo, useCallback } from 'react';

interface DraftStats {
  wordCount: number;
  charCount: number;
  chapters: number;
  sentences: number;
  paragraphs: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
  readingTime: number;
  lastUpdated: Date | null;
}

interface Scene {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
}

interface ReadabilityScore {
  level: 'Elementary' | 'Middle School' | 'High School' | 'College' | 'Graduate';
  description: string;
  color: string;
  score: number;
}

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: string;
}

interface ActivityHeatmapProps {
  sessions: WritingSession[];
  className?: string;
}

interface GoalSettingsProps {
  targetWordCount: number;
  onTargetChange: (value: number) => void;
}

const TARGET_WORD_COUNT = 80000;
const WORDS_PER_MINUTE_READING = 250;

// Simple syllable counter (more accurate than character estimation)
const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  // Remove common suffixes and prefixes
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]{1,2}/g);
  const syllableCount = vowelGroups ? vowelGroups.length : 1;

  return Math.max(1, syllableCount);
};

// Calculate Flesch Reading Ease score
const calculateReadabilityScore = (stats: DraftStats): ReadabilityScore => {
  const { avgWordsPerSentence, sentences, wordCount, charCount } = stats;

  if (sentences === 0 || wordCount === 0) {
    return {
      level: 'Elementary',
      description: 'No text to analyze',
      color: 'text-gray-400',
      score: 0,
    };
  }

  // Estimate syllables per word (improved estimation)
  const avgCharsPerWord = charCount / wordCount;
  const syllablesPerWord = Math.max(1, avgCharsPerWord * 0.4 + 0.5); // Better syllable estimation

  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * syllablesPerWord;

  if (fleschScore >= 90) {
    return {
      level: 'Elementary',
      description: 'Very easy to read',
      color: 'text-green-400',
      score: Math.round(fleschScore),
    };
  } else if (fleschScore >= 80) {
    return {
      level: 'Elementary',
      description: 'Easy to read',
      color: 'text-green-400',
      score: Math.round(fleschScore),
    };
  } else if (fleschScore >= 70) {
    return {
      level: 'Middle School',
      description: 'Fairly easy to read',
      color: 'text-blue-400',
      score: Math.round(fleschScore),
    };
  } else if (fleschScore >= 60) {
    return {
      level: 'High School',
      description: 'Standard difficulty',
      color: 'text-yellow-400',
      score: Math.round(fleschScore),
    };
  } else if (fleschScore >= 50) {
    return {
      level: 'College',
      description: 'Fairly difficult',
      color: 'text-orange-400',
      score: Math.round(fleschScore),
    };
  } else {
    return {
      level: 'Graduate',
      description: 'Very difficult',
      color: 'text-red-400',
      score: Math.round(fleschScore),
    };
  }
};

// StatCard Component
const StatCard: React.FC<StatCardProps> = ({
  title,
  icon,
  value,
  subtitle,
  trend,
  color = 'text-white',
}) => (
  <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold font-semibold font-semibold font-medium font-semibold text-white">
        {title}
      </h3>
      <div className="flex items-center space-x-2">
        {icon}
        {trend && (
          <span
            className={`text-xs text-gray-500 px-2 py-1 rounded-full ${
              trend.isPositive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}
          >
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
    <div className="space-y-2">
      <p
        className={`text-2xl font-bold font-bold font-bold font-bold font-bold font-bold ${color.includes('text-') ? color : `text-${color}`}`}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-600 text-gray-400">
          {subtitle}
          {trend && (
            <span className={`ml-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.label}
            </span>
          )}
        </p>
      )}
    </div>
  </div>
);

// ActivityHeatmap Component
const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ sessions, className = '' }) => {
  // Pre-index sessions by date for O(1) lookup
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WritingSession>();
    sessions.forEach((session) => {
      map.set(session.date, session);
    });
    return map;
  }, [sessions]);

  const heatmapData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      const session = sessionsByDate.get(dateStr);
      const intensity = session ? Math.min(session.wordCount / 1000, 1) : 0;

      return {
        date: dateStr,
        session,
        intensity,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }, [sessionsByDate]);

  return (
    <div className={`bg-[#1A2233] rounded-xl p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-semibold font-semibold font-medium font-semibold text-white">
          Writing Activity (Last 30 Days)
        </h3>
        <span className="text-sm text-gray-600 text-gray-400">{sessions.length} sessions</span>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-30 gap-1 mb-4 min-w-[600px]">
          {heatmapData.map((day, i) => (
            <div
              key={i}
              className={`h-8 rounded-sm transition-all duration-200 hover:scale-110 cursor-help ${
                day.intensity === 0
                  ? 'bg-gray-700'
                  : day.intensity < 0.3
                    ? 'bg-green-900'
                    : day.intensity < 0.6
                      ? 'bg-green-700'
                      : day.intensity < 0.9
                        ? 'bg-green-500'
                        : 'bg-green-400'
              }`}
              title={
                day.session
                  ? `${day.session.wordCount} words on ${day.displayDate}`
                  : `No writing on ${day.displayDate}`
              }
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 text-gray-400">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

// GoalSettings Component
const GoalSettings: React.FC<GoalSettingsProps> = ({ targetWordCount, onTargetChange }) => (
  <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
    <h3 className="text-lg font-semibold font-semibold font-semibold font-medium font-semibold text-white mb-4">
      Goal Settings
    </h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600 font-medium text-gray-300 mb-2">
          Target Word Count
        </label>
        <input
          type="number"
          value={targetWordCount}
          onChange={(e) => onTargetChange(parseInt(e.target.value) || 0)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#0073E6] transition-colors"
          min="1000"
          step="1000"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          onClick={() => onTargetChange(50000)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm text-gray-600 transition-colors"
        >
          NaNoWriMo (50k)
        </button>
        <button
          onClick={() => onTargetChange(80000)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm text-gray-600 transition-colors"
        >
          Novel (80k)
        </button>
      </div>
    </div>
  </div>
);

// Main AnalysisPanel Component
const AnalysisPanel: React.FC = () => {
  const [stats, setStats] = useState<DraftStats>({
    wordCount: 0,
    charCount: 0,
    chapters: 0,
    sentences: 0,
    paragraphs: 0,
    avgWordsPerSentence: 0,
    avgSentencesPerParagraph: 0,
    readingTime: 0,
    lastUpdated: null,
  });

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [targetWordCount, setTargetWordCount] = useState(() => {
    const stored = localStorage.getItem('target_word_count');
    return stored ? parseInt(stored) : TARGET_WORD_COUNT;
  });
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [writingSessions, setWritingSessions] = useState<WritingSession[]>([]);
  const [lastWordCount, setLastWordCount] = useState(0);

  // Persist target word count changes
  useEffect(() => {
    localStorage.setItem('target_word_count', targetWordCount.toString());
  }, [targetWordCount]);

  // Track writing sessions dynamically
  useEffect(() => {
    if (stats.wordCount > 0 && stats.wordCount !== lastWordCount) {
      const today = new Date().toISOString().split('T')[0];
      const wordDiff = stats.wordCount - lastWordCount;

      // Only track if there's a meaningful increase (50+ words)
      if (wordDiff >= 50) {
        setWritingSessions((prev) => {
          const existingSessionIndex = prev.findIndex((s) => s.date === today);
          const newSessions = [...prev];

          if (existingSessionIndex >= 0) {
            // Update existing session
            newSessions[existingSessionIndex] = {
              ...newSessions[existingSessionIndex],
              wordCount: newSessions[existingSessionIndex].wordCount + wordDiff,
            };
          } else {
            // Create new session
            newSessions.push({
              date: today,
              wordCount: wordDiff,
              duration: 30, // Default session duration
            });
          }

          // Save to localStorage
          localStorage.setItem('writing_sessions', JSON.stringify(newSessions));
          return newSessions;
        });
      }

      setLastWordCount(stats.wordCount);
    }
  }, [stats.wordCount, lastWordCount]);

  // Calculate readability score
  const readabilityScore = useMemo(() => calculateReadabilityScore(stats), [stats]);

  // Load and calculate comprehensive stats
  useEffect(() => {
    try {
      // Load writing content
      const stored = localStorage.getItem('writing_content');
      let content = '';

      if (stored) {
        const parsed = JSON.parse(stored);
        content = parsed.content || '';
      }

      // Load timeline scenes
      const storedScenes = localStorage.getItem('timeline_scenes');
      if (storedScenes) {
        setScenes(JSON.parse(storedScenes));
      }

      // Load writing sessions
      const storedSessions = localStorage.getItem('writing_sessions');
      if (storedSessions) {
        const sessions = JSON.parse(storedSessions);
        setWritingSessions(sessions);
      } else {
        // Generate mock session data for demo
        const mockSessions = generateMockSessions();
        setWritingSessions(mockSessions);
        localStorage.setItem('writing_sessions', JSON.stringify(mockSessions));
      }

      if (content.trim()) {
        const words = content.trim().split(/\s+/).length;
        const chars = content.length;
        const sentences = Math.max(
          1,
          content.split(/[.!?]+/).filter((s) => s.trim().length > 3).length,
        );
        const paragraphs = Math.max(
          1,
          content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length,
        );
        const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
        const avgSentencesPerParagraph = paragraphs > 0 ? sentences / paragraphs : 0;
        const readingTime = Math.ceil(words / WORDS_PER_MINUTE_READING);

        const newStats = {
          wordCount: words,
          charCount: chars,
          chapters: Math.ceil(words / 2500),
          sentences,
          paragraphs,
          avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
          avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
          readingTime,
          lastUpdated: new Date(),
        };

        setStats(newStats);
        setLastWordCount(words);
      }
    } catch (error) {
      console.warn('Failed to load draft stats', error);
    }
  }, []);

  // Generate mock writing sessions for demo
  const generateMockSessions = (): WritingSession[] => {
    const sessions: WritingSession[] = [];
    const today = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      if (Math.random() > 0.3) {
        sessions.push({
          date: date.toISOString().split('T')[0],
          wordCount: Math.floor(Math.random() * 1500) + 200,
          duration: Math.floor(Math.random() * 120) + 30,
        });
      }
    }

    return sessions;
  };

  // Calculate writing streak (improved logic)
  const writingStreak = useMemo(() => {
    if (writingSessions.length === 0) return 0;

    const sortedSessions = [...writingSessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (sortedSessions.length === 0) return 0;

    const mostRecentSession = new Date(sortedSessions[0].date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(mostRecentSession);
    currentDate.setHours(0, 0, 0, 0);

    const daysSinceLastWrite = Math.floor(
      (today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceLastWrite > 1) return 0;

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }, [writingSessions]);

  // Recent writing activity with trend
  const recentActivity = useMemo(() => {
    const last7Days = writingSessions
      .filter((session) => {
        const sessionDate = new Date(session.date);
        const daysDiff = (new Date().getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7 && daysDiff >= 0;
      })
      .reduce((total, session) => total + session.wordCount, 0);

    const previous7Days = writingSessions
      .filter((session) => {
        const sessionDate = new Date(session.date);
        const daysDiff = (new Date().getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 7 && daysDiff <= 14;
      })
      .reduce((total, session) => total + session.wordCount, 0);

    const trend = previous7Days > 0 ? ((last7Days - previous7Days) / previous7Days) * 100 : 0;

    return { current: last7Days, trend };
  }, [writingSessions]);

  const handleTargetWordCountChange = useCallback((newTarget: number) => {
    setTargetWordCount(newTarget);
  }, []);

  const progressPercent = Math.min((stats.wordCount / targetWordCount) * 100, 100);
  const progressColor =
    progressPercent < 25
      ? 'bg-red-500'
      : progressPercent < 50
        ? 'bg-yellow-500'
        : progressPercent < 75
          ? 'bg-blue-500'
          : 'bg-green-500';

  return (
    <div className="h-full bg-[#0A0F1C] text-gray-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold leading-tight font-bold text-white mb-2">
            Project Analytics
          </h2>
          <p className="text-gray-400 text-sm text-gray-600">
            {stats.lastUpdated
              ? `Last updated: ${stats.lastUpdated.toLocaleTimeString()}`
              : 'No data yet'}
          </p>
        </div>
        <button
          onClick={() => setShowDetailedStats(!showDetailedStats)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showDetailedStats
              ? 'bg-[#0073E6] text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {showDetailedStats ? 'Simple View' : 'Detailed View'}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Word Count"
          icon={
            <svg
              className="w-6 h-6 text-[#0073E6]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          value={stats.wordCount}
          subtitle={`${stats.charCount.toLocaleString()} characters`}
          color="text-[#0073E6]"
        />

        <StatCard
          title="Progress"
          icon={
            <svg
              className="w-6 h-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          value={`${Math.round(progressPercent)}%`}
          subtitle={`Goal: ${targetWordCount.toLocaleString()} • ${(targetWordCount - stats.wordCount).toLocaleString()} remaining`}
          color="text-green-400"
        />

        <StatCard
          title="Writing Streak"
          icon={
            <svg
              className="w-6 h-6 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
          }
          value={writingStreak}
          subtitle={`${writingStreak === 1 ? 'day' : 'days'} in a row`}
          color="text-orange-400"
        />

        <StatCard
          title="This Week"
          icon={
            <svg
              className="w-6 h-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          value={recentActivity.current}
          subtitle="words written"
          trend={
            recentActivity.trend !== 0
              ? {
                  value: Math.round(Math.abs(recentActivity.trend)),
                  isPositive: recentActivity.trend > 0,
                  label: 'vs last week',
                }
              : undefined
          }
          color="text-purple-400"
        />

        <StatCard
          title="Reading Time"
          icon={
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          value={`${stats.readingTime}m`}
          subtitle="estimated"
          color="text-yellow-400"
        />

        <StatCard
          title="Story Structure"
          icon={
            <svg
              className="w-6 h-6 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          value={scenes.length}
          subtitle={`scenes planned • ${stats.chapters} estimated chapters`}
          color="text-cyan-400"
        />
      </div>

      {/* Detailed Stats */}
      {showDetailedStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Writing Quality Metrics */}
          <div className="bg-[#1A2233] rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold font-semibold font-semibold font-medium font-semibold text-white mb-4">
              Writing Quality
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Sentences</span>
                <span className="text-white font-medium">{stats.sentences}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Paragraphs</span>
                <span className="text-white font-medium">{stats.paragraphs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Words per sentence</span>
                <span className="text-white font-medium">{stats.avgWordsPerSentence}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Sentences per paragraph</span>
                <span className="text-white font-medium">{stats.avgSentencesPerParagraph}</span>
              </div>
              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Readability</span>
                  <div className="text-right">
                    <span className={`font-medium ${readabilityScore.color}`}>
                      {readabilityScore.level}
                    </span>
                    <span className="text-xs text-gray-500 text-gray-500 ml-2">
                      ({readabilityScore.score})
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-gray-400 mt-1">
                  {readabilityScore.description}
                </p>
              </div>
            </div>
          </div>

          <GoalSettings
            targetWordCount={targetWordCount}
            onTargetChange={handleTargetWordCountChange}
          />
        </div>
      )}

      {/* Activity Heatmap */}
      <ActivityHeatmap sessions={writingSessions} />

      {/* Custom styles */}
      <style>{`
        .grid-cols-30 {
          grid-template-columns: repeat(30, minmax(0, 1fr));
        }
        
        @media (max-width: 768px) {
          .grid-cols-30 {
            grid-template-columns: repeat(15, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default AnalysisPanel;
