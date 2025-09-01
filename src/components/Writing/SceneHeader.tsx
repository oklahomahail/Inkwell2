// src/components/Writing/SceneHeader.tsx
import React from 'react';

import { SceneStatus } from '@/types/writing';

export function SceneHeader({
  title,
  status = SceneStatus.DRAFT,
  wordGoal,
  words = 0,
  onChange,
}: {
  title: string;
  status?: SceneStatus;
  wordGoal?: number;
  words?: number;
  onChange: (
    patch: Partial<{
      title: string;
      status: SceneStatus;
      wordGoal: number;
    }>,
  ) => void;
}) {
  const pct =
    wordGoal && wordGoal > 0 ? Math.min(100, Math.round((words / wordGoal) * 100)) : undefined;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      {/* Title input */}
      <input
        className="border rounded px-2 py-1 text-sm flex-1"
        value={title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Scene title"
      />

      {/* Status dropdown */}
      <select
        className="border rounded px-2 py-1 text-sm"
        value={status}
        onChange={(e) => onChange({ status: e.target.value as SceneStatus })}
      >
        <option value={SceneStatus.DRAFT}>Draft</option>
        <option value={SceneStatus.REVISION}>Revision</option>
        <option value={SceneStatus.COMPLETE}>Complete</option>
      </select>

      {/* Word goal input */}
      <input
        className="w-24 border rounded px-2 py-1 text-sm"
        type="number"
        min={0}
        placeholder="Goal"
        value={wordGoal ?? ''}
        onChange={(e) =>
          onChange({
            wordGoal: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />

      {/* Word stats */}
      <div className="text-sm text-gray-600">
        {words} {wordGoal ? `/ ${wordGoal} (${pct}%)` : ''}
      </div>
    </div>
  );
}
