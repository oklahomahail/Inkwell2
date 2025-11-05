import React from 'react';
import { v4 as uuid } from 'uuid';

import { useChapters, chaptersActions } from '@/context/ChaptersContext';
import { Chapters } from '@/services/chaptersService';
import { splitDocumentIntoChapters } from '@/utils/chapterImporter';

function SplitIntoChaptersButton({
  projectId,
  editorContent,
  onClearMonolith,
}: {
  projectId: string;
  editorContent: string;
  onClearMonolith?: () => void; // optional callback to clear old doc
}) {
  const { dispatch, getChapters } = useChapters();
  const existing = getChapters(projectId);

  if (existing.length > 0) return null;

  const run = async () => {
    const pieces = splitDocumentIntoChapters(editorContent);
    if (!pieces.length) return;

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (!piece) continue;

      const id = uuid();
      const meta = await Chapters.create({
        id,
        projectId,
        title: piece.title || `Chapter ${i + 1}`,
        index: i,
        status: 'draft',
      });
      await Chapters.saveDoc({ id, content: piece.content, version: 1 });
      dispatch(chaptersActions.addChapter(meta));
    }
    const firstChapter = await Chapters.list(projectId);
    if (firstChapter[0]) {
      dispatch(chaptersActions.setActive(firstChapter[0].id));
    }
    onClearMonolith?.(); // optional: clear the big editor body now that content moved
  };

  return (
    <button
      onClick={run}
      className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
      title="Split the current document into chapters using headings"
    >
      Split into Chapters
    </button>
  );
}

export default SplitIntoChaptersButton;
