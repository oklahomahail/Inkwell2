import React from 'react';

import type { ConflictCell } from '../../../../types/plotAnalysis';

interface ConflictHeatmapProps {
  data: ConflictCell[];
}

export function _ConflictHeatmap({ data }: ConflictHeatmapProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl border p-3">
        <h4 className="mb-2 font-medium text-[#0C5C3D]">Conflict Density</h4>
        <div className="h-40 flex items-center justify-center text-sm text-gray-500">
          No conflict data available
        </div>
      </div>
    );
  }

  // Calculate grid dimensions
  const rows = Math.max(...data.map((c) => c.row)) + 1 || 1;
  const cols = Math.max(...data.map((c) => c.col)) + 1 || 1;

  // Build grid matrix
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  data.forEach((c) => {
    if (c.row < rows && c.col < cols && grid[c.row]) {
      grid[c.row]![c.col] = c.value;
    }
  });

  // Generate colors based on Inkwell brand palette
  const getHeatColor = (value: number): string => {
    if (value === 0) return 'bg-gray-50 border-gray-200';

    const intensity = Math.min(value, 1);
    if (intensity < 0.3) return 'bg-[#D4A537]/20 border-[#D4A537]/30';
    if (intensity < 0.7) return 'bg-[#D4A537]/50 border-[#D4A537]/60';
    return 'bg-[#D4A537]/80 border-[#D4A537]';
  };

  return (
    <div className="rounded-xl border p-3">
      <h4 className="mb-2 font-medium text-[#0C5C3D]">Conflict Density</h4>

      {/* Grid Display */}
      <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {grid.flatMap((row, _rIdx) =>
          row.map((val, _cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`aspect-square border rounded-sm transition-colors ${getHeatColor(val)}`}
              title={`Act ${rIdx + 1}, Beat ${cIdx + 1}: ${(val * 100).toFixed(0)}% conflict density`}
            />
          )),
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <span>Low</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-[#D4A537]/20 border border-[#D4A537]/30 rounded-sm" />
            <div className="w-3 h-3 bg-[#D4A537]/50 border border-[#D4A537]/60 rounded-sm" />
            <div className="w-3 h-3 bg-[#D4A537]/80 border border-[#D4A537] rounded-sm" />
          </div>
          <span>High</span>
        </div>
        <span className="text-gray-500">Conflict Intensity</span>
      </div>

      <p className="text-xs text-gray-600 mt-2">
        Darker cells indicate higher conflict density. Good stories balance intense moments with
        quieter beats.
      </p>
    </div>
  );
}
