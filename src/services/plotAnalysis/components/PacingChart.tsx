// Pacing Chart - Line chart showing word count per chapter

import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { PacingChartProps } from '../types.ui';

// Simple rolling average (window = 3 by default)
function rollingAvg(data: number[], window = 3) {
  const out: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(0, i - Math.floor(window / 2));
    const e = Math.min(data.length, s + window);
    const slice = data.slice(s, e);
    out.push(Math.round(slice.reduce((a, b) => a + b, 0) / slice.length));
  }
  return out;
}

export function PacingChart({
  chapters,
  highlightedChapters = [],
  showRollingAvg = true,
}: PacingChartProps) {
  const data = useMemo(() => {
    if (!chapters?.length) return [];

    const wordsArr = chapters.map((c) => c.words ?? 0);
    const avg = Math.round(wordsArr.reduce((a, b) => a + b, 0) / Math.max(1, wordsArr.length));
    const roll = showRollingAvg ? rollingAvg(wordsArr, 3) : null;

    return chapters.map((c, idx) => ({
      idx: idx + 1,
      title: c.title ?? `Chapter ${idx + 1}`,
      words: c.words ?? 0,
      avg,
      roll: roll ? roll[idx] : undefined,
      highlighted: highlightedChapters.includes(idx),
    }));
  }, [chapters, highlightedChapters, showRollingAvg]);

  if (!data.length) {
    return <div className="text-sm text-gray-500">No pacing data.</div>;
  }

  // Midpoint window as percent of chapter count
  const n = data.length;
  const mpStart = Math.max(1, Math.floor(n * 0.45));
  const mpEnd = Math.min(n, Math.ceil(n * 0.55));

  return (
    <div aria-label="Pacing by chapter">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
          <XAxis
            dataKey="idx"
            tick={{ fontSize: 12, fill: 'hsl(var(--text-2))' }}
            label={{
              value: 'Chapter',
              position: 'insideBottomRight',
              offset: -4,
              style: { fill: 'hsl(var(--text-2))' },
            }}
            interval={Math.max(0, Math.floor(n / 12))}
            stroke="hsl(var(--border-subtle))"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--text-2))' }}
            label={{
              value: 'Words',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'hsl(var(--text-2))' },
            }}
            allowDecimals={false}
            stroke="hsl(var(--border-subtle))"
          />
          <Tooltip
            formatter={(v: any, k: any) => [
              v,
              k === 'words' ? 'Words' : k === 'avg' ? 'Book Average' : 'Rolling Avg',
            ]}
            labelFormatter={(label: any) => {
              const c = chapters[label - 1];
              return `Chapter ${label} — ${c?.title ?? 'Untitled'}`;
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--surface-1))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '0.375rem',
            }}
          />

          {/* Midpoint window */}
          <ReferenceArea
            x1={mpStart}
            x2={mpEnd}
            fill="hsl(var(--ink-500))"
            fillOpacity={0.08}
            label={{ value: 'Midpoint', position: 'top', fill: 'hsl(var(--text-2))' }}
          />
          <ReferenceLine
            x={mpStart}
            stroke="hsl(var(--ink-500))"
            strokeOpacity={0.25}
            strokeDasharray="4 4"
          />
          <ReferenceLine
            x={mpEnd}
            stroke="hsl(var(--ink-500))"
            strokeOpacity={0.25}
            strokeDasharray="4 4"
          />

          {/* Average line */}
          <ReferenceLine
            y={data[0]?.avg}
            stroke="hsl(var(--text-2))"
            strokeOpacity={0.3}
            strokeDasharray="6 6"
            label={{ value: 'Avg', position: 'right', fill: 'hsl(var(--text-2))' }}
          />

          {/* Words per chapter */}
          <Line
            type="monotone"
            dataKey="words"
            stroke="hsl(var(--ink-600))"
            dot={{
              r: 3,
              strokeWidth: 1,
              fill: 'hsl(var(--ink-500))',
            }}
            activeDot={
              {
                r: 4,
                fill: 'hsl(var(--ink-600))',
              } as any
            }
            strokeWidth={2}
            isAnimationActive={false}
            name="Words"
          />

          {/* Rolling average */}
          {data.some((d) => typeof d.roll === 'number') && (
            <Line
              type="monotone"
              dataKey="roll"
              stroke="hsl(var(--ink-400))"
              strokeOpacity={0.6}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Rolling Avg"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 text-xs text-text-2">
        Shaded region marks midpoint window (45-55%). Dashed horizontal line marks book average.
      </div>
    </div>
  );
}
