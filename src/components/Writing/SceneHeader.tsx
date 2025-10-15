// src/components/Writing/SceneHeader.tsx
import React from 'react';

import { SCENE_STATUS } from '@/consts/writing';

import { type SceneHeaderProps, type SceneUpdatePayload } from './SceneHeaderTypes';

export const SceneHeader = _SceneHeader;

export function _SceneHeader({
  title,
  status = SCENE_STATUS.DRAFT,
  wordGoal,
  words = 0,
  onChange,
}: SceneHeaderProps) {
  const pct =
    wordGoal && wordGoal > 0 ? Math.min(100, Math.round((words / wordGoal) * 100)) : undefined;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      {/* Title input */}
      <input
        className="border rounded px-2 py-1 text-sm flex-1"
        value={title}
        onChange={(e) => onChange({ title: e.target.value } as SceneUpdatePayload)}
        placeholder="Scene title"
      />

      {/* Status dropdown */}
      <select
        className="border rounded px-2 py-1 text-sm"
        value={status}
        onChange={(e) => onChange({ status: e.target.value } as SceneUpdatePayload)}
      >
        <option value={SCENE_STATUS.DRAFT}>Draft</option>
        <option value={SCENE_STATUS.REVISION}>Revision</option>
        <option value={SCENE_STATUS.COMPLETE}>Complete</option>
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
            wordGoal: e.target.value ? Number(e.target.value) : null,
          } as SceneUpdatePayload)
        }
      />

      {/* Word stats */}
      <div className="text-sm text-gray-600">
        {words} {wordGoal ? `/ ${wordGoal} (${pct}%)` : ''}
      </div>
    </div>
  );
}
