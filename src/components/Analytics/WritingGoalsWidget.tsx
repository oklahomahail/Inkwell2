// Writing Goals Widget - Add to your existing analytics system
// File: src/components/Analytics/WritingGoalsWidget.tsx

import React, { useState, useEffect } from 'react';
import { Target, Flame, Timer, Trophy, CheckCircle, Settings, Star } from 'lucide-react';

import { useProjectStats } from '@/hooks/useProjectStats';
import { useToast } from '@/context/ToastContext';

interface WritingGoal {
  id: string;
  type: 'daily_words' | 'daily_time' | 'weekly_words' | 'streak';
  target: number;
  current: number;
  unit: 'words' | 'minutes' | 'days';
  label: string;
  color: string;
  emoji: string;
}

interface WritingSession {
  date: string;
  wordCount: number;
  timeMinutes: number;
  completed: boolean;
}

interface WritingGoalsWidgetProps {
  className?: string;
  compact?: boolean; // For sidebar vs full dashboard view
}

const WritingGoalsWidget: React.FC<WritingGoalsWidgetProps> = ({
  className = '',
  compact = false,
}) => {
  const projectStatsData = useProjectStats(); // Changed from { projectStats }
  const { showToast } = useToast();

  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [todaySession, setTodaySession] = useState<WritingSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Initialize default goals
  useEffect(() => {
    const defaultGoals: WritingGoal[] = [
      {
        id: 'daily_words',
        type: 'daily_words',
        target: 500,
        current: 0,
        unit: 'words',
        label: 'Daily Words',
        color: 'text-blue-600',
        emoji: '📝',
      },
      {
        id: 'daily_time',
        type: 'daily_time',
        target: 30,
        current: 0,
        unit: 'minutes',
        label: 'Daily Writing Time',
        color: 'text-green-600',
        emoji: '⏰',
      },
      {
        id: 'streak',
        type: 'streak',
        target: 7,
        current: 0,
        unit: 'days',
        label: 'Writing Streak',
        color: 'text-orange-600',
        emoji: '🔥',
      },
    ];

    // Load from localStorage or use defaults
    const savedGoals = localStorage.getItem('inkwell_writing_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      setGoals(defaultGoals);
    }

    loadTodaySession();
    loadStreakData();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: number; // Changed from NodeJS.Timeout
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  // Update goals based on project stats
  useEffect(() => {
    if (projectStatsData) {
      updateGoalsProgress();
    }
  }, [projectStatsData, todaySession, sessionTimer, currentStreak]); // Added missing dependencies

  const loadTodaySession = () => {
    const today = new Date().toISOString().split('T')[0]!; // Add ! to assert non-null
    const savedSession = localStorage.getItem(`inkwell_session_${today}`);

    if (savedSession) {
      setTodaySession(JSON.parse(savedSession));
    } else {
      const newSession: WritingSession = {
        date: today,
        wordCount: 0,
        timeMinutes: 0,
        completed: false,
      };
      setTodaySession(newSession);
      localStorage.setItem(`inkwell_session_${today}`, JSON.stringify(newSession));
    }
  };

  const loadStreakData = () => {
    const savedStreak = localStorage.getItem('inkwell_writing_streak');
    const savedLongest = localStorage.getItem('inkwell_longest_streak');

    if (savedStreak) setCurrentStreak(parseInt(savedStreak));
    if (savedLongest) setLongestStreak(parseInt(savedLongest));
  };

  const updateGoalsProgress = () => {
    if (!projectStatsData || !todaySession) return;

    // Adapt to your actual projectStats interface
    const todayWords = projectStatsData.wordCount || 0; // Use wordCount directly
    const todayMinutes = Math.floor(sessionTimer / 60) + todaySession.timeMinutes;

    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        switch (goal.type) {
          case 'daily_words':
            return { ...goal, current: todayWords };
          case 'daily_time':
            return { ...goal, current: todayMinutes };
          case 'streak':
            return { ...goal, current: currentStreak };
          default:
            return goal;
        }
      }),
    );
  };

  const startWritingSession = () => {
    setIsTimerRunning(true);
    showToast('Writing session started! 🚀', 'success');
  };

  const pauseWritingSession = () => {
    setIsTimerRunning(false);
    saveTodaySession();
    showToast('Session paused ⏸️', 'info');
  };

  const completeWritingSession = () => {
    setIsTimerRunning(false);
    saveTodaySession();
    checkGoalCompletion();
    updateStreak();
    showToast('Great writing session! 🎉', 'success');
  };

  const saveTodaySession = () => {
    if (!todaySession) return;

    const updatedSession = {
      ...todaySession,
      timeMinutes: Math.floor(sessionTimer / 60) + todaySession.timeMinutes,
      wordCount: projectStatsData?.wordCount || 0, // Fixed: use projectStatsData
    };

    setTodaySession(updatedSession);
    localStorage.setItem(`inkwell_session_${updatedSession.date}`, JSON.stringify(updatedSession));
  };

  const checkGoalCompletion = () => {
    goals.forEach((goal) => {
      if (goal.current >= goal.target && !todaySession?.completed) {
        showToast(`🎉 ${goal.emoji} ${goal.label} completed!`, 'success');

        // Trigger celebration animation
        celebrateGoalCompletion(goal);
      }
    });
  };

  const celebrateGoalCompletion = (goal: WritingGoal) => {
    // Add confetti or celebration animation here
    console.log(`Goal completed: ${goal.label}`);
  };

  const updateStreak = () => {
    const allGoalsCompleted = goals.every((goal) => goal.current >= goal.target);

    if (allGoalsCompleted && !todaySession?.completed) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);

      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
        localStorage.setItem('inkwell_longest_streak', newStreak.toString());
        showToast(`🏆 New longest streak: ${newStreak} days!`, 'success');
      }

      localStorage.setItem('inkwell_writing_streak', newStreak.toString());

      if (todaySession) {
        const completedSession = { ...todaySession, completed: true };
        setTodaySession(completedSession);
        localStorage.setItem(
          `inkwell_session_${completedSession.date}`,
          JSON.stringify(completedSession),
        );
      }
    }
  };

  const updateGoalTarget = (goalId: string, newTarget: number) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, target: newTarget } : goal)),
    );
    localStorage.setItem('inkwell_writing_goals', JSON.stringify(goals));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (compact) {
    // Compact sidebar version
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Target size={16} />
            Today's Goals
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Settings size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {goals.slice(0, 2).map((goal) => {
            const percentage = getProgressPercentage(goal.current, goal.target);
            return (
              <div key={goal.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <span>{goal.emoji}</span>
                    <span className="text-gray-600 dark:text-gray-400">{goal.label}</span>
                  </span>
                  <span className={`font-medium ${goal.color}`}>
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Streak indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Streak</span>
            </div>
            <span className="font-bold text-orange-600">{currentStreak} days</span>
          </div>

          {/* Quick session timer */}
          <div className="flex items-center gap-2 pt-2">
            <Timer size={14} className="text-green-500" />
            <span className="text-sm font-mono">{formatTime(sessionTimer)}</span>
            <button
              onClick={isTimerRunning ? pauseWritingSession : startWritingSession}
              className={`ml-auto px-2 py-1 text-xs rounded ${
                isTimerRunning
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full dashboard version
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="text-blue-600" />
          Writing Goals
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-full">
            <Flame size={16} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {currentStreak} day streak
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {goals.map((goal) => {
          const percentage = getProgressPercentage(goal.current, goal.target);
          const isCompleted = percentage >= 100;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{goal.emoji}</span>
                {isCompleted && <CheckCircle className="text-green-600" size={20} />}
              </div>

              <h3 className="font-medium text-gray-900 dark:text-white mb-1">{goal.label}</h3>

              <div className="flex items-end gap-1 mb-3">
                <span className={`text-2xl font-bold ${goal.color}`}>{goal.current}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  / {goal.target} {goal.unit}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {percentage.toFixed(0)}% complete
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Timer */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Timer className="text-blue-600" />
              Writing Session
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your focused writing time
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
              {formatTime(sessionTimer)}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={isTimerRunning ? pauseWritingSession : startWritingSession}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isTimerRunning
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isTimerRunning ? 'Pause' : 'Start Writing'}
              </button>
              {sessionTimer > 0 && (
                <button
                  onClick={completeWritingSession}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <Trophy className="text-yellow-600" size={16} />
            Best Streak
          </h4>
          <div className="text-2xl font-bold text-yellow-600">{longestStreak} days</div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <Star className="text-purple-600" size={16} />
            Today's Progress
          </h4>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(
              goals.reduce(
                (acc, goal) => acc + getProgressPercentage(goal.current, goal.target),
                0,
              ) / goals.length,
            )}
            %
          </div>
        </div>
      </div>

      {/* Goal Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Goal Settings</h3>

            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>{goal.emoji}</span>
                    <span>{goal.label}</span>
                  </span>
                  <input
                    type="number"
                    value={goal.target}
                    onChange={(e) => updateGoalTarget(goal.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    min="1"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('inkwell_writing_goals', JSON.stringify(goals));
                  setShowSettings(false);
                  showToast('Goals updated! 🎯', 'success');
                }}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingGoalsWidget;
