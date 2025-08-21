// src/components/Analytics/WritingAnalyticsView.tsx
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, Target, Clock, BookOpen, Edit3, Award, Flame } from 'lucide-react';

import { useAppContext } from '@/context/AppContext';
import { EnhancedProject, WritingSession } from '@/types/project';
import { storageService } from '@/services/storageService';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className = '',
}) => (
  <div className={`analytics-card ${className}`}>
    <div className="analytics-card-header">
      <div className="analytics-card-icon">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="analytics-card-title">{title}</h3>
    </div>
    <div className="analytics-card-content">
      <div className="analytics-card-value">{value}</div>
      {trend && (
        <div className={`analytics-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          <TrendingUp className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  </div>
);

interface WritingStatsData {
  totalWords: number;
  totalChapters: number;
  totalScenes: number;
  averageWordsPerDay: number;
  writingStreak: number;
  totalWritingTime: number; // in minutes
  dailyGoalCompletion: number; // percentage
  sessions: WritingSession[];
  recentActivity: Array<{
    date: string;
    words: number;
    time: number; // minutes
    sessions: number;
  }>;
  chapterProgress: Array<{
    title: string;
    words: number;
    target: number;
    completion: number;
  }>;
  writingPace: Array<{
    week: string;
    words: number;
    avgDaily: number;
  }>;
}

// Safe date formatter to prevent errors
const formatDateTick = (dateString: any): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return String(dateString);
  }
};

// Safe tooltip label formatter
const formatTooltipLabel = (dateString: any): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Tooltip date formatting error:', error);
    return String(dateString);
  }
};

// Safe tooltip formatter
const formatTooltipValue = (value: any, name: any): [string, string] => {
  try {
    const displayName =
      name === 'words' ? 'Words' : name === 'sessions' ? 'Sessions' : String(name);
    return [String(value || 0), displayName];
  } catch (error) {
    console.warn('Tooltip value formatting error:', error);
    return [String(value || 0), String(name)];
  }
};

const WritingAnalyticsView: React.FC = () => {
  const { currentProject } = useAppContext();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Calculate analytics data
  const analyticsData = useMemo((): WritingStatsData => {
    if (!currentProject) {
      return {
        totalWords: 0,
        totalChapters: 0,
        totalScenes: 0,
        averageWordsPerDay: 0,
        writingStreak: 0,
        totalWritingTime: 0,
        dailyGoalCompletion: 0,
        sessions: [],
        recentActivity: [],
        chapterProgress: [],
        writingPace: [],
      };
    }

    try {
      const project = currentProject as unknown as EnhancedProject;
      const sessions = project.sessions || [];
      const chapters = storageService.loadWritingChapters(project.id) || [];

      // Basic stats
      const totalWords = chapters.reduce((sum, ch) => sum + (ch.totalWordCount || 0), 0);
      const totalChapters = chapters.length;
      const totalScenes = chapters.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0);
      const totalWritingTime = sessions.reduce((sum, s) => sum + (s.focusTime || 0), 0);

      // Recent activity (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentSessions = sessions.filter((s) => {
        try {
          return s.startTime && new Date(s.startTime) >= thirtyDaysAgo;
        } catch {
          return false;
        }
      });

      // Group by date
      const activityByDate = new Map<string, { words: number; time: number; sessions: number }>();

      recentSessions.forEach((session) => {
        try {
          const dateStr = new Date(session.startTime).toISOString().split('T')[0];
          if (!dateStr) return;

          const existing = activityByDate.get(dateStr) || { words: 0, time: 0, sessions: 0 };
          activityByDate.set(dateStr, {
            words: existing.words + (session.wordsAdded || 0),
            time: existing.time + (session.focusTime || 0),
            sessions: existing.sessions + 1,
          });
        } catch (error) {
          console.warn('Error processing session:', error);
        }
      });

      const recentActivity = Array.from(activityByDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter((item) => item.date); // Filter out invalid dates

      // Calculate averages and streaks
      const averageWordsPerDay =
        recentActivity.length > 0
          ? recentActivity.reduce((sum, day) => sum + (day.words || 0), 0) / recentActivity.length
          : 0;

      // Writing streak calculation
      let writingStreak = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        if (!today) throw new Error("Could not get today's date");

        const checkDate = new Date();

        while (checkDate >= thirtyDaysAgo) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (!dateStr) break;

          const dayData = activityByDate.get(dateStr);

          if (dayData && dayData.words > 0) {
            writingStreak++;
          } else if (dateStr !== today) {
            // Allow today to have no words yet
            break;
          }

          checkDate.setDate(checkDate.getDate() - 1);
        }
      } catch (error) {
        console.warn('Error calculating writing streak:', error);
        writingStreak = 0;
      }

      // Chapter progress
      const chapterProgress = chapters
        .map((chapter) => ({
          title: chapter.title || 'Untitled Chapter',
          words: chapter.totalWordCount || 0,
          target: (chapter.scenes || []).reduce(
            (sum, scene) => sum + (scene.wordCountGoal || 3000),
            0,
          ),
          completion: 0,
        }))
        .map((ch) => ({
          ...ch,
          completion: ch.target > 0 ? Math.round((ch.words / ch.target) * 100) : 0,
        }));

      // Writing pace over weeks
      const writingPace = [];
      for (let i = 0; i < 12; i++) {
        try {
          const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

          const weekSessions = sessions.filter((s) => {
            try {
              const sessionDate = new Date(s.startTime);
              return sessionDate >= weekStart && sessionDate < weekEnd;
            } catch {
              return false;
            }
          });

          const weekWords = weekSessions.reduce((sum, s) => sum + (s.wordsAdded || 0), 0);
          const avgDaily = weekWords / 7;

          writingPace.unshift({
            week: `Week ${i + 1}`,
            words: weekWords,
            avgDaily: Math.round(avgDaily),
          });
        } catch (error) {
          console.warn('Error calculating week data:', error);
        }
      }

      // Daily goal completion
      const dailyGoal = (project as any).dailyGoal || 500;
      const today = new Date().toISOString().split('T')[0];
      if (!today) throw new Error("Could not get today's date");

      const todayWords = activityByDate.get(today)?.words || 0;
      const dailyGoalCompletion = Math.round((todayWords / dailyGoal) * 100);

      return {
        totalWords,
        totalChapters,
        totalScenes,
        averageWordsPerDay: Math.round(averageWordsPerDay),
        writingStreak,
        totalWritingTime: Math.round(totalWritingTime),
        dailyGoalCompletion,
        sessions,
        recentActivity,
        chapterProgress,
        writingPace,
      };
    } catch (error) {
      console.error('Error calculating analytics data:', error);
      return {
        totalWords: 0,
        totalChapters: 0,
        totalScenes: 0,
        averageWordsPerDay: 0,
        writingStreak: 0,
        totalWritingTime: 0,
        dailyGoalCompletion: 0,
        sessions: [],
        recentActivity: [],
        chapterProgress: [],
        writingPace: [],
      };
    }
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="analytics-empty">
        <BookOpen className="analytics-empty-icon" />
        <h2>No Project Selected</h2>
        <p>Select a project to view writing analytics</p>
      </div>
    );
  }

  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <div className="analytics-view">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Writing Analytics</h1>
          <p className="analytics-subtitle">Insights for "{currentProject.name}"</p>
        </div>

        <div className="analytics-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
            className="analytics-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-metrics">
        <AnalyticsCard
          title="Total Words"
          value={analyticsData.totalWords.toLocaleString()}
          icon={Edit3}
          trend={{ value: 12, isPositive: true }}
        />

        <AnalyticsCard
          title="Writing Streak"
          value={`${analyticsData.writingStreak} days`}
          icon={Flame}
          className="streak-card"
        />

        <AnalyticsCard
          title="Daily Average"
          value={`${analyticsData.averageWordsPerDay} words`}
          icon={Target}
          trend={{ value: 8, isPositive: true }}
        />

        <AnalyticsCard
          title="Total Time"
          value={`${Math.round(analyticsData.totalWritingTime / 60)}h ${analyticsData.totalWritingTime % 60}m`}
          icon={Clock}
        />

        <AnalyticsCard title="Chapters" value={analyticsData.totalChapters} icon={BookOpen} />

        <AnalyticsCard
          title="Daily Goal"
          value={`${analyticsData.dailyGoalCompletion}%`}
          icon={Award}
          className={analyticsData.dailyGoalCompletion >= 100 ? 'goal-complete' : ''}
        />
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Daily Writing Activity */}
        <div className="analytics-chart-card">
          <div className="chart-header">
            <h3>Daily Writing Activity</h3>
            <p>Words written per day over the last 30 days</p>
          </div>
          <div className="chart-container">
            {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analyticsData.recentActivity}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={formatTooltipLabel} formatter={formatTooltipValue} />
                  <Bar dataKey="words" fill={chartColors.primary} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>No recent writing activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Writing Pace Trend */}
        <div className="analytics-chart-card">
          <div className="chart-header">
            <h3>Writing Pace Trend</h3>
            <p>Weekly word count over time</p>
          </div>
          <div className="chart-container">
            {analyticsData.writingPace && analyticsData.writingPace.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={analyticsData.writingPace}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="words"
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.secondary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>No writing pace data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Progress */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>Chapter Progress</h3>
          <p>Word count progress for each chapter</p>
        </div>

        <div className="chapter-progress-grid">
          {analyticsData.chapterProgress && analyticsData.chapterProgress.length > 0 ? (
            analyticsData.chapterProgress.map((chapter, index) => (
              <div key={index} className="chapter-progress-card">
                <div className="chapter-progress-header">
                  <h4>{chapter.title}</h4>
                  <span className="chapter-progress-percentage">{chapter.completion}%</span>
                </div>

                <div className="chapter-progress-bar">
                  <div
                    className="chapter-progress-fill"
                    style={{ width: `${Math.min(chapter.completion, 100)}%` }}
                  />
                </div>

                <div className="chapter-progress-stats">
                  <span>{chapter.words.toLocaleString()} words</span>
                  <span>Target: {chapter.target.toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="chapter-progress-empty">
              <p>No chapters found</p>
            </div>
          )}
        </div>
      </div>

      {/* Writing Sessions */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>Recent Writing Sessions</h3>
          <p>Your latest writing activities</p>
        </div>

        <div className="sessions-list">
          {analyticsData.sessions && analyticsData.sessions.length > 0 ? (
            analyticsData.sessions
              .slice(-10)
              .reverse()
              .map((session, index) => (
                <div key={index} className="session-item">
                  <div className="session-date">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {session.startTime
                        ? new Date(session.startTime).toLocaleDateString()
                        : 'Unknown date'}
                    </span>
                  </div>

                  <div className="session-stats">
                    <div className="session-stat">
                      <Edit3 className="w-4 h-4" />
                      <span>{session.wordsAdded || 0} words</span>
                    </div>

                    <div className="session-stat">
                      <Clock className="w-4 h-4" />
                      <span>{Math.round(session.focusTime || 0)} min</span>
                    </div>

                    <div className="session-productivity">
                      <TrendingUp className="w-4 h-4" />
                      <span>{Math.round((session.productivity || 0) * 100)}% productive</span>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="sessions-empty">
              <p>No writing sessions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingAnalyticsView;
