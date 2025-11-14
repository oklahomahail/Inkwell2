// src/components/Planning/BeatChapterMapper.tsx
import React, { useMemo } from 'react';

import type { Chapter } from '@/types/project';
import type { StoryTemplate } from '@/types/storyTemplates';

interface BeatChapterMapperProps {
  template: StoryTemplate;
  chapters: Chapter[];
  beatToChapter: Record<string, string | null>;
  onChange: (updated: Record<string, string | null>) => void;
  onCreateChapterFromBeat?: (beatId: string) => void;
}

export const BeatChapterMapper: React.FC<BeatChapterMapperProps> = ({
  template,
  chapters,
  beatToChapter,
  onChange,
  onCreateChapterFromBeat,
}) => {
  const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);

  const handleSelect = (beatId: string, chapterId: string | null) => {
    onChange({
      ...beatToChapter,
      [beatId]: chapterId,
    });
  };

  const handleAutoDistribute = () => {
    if (sortedChapters.length === 0) return;

    const beats = template.beats;
    const mapping: Record<string, string | null> = {};

    beats.forEach((beat, index) => {
      const chapterIndex = Math.floor((index / beats.length) * sortedChapters.length);
      mapping[beat.id] = sortedChapters[chapterIndex]?.id ?? null;
    });

    onChange(mapping);
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Map beats to chapters</h3>
          <p className="text-xs text-slate-300">
            Connect each structural beat to a chapter, or leave it unmapped for now.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAutoDistribute}
          className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
          disabled={sortedChapters.length === 0}
        >
          Auto-distribute beats
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {template.beats.map((beat) => {
          const selectedChapterId = beatToChapter[beat.id] ?? null;

          return (
            <div
              key={beat.id}
              className="flex flex-col rounded-md border border-slate-700 bg-slate-900/80 p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-100">{beat.label}</p>
                {selectedChapterId && (
                  <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] text-emerald-200">
                    Linked
                  </span>
                )}
              </div>
              <p className="mb-2 line-clamp-2 text-[11px] text-slate-300">{beat.prompt}</p>

              <div className="flex items-center gap-2">
                <select
                  value={selectedChapterId ?? ''}
                  onChange={(e) => handleSelect(beat.id, e.target.value || null)}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                >
                  <option value="">Unmapped</option>
                  {sortedChapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.order + 1}. {chapter.title}
                    </option>
                  ))}
                </select>

                {onCreateChapterFromBeat && (
                  <button
                    type="button"
                    onClick={() => onCreateChapterFromBeat(beat.id)}
                    className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                  >
                    New chapter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
