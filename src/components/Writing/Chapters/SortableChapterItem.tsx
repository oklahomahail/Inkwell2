import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

export default function SortableChapterItem({
  id,
  title,
  status,
  wordCount,
  onSelect,
  onDelete,
}: {
  id: string;
  title: string;
  status: string;
  wordCount: number;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="group flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50">
        <button className="truncate text-left flex-1" onClick={onSelect} title={title}>
          <div className="text-sm font-medium truncate">{title || 'Untitled'}</div>
          <div className="text-xs text-gray-500">
            {wordCount} words · {status}
          </div>
        </button>

        <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="text-xs rounded border px-1"
            title="Drag to reorder"
          >
            ≡
          </button>
          <button
            aria-label="Delete chapter"
            onClick={onDelete}
            className="text-xs rounded border px-1 hover:bg-red-50"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}
