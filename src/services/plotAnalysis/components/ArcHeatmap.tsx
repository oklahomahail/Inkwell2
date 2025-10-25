// Arc Heatmap - Grid showing presence of story beats per chapter

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { ChapterMetrics } from '../types';
import type { ArcHeatmapProps } from '../types.ui';

// Transform chapter tags to stacked bars
function toHeatmapData(chapters: ChapterMetrics[]) {
  return chapters.map((c, i) => {
    const tags = new Set((c.tags ?? []).map((t) => t.toLowerCase()));
    const setup = Number(tags.has('setup'));
    const conflict = Number(tags.has('conflict') || tags.has('inciting'));
    const turn = Number(tags.has('turn') || tags.has('complication'));
    const payoff = Number(tags.has('payoff') || tags.has('resolution') || tags.has('aftermath'));

    return {
      chapter: i + 1,
      title: c.title ?? `Chapter ${i + 1}`,
      setup,
      conflict,
      turn,
      payoff,
    };
  });
}

function ArcHeatmapComponent({ chapters }: ArcHeatmapProps) {
  const data = useMemo(() => toHeatmapData(chapters ?? []), [chapters]);

  if (!data.length) {
    return <div className="text-sm text-gray-500">No arc data.</div>;
  }

  const height = Math.max(220, data.length * 18 + 60);

  return (
    <div aria-label="Arc presence heatmap">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          barCategoryGap={4}
          barGap={0}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--border-subtle))"
          />
          <XAxis type="number" domain={[0, 4]} tick={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="chapter"
            width={64}
            tick={{ fontSize: 12, fill: 'hsl(var(--text-2))' }}
            tickFormatter={(v) => `Ch ${v}`}
            stroke="hsl(var(--border-subtle))"
          />
          <Tooltip
            formatter={(v: any, k: any) => {
              const label =
                k === 'setup'
                  ? 'Setup'
                  : k === 'conflict'
                    ? 'Conflict'
                    : k === 'turn'
                      ? 'Turn'
                      : k === 'payoff'
                        ? 'Payoff'
                        : k;
              return [v ? 'Present' : 'Missing', label];
            }}
            labelFormatter={(label: any) => {
              const c = data.find((d) => d.chapter === label);
              return `Chapter ${label} — ${c?.title ?? 'Untitled'}`;
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--surface-1))',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '0.375rem',
            }}
          />

          {/* Each bar is stacked to appear as adjacent cells */}
          <Bar
            dataKey="setup"
            stackId="arc"
            fill="hsl(var(--ink-300))"
            isAnimationActive={false}
            name="Setup"
          />
          <Bar
            dataKey="conflict"
            stackId="arc"
            fill="hsl(var(--ink-500))"
            isAnimationActive={false}
            name="Conflict"
          />
          <Bar
            dataKey="turn"
            stackId="arc"
            fill="hsl(var(--ink-700))"
            isAnimationActive={false}
            name="Turn"
          />
          <Bar
            dataKey="payoff"
            stackId="arc"
            fill="hsl(var(--gold-500))"
            isAnimationActive={false}
            name="Payoff"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 text-xs text-text-2">
        Each row is a chapter. Filled cells indicate presence of setup, conflict, turn, or payoff
        tags.
      </div>
    </div>
  );
}

// Export memoized version
export const ArcHeatmap = React.memo(ArcHeatmapComponent);
