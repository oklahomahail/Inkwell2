// src/components/Analytics/WritingAnalyticsView.tsx
import { TrendingUp, Calendar, Target, Clock, BookOpen, Award, Edit3 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import PhraseHygieneWidget from '@/components/Analytics/PhraseHygieneWidget';
import PerformanceChart from '@/components/PerformanceChart';
import { useAppContext } from '@/context/AppContext';

type Session = {
  startTime?: string;
  wordCount?: number;
  wordsAdded?: number;
  focusTime?: number;
  dateLabel?: string;
  productivity?: number;
};

export default function WritingAnalyticsView() {
  const { currentProject } = useAppContext();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Read from a defensively-typed object so we don't rely on Project having `sessions`
  const proj: any = currentProject ?? {};
  const projectName: string = typeof proj.name === 'string' ? proj.name : 'Project';

  // Stabilize sessions to prevent downstream useMemo hooks from re-computing unnecessarily
  const sessions: Session[] = useMemo(() => {
    return Array.isArray(proj.sessions) ? (proj.sessions as Session[]) : [];
  }, [proj.sessions]);

  // Daily trend rows for primary chart
  const trendRows = useMemo(() => {
    return sessions.map((s) => ({
      date: s?.dateLabel ?? (s?.startTime ? new Date(s.startTime).toLocaleDateString() : ''),
      words:
        typeof s?.wordCount === 'number'
          ? s.wordCount
          : typeof s?.wordsAdded === 'number'
            ? s.wordsAdded
            : 0,
    }));
  }, [sessions]);

  // Totals and summary metrics
  const totalWords = trendRows.reduce(
    (sum, d) => sum + (typeof d.words === 'number' ? d.words : 0),
    0,
  );
  const averageWordsPerDay = trendRows.length ? Math.round(totalWords / trendRows.length) : 0;

  const totalWritingTimeMin = sessions.reduce((sum, s) => sum + (s.focusTime ?? 0), 0);

  const writingStreak = _computeStreak(sessions);

  const todayWords = (() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      let words = 0;
      for (const s of sessions) {
        if (!s.startTime) continue;
        const d = new Date(s.startTime).toISOString().slice(0, 10);
        if (d === todayStr) {
          words += s.wordsAdded ?? s.wordCount ?? 0;
        }
      }
      return words;
    } catch {
      return 0;
    }
  })();

  const dailyGoal = typeof proj.dailyGoal === 'number' ? proj.dailyGoal : 500;
  const dailyGoalCompletion = Math.max(
    0,
    Math.min(100, Math.round((todayWords / dailyGoal) * 100)),
  );

  // Weekly pace rows (last 8 weeks)
  const weeklyRows = useMemo(() => {
    const now = new Date();
    const rows: { date: string; words: number }[] = [];

    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      let sum = 0;
      for (const s of sessions) {
        try {
          if (!s.startTime) continue;
          const d = new Date(s.startTime);
          if (d >= start && d < end) {
            sum += s.wordsAdded ?? s.wordCount ?? 0;
          }
        } catch {
          // ignore bad dates
        }
      }

      rows.push({
        date: start.toLocaleDateString(),
        words: sum,
      });
    }

    return rows;
  }, [sessions]);

  if (!currentProject) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <h2 className="text-lg font-semibold">No project selected</h2>
        <p className="text-slate-500">Select a project to view writing analytics.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Writing analytics</h1>
          <p className="text-sm text-slate-500">Insights for "{projectName}"</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="week">Last week</option>
          <option value="month">Last month</option>
          <option value="year">Last year</option>
        </select>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <_StatCard
          icon={<Edit3 className="w-4 h-4" />}
          label="Total words"
          value={totalWords.toLocaleString()}
        />
        <_StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Total time"
          value={`${Math.floor(totalWritingTimeMin / 60)}h ${totalWritingTimeMin % 60}m`}
        />
        <_StatCard
          icon={<Target className="w-4 h-4" />}
          label="Daily average"
          value={`${averageWordsPerDay} words`}
        />
        <_StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Streak"
          value={`${writingStreak} days`}
        />
        <_StatCard
          icon={<BookOpen className="w-4 h-4" />}
          label="Sessions"
          value={sessions.length}
        />
        <_StatCard
          icon={<Award className="w-4 h-4" />}
          label="Daily goal"
          value={`${dailyGoalCompletion}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h3 className="font-medium">Words over time</h3>
          </div>
          <PerformanceChart type="trend" rows={trendRows} xKey="date" yKey="words" height={280} />
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="font-medium">Weekly pace</h3>
          </div>
          <PerformanceChart
            type="comparison"
            rows={weeklyRows}
            xKey="date"
            yKey="words"
            height={280}
          />
        </div>

        {/* Phrase Hygiene Widget */}
        <div className="rounded-2xl border-0">
          <PhraseHygieneWidget className="border-0" />
        </div>
      </div>
    </div>
  );
}

function _computeStreak(sessions: Session[]): number {
  try {
    const dayHasWords = new Set<string>();
    for (const s of sessions) {
      if (!s.startTime) continue;
      const dateStr = new Date(s.startTime).toISOString().slice(0, 10);
      const words = s.wordsAdded ?? s.wordCount ?? 0;
      if (words > 0) dayHasWords.add(dateStr);
    }

    let streak = 0;
    const cur = new Date();
    while (true) {
      const key = cur.toISOString().slice(0, 10);
      const isToday = key === new Date().toISOString().slice(0, 10);
      if (dayHasWords.has(key) || isToday) {
        streak++;
        cur.setDate(cur.getDate() - 1);
        continue;
      }
      break;
    }
    return streak;
  } catch {
    return 0;
  }
}

function _StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-slate-500 text-sm flex items-center gap-2 mb-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
