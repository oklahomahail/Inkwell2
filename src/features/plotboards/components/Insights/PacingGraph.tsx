import React, { useState, useEffect } from 'react';

import type { PacingPoint } from '../../../../types/plotAnalysis';

interface PacingGraphProps {
  data: PacingPoint[];
}

function _PacingGraph({ data }: PacingGraphProps) {
  const [R, setR] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import('recharts')
      .then((mod) => {
        if (alive) setR(mod);
      })
      .catch((e) => {
        if (alive) setLoadError(String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) {
    return (
      <div className="rounded-xl border p-3">
        <h4 className="mb-2 font-medium">Pacing and Tension</h4>
        <div className="h-60 rounded border border-dashed flex items-center justify-center text-sm text-slate-500">
          Charts failed to load: {loadError}
        </div>
      </div>
    );
  }

  if (!R) {
    return (
      <div className="rounded-xl border p-3">
        <h4 className="mb-2 font-medium">Pacing and Tension</h4>
        <div className="h-60 rounded border border-dashed animate-pulse bg-slate-100" />
      </div>
    );
  }

  const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } = R;

  const chartData = data.map((d) => ({
    scene: d.index + 1,
    tension: Math.round(d.tension * 100) / 100,
    pace: Math.round(d.pace * 100) / 100,
  }));

  return (
    <div className="rounded-xl border p-3">
      <h4 className="mb-2 font-medium text-[#0C5C3D]">Pacing and Tension</h4>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="scene"
              label={{ value: 'Scene', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              domain={[0, 1]}
              label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: any, name: string) => [
                `${((value as number) * 100).toFixed(0)}%`,
                name === 'tension' ? 'Tension' : 'Pace',
              ]}
              labelFormatter={(label: number) => `Scene ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="tension"
              stroke="#D4A537"
              name="Tension"
              strokeWidth={2}
              dot={{ fill: '#D4A537', strokeWidth: 2, r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="#0C5C3D"
              name="Pace"
              strokeWidth={2}
              dot={{ fill: '#0C5C3D', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600 mt-2">
        Track how tension and pacing vary across your scenes. Ideal stories have varied rhythm with
        strategic peaks.
      </p>
    </div>
  );
}

export const PacingGraph = _PacingGraph;
