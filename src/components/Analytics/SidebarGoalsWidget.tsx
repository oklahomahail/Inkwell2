// Compact sidebar widget for your main writing interface
// File: src/components/Analytics/SidebarGoalsWidget.tsx (moved to Analytics folder)

import { Target, Flame, Timer, TrendingUp, Play, Pause } from 'lucide-react';
import React from 'react';
import { useWritingGoals } from '@/hooks/useWritingGoals';

interface SidebarGoalsWidgetProps {
  className?: string;
}

const SidebarGoalsWidget: React.FC<SidebarGoalsWidgetProps> = ({ className = '' }) => {
  const {
    goals,
    currentStreak,
    getTodayProgress,
    getCurrentSessionTime,
    isSessionActive,
    startWritingSession,
    pauseWritingSession,
  } = useWritingGoals();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = getTodayProgress();
  const mainGoals = goals
    .filter((goal) => goal.type === 'daily_words' || goal.type === 'daily_time')
    .slice(0, 2);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-600" />
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">Daily Goals</h3>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Main Goals Progress */}
      <div className="space-y-2 mb-4">
        {mainGoals.map((goal) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);
          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <span>{goal.emoji}</span>
                  {goal.label}
                </span>
                <span className={`font-medium ${goal.color}`}>
                  {goal.current.toLocaleString()}/{goal.target.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Timer */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Session</span>
          </div>
          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
            {formatTime(getCurrentSessionTime())}
          </span>
        </div>
        <button
          onClick={isSessionActive ? pauseWritingSession : startWritingSession}
          className={`w-full mt-2 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${
            isSessionActive
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-300'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
          }`}
        >
          {isSessionActive ? (
            <>
              <Pause size={12} />
              Pause Session
            </>
          ) : (
            <>
              <Play size={12} />
              Start Writing
            </>
          )}
        </button>
      </div>

      {/* Streak & Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={12} className="text-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Streak</span>
          </div>
          <div className="text-sm font-bold text-orange-600">{currentStreak}</div>
        </div>

        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={12} className="text-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Today</span>
          </div>
          <div className="text-sm font-bold text-blue-600">{progressPercentage}%</div>
        </div>
      </div>

      {/* Motivational Message */}
      {progressPercentage >= 100 ? (
        <div className="mt-3 text-center">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            🎉 All goals completed!
          </div>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {progressPercentage >= 75
              ? 'Almost there! 💪'
              : progressPercentage >= 50
                ? 'Great progress! 🚀'
                : progressPercentage >= 25
                  ? 'Keep going! ✍️'
                  : "Let's start writing! 📝"}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarGoalsWidget;
