// Integration hook for Writing Goals
// File: src/hooks/useWritingGoals.ts

import { useState, useEffect, useCallback } from 'react';
import { useProjectStats } from './useProjectStats';
import { useToast } from '@/context/ToastContext';

export interface WritingGoal {
  id: string;
  type: 'daily_words' | 'daily_time' | 'weekly_words' | 'streak';
  target: number;
  current: number;
  unit: 'words' | 'minutes' | 'days';
  label: string;
  color: string;
  emoji: string;
  completed: boolean;
}

export interface WritingSession {
  date: string;
  wordCount: number;
  timeMinutes: number;
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface GoalsData {
  goals: WritingGoal[];
  currentStreak: number;
  longestStreak: number;
  todaySession: WritingSession | null;
  weeklyStats: {
    totalWords: number;
    totalMinutes: number;
    daysActive: number;
  };
}

const STORAGE_KEYS = {
  GOALS: 'inkwell_writing_goals',
  STREAK: 'inkwell_writing_streak',
  LONGEST_STREAK: 'inkwell_longest_streak',
  SESSION_PREFIX: 'inkwell_session_',
  WEEKLY_STATS: 'inkwell_weekly_stats',
};

const DEFAULT_GOALS: Omit<WritingGoal, 'current' | 'completed'>[] = [
  {
    id: 'daily_words',
    type: 'daily_words',
    target: 500,
    unit: 'words',
    label: 'Daily Words',
    color: 'text-blue-600',
    emoji: '📝',
  },
  {
    id: 'daily_time',
    type: 'daily_time',
    target: 30,
    unit: 'minutes',
    label: 'Writing Time',
    color: 'text-green-600',
    emoji: '⏰',
  },
  {
    id: 'streak',
    type: 'streak',
    target: 7,
    unit: 'days',
    label: 'Writing Streak',
    color: 'text-orange-600',
    emoji: '🔥',
  },
];

export const useWritingGoals = () => {
  const projectStatsData = useProjectStats(); // Changed from { projectStats }
  const { showToast } = useToast();

  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [todaySession, setTodaySession] = useState<WritingSession | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize goals and load data
  useEffect(() => {
    if (!isInitialized) {
      initializeGoals();
      loadStreakData();
      loadTodaySession();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update goals when project stats change
  useEffect(() => {
    if (projectStatsData && todaySession && isInitialized) {
      updateGoalsProgress();
    }
  }, [projectStatsData, todaySession, isInitialized]);

  const initializeGoals = () => {
    const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);

    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals);
        setGoals(parsedGoals);
      } catch (error) {
        console.error('Error parsing saved goals:', error);
        setGoals(createDefaultGoals());
      }
    } else {
      setGoals(createDefaultGoals());
    }
  };

  const createDefaultGoals = (): WritingGoal[] => {
    return DEFAULT_GOALS.map((goal) => ({
      ...goal,
      current: 0,
      completed: false,
    }));
  };

  const loadStreakData = () => {
    const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
    const savedLongest = localStorage.getItem(STORAGE_KEYS.LONGEST_STREAK);

    setCurrentStreak(savedStreak ? parseInt(savedStreak) : 0);
    setLongestStreak(savedLongest ? parseInt(savedLongest) : 0);
  };

