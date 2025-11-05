import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useMemo } from 'react';
import { v4 as uuid } from 'uuid';

import { useChapters, chaptersActions } from '@/context/ChaptersContext';
import { Chapters } from '@/services/chaptersService';

import SortableChapterItem from './SortableChapterItem';

export default function ChapterSidebar({ projectId }: { projectId: string }) {
  const { dispatch, getChapters } = useChapters();
  const chapters = getChapters(projectId);
  const ids = useMemo(() => chapters.map((c) => c.id), [chapters]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onCreate = async () => {
    const id = uuid();
    const index = chapters.length;
    const meta = await Chapters.create({
      id,
      projectId,
      title: `Chapter ${index + 1}`,
      index,
      status: 'draft',
    });
    await Chapters.saveDoc({ id, content: '', version: 1 });
    dispatch(chaptersActions.addChapter(meta));
    dispatch(chaptersActions.setActive(id));
  };

  const onDelete = async (id: string) => {
    await Chapters.remove(id);
    dispatch(chaptersActions.remove(id, projectId));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    const orderedIds = arrayMove(ids, oldIndex, newIndex);

    dispatch(chaptersActions.reorder(projectId, orderedIds));
    await Chapters.reorder(projectId, orderedIds);
  };

  return (
    <div className="w-72 shrink-0 border-r p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Chapters</h3>
        <button
          onClick={onCreate}
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          aria-label="Create chapter"
        >
          New
        </button>
      </div>

      <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {chapters.map((c) => (
              <SortableChapterItem
                key={c.id}
                id={c.id}
                title={c.title}
                status={c.status}
                wordCount={c.wordCount}
                onSelect={() => dispatch(chaptersActions.setActive(c.id))}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