  const loadTodaySession = () => {
    const today = new Date().toISOString().split('T')[0]!; // Add ! to assert non-null
    const savedSession = localStorage.getItem(`${STORAGE_KEYS.SESSION_PREFIX}${today}`);

    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setTodaySession(session);
      } catch (error) {
        console.error('Error parsing today session:', error);
        createTodaySession();
      }
    } else {
      createTodaySession();
    }
  };

  const createTodaySession = () => {
    const today = new Date().toISOString().split('T')[0]!; // Add ! to assert non-null
    const newSession: WritingSession = {
      date: today,
      wordCount: 0,
      timeMinutes: 0,
      completed: false,
    };

    setTodaySession(newSession);
    saveTodaySession(newSession);
  };

  const saveTodaySession = (session: WritingSession) => {
    localStorage.setItem(`${STORAGE_KEYS.SESSION_PREFIX}${session.date}`, JSON.stringify(session));
  };

  const updateGoalsProgress = () => {
    if (!projectStatsData || !todaySession) return;

    // Adapt to your actual projectStats interface
    const todayWords = projectStatsData.wordCount || 0; // Use wordCount directly
    const currentTime = sessionStartTime
      ? Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)
      : 0;
    const totalTimeToday = todaySession.timeMinutes + currentTime;

    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        const updatedGoal = { ...goal };

        switch (goal.type) {
          case 'daily_words':
            updatedGoal.current = todayWords;
            updatedGoal.completed = todayWords >= goal.target;
            break;
          case 'daily_time':
            updatedGoal.current = totalTimeToday;
            updatedGoal.completed = totalTimeToday >= goal.target;
            break;
          case 'streak':
            updatedGoal.current = currentStreak;
            updatedGoal.completed = currentStreak >= goal.target;
            break;
        }

        return updatedGoal;
      }),
    );
  };

  const startWritingSession = useCallback(() => {
    setSessionStartTime(new Date());
    showToast('Writing session started! 🚀', 'success');
  }, [showToast]);

  const pauseWritingSession = useCallback(() => {
    if (!sessionStartTime || !todaySession) return;

    const sessionMinutes = Math.floor((Date.now() - sessionStartTime.getTime()) / 60000);
    const updatedSession = {
      ...todaySession,
      timeMinutes: todaySession.timeMinutes + sessionMinutes,
    };

    setTodaySession(updatedSession);
    saveTodaySession(updatedSession);
    setSessionStartTime(null);

    showToast('Session paused ⏸️', 'info');
  }, [sessionStartTime, todaySession, showToast]);

  const completeWritingSession = useCallback(() => {
    if (!sessionStartTime || !todaySession) return;

    const sessionMinutes = Math.floor((Date.now() - sessionStartTime.getTime()) / 60000);
    const updatedSession = {
      ...todaySession,
      timeMinutes: todaySession.timeMinutes + sessionMinutes,
      endTime: new Date(),
    };

    setTodaySession(updatedSession);
    saveTodaySession(updatedSession);
    setSessionStartTime(null);

    checkGoalCompletions();
    updateStreak();

    showToast('Great writing session! 🎉', 'success');
  }, [sessionStartTime, todaySession, showToast]);

  const checkGoalCompletions = () => {
    goals.forEach((goal) => {
      if (goal.current >= goal.target && !goal.completed) {
        showToast(`🎉 ${goal.emoji} ${goal.label} completed!`, 'success');

        // Trigger any celebration effects
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    });
  };

  const updateStreak = () => {
    const allDailyGoalsCompleted = goals
      .filter((goal) => goal.type === 'daily_words' || goal.type === 'daily_time')
      .every((goal) => goal.current >= goal.target);

    if (allDailyGoalsCompleted && todaySession && !todaySession.completed) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      localStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());

      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
        localStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, newStreak.toString());
        showToast(`🏆 New longest streak: ${newStreak} days!`, 'success');
      }

      const completedSession = { ...todaySession, completed: true };
      setTodaySession(completedSession);
      saveTodaySession(completedSession);
    }
  };

  const updateGoalTarget = useCallback((goalId: string, newTarget: number) => {
    setGoals((prevGoals) => {
      const updatedGoals = prevGoals.map((goal) =>
        goal.id === goalId ? { ...goal, target: newTarget } : goal,
      );
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
      return updatedGoals;
    });
  }, []);

  const resetDailyGoals = useCallback(() => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => ({
        ...goal,
        current: goal.type === 'streak' ? goal.current : 0,
        completed: false,
      })),
    );
    createTodaySession();
  }, []);

  const getWeeklyStats = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalWords = 0;
    let totalMinutes = 0;
    let daysActive = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0]!; // Add ! to assert non-null
      const sessionData = localStorage.getItem(`${STORAGE_KEYS.SESSION_PREFIX}${dateString}`);

      if (sessionData) {
        try {
          const session: WritingSession = JSON.parse(sessionData);
          totalWords += session.wordCount;
          totalMinutes += session.timeMinutes;
          if (session.wordCount > 0 || session.timeMinutes > 0) {
            daysActive++;
          }
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }
    }

    return { totalWords, totalMinutes, daysActive };
  }, []);

  const getCurrentSessionTime = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
  };

  const isSessionActive = Boolean(sessionStartTime);

  const getGoalProgress = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return 0;
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getTodayProgress = () => {
    const dailyGoals = goals.filter(
      (goal) => goal.type === 'daily_words' || goal.type === 'daily_time',
    );

    if (dailyGoals.length === 0) return 0;

    const totalProgress = dailyGoals.reduce(
      (acc, goal) => acc + Math.min((goal.current / goal.target) * 100, 100),
      0,
    );

    return Math.round(totalProgress / dailyGoals.length);
  };

  // Auto-save goals when they change
  useEffect(() => {
    if (isInitialized && goals.length > 0) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }
  }, [goals, isInitialized]);

  // Check for new day and reset if needed
  useEffect(() => {
    const checkNewDay = () => {
      const today = new Date().toISOString().split('T')[0]!; // Add ! to assert non-null
      if (todaySession && todaySession.date !== today) {
        // New day detected, check if yesterday's goals were completed
        const yesterdayCompleted = goals
          .filter((goal) => goal.type !== 'streak')
          .every((goal) => goal.completed);

        if (!yesterdayCompleted && currentStreak > 0) {
          // Streak broken
          setCurrentStreak(0);
          localStorage.setItem(STORAGE_KEYS.STREAK, '0');
          showToast("Streak reset - let's start fresh today! 💪", 'info');
        }

        resetDailyGoals();
      }
    };

    const interval = setInterval(checkNewDay, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [todaySession, goals, currentStreak, resetDailyGoals, showToast]);

  return {
    // State
    goals,
    currentStreak,
    longestStreak,
    todaySession,
    isSessionActive,

    // Actions
    startWritingSession,
    pauseWritingSession,
    completeWritingSession,
    updateGoalTarget,
    resetDailyGoals,

    // Computed values
    getCurrentSessionTime,
    getGoalProgress,
    getTodayProgress,
    getWeeklyStats: getWeeklyStats(),

    // Goal completion status
    allGoalsCompleted: goals.every((goal) => goal.completed),
    dailyGoalsCompleted: goals
      .filter((goal) => goal.type === 'daily_words' || goal.type === 'daily_time')
      .every((goal) => goal.completed),
  };
};
