# Chapter Management Integration Examples

## Quick Start: Using ChapterWritingPanel

The simplest way to add chapter management to your app is to use the `ChapterWritingPanel` component:

```tsx
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import ChapterWritingPanel from '@/components/Writing/ChapterWritingPanel';

function WritingView() {
  const { currentProject } = useAppContext();

  if (!currentProject) {
    return <div>No project selected</div>;
  }

  return <ChapterWritingPanel projectId={currentProject.id} />;
}

export default WritingView;
```

## Dashboard Integration

Add chapter count to your dashboard:

```tsx
import React from 'react';
import { useChapters } from '@/context/ChaptersContext';
import { useAppContext } from '@/context/AppContext';

function DashboardPanel() {
  const { currentProject } = useAppContext();
  const { getChapterCount } = useChapters();

  if (!currentProject) return null;

  const chapterCount = getChapterCount(currentProject.id);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Chapters</h3>
        <p className="text-3xl font-bold">{chapterCount}</p>
      </div>
      {/* Other stats... */}
    </div>
  );
}
```

## Analytics Integration

Get chapter-based word counts for analytics:

```tsx
import React from 'react';
import { useChapters } from '@/context/ChaptersContext';
import { useAppContext } from '@/context/AppContext';

function AnalyticsPanel() {
  const { currentProject } = useAppContext();
  const { getChapters } = useChapters();

  if (!currentProject) return null;

  const chapters = getChapters(currentProject.id);
  const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const avgWordsPerChapter = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;

  return (
    <div>
      <h2>Writing Analytics</h2>
      <div className="stats">
        <p>Total Words: {totalWords.toLocaleString()}</p>
        <p>Total Chapters: {chapters.length}</p>
        <p>Avg Words/Chapter: {avgWordsPerChapter.toLocaleString()}</p>
      </div>

      <h3>Chapter Breakdown</h3>
      <ul>
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            {chapter.title} - {chapter.wordCount} words ({chapter.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Custom Chapter Sidebar Usage

If you want to build a custom UI but still use the chapter sidebar:

```tsx
import React from 'react';
import ChapterSidebar from '@/components/Writing/Chapters/ChapterSidebar';
import { useChapters } from '@/context/ChaptersContext';
import { useChapterDocument } from '@/hooks/useChapterDocument';

function CustomWritingPanel({ projectId }: { projectId: string }) {
  const { getActiveChapter } = useChapters();
  const activeChapter = getActiveChapter();
  const [content, setContent] = useChapterDocument(activeChapter?.id);

  return (
    <div className="flex h-full">
      <ChapterSidebar projectId={projectId} />

      <div className="flex-1 p-6">
        {activeChapter ? (
          <>
            <h1>{activeChapter.title}</h1>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full"
            />
          </>
        ) : (
          <p>Select a chapter to start writing</p>
        )}
      </div>
    </div>
  );
}
```

## Programmatic Chapter Management

Use the context actions directly:

```tsx
import React from 'react';
import { useChapters, chaptersActions } from '@/context/ChaptersContext';
import { Chapters } from '@/services/chaptersService';
import { v4 as uuid } from 'uuid';

function ChapterManager({ projectId }: { projectId: string }) {
  const { dispatch, getChapters } = useChapters();

  const createChapter = async (title: string) => {
    const id = uuid();
    const chapters = getChapters(projectId);

    const meta = await Chapters.create({
      id,
      projectId,
      title,
      index: chapters.length,
      status: 'draft',
    });

    await Chapters.saveDoc({ id, content: '', version: 1 });
    dispatch(chaptersActions.addChapter(meta));
    dispatch(chaptersActions.setActive(id));
  };

  const updateChapterTitle = async (chapterId: string, newTitle: string) => {
    const meta = await Chapters.getMeta(chapterId);
    if (!meta) return;

    const updated = await Chapters.updateMeta({
      id: chapterId,
      title: newTitle,
    });

    dispatch(chaptersActions.updateMeta(updated));
  };

  const deleteChapter = async (chapterId: string) => {
    await Chapters.remove(chapterId);
    dispatch(chaptersActions.remove(chapterId, projectId));
  };

  return (
    <div>
      <button onClick={() => createChapter('New Chapter')}>Add Chapter</button>
      {/* More controls... */}
    </div>
  );
}
```

## Import Existing Content

Use the split functionality programmatically:

```tsx
import React from 'react';
import { splitDocumentIntoChapters } from '@/utils/chapterImporter';
import { useChapters, chaptersActions } from '@/context/ChaptersContext';
import { Chapters } from '@/services/chaptersService';
import { v4 as uuid } from 'uuid';

function ImportManager({ projectId, manuscript }: { projectId: string; manuscript: string }) {
  const { dispatch } = useChapters();

  const importFromManuscript = async () => {
    const pieces = splitDocumentIntoChapters(manuscript);

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (!piece) continue;

      const id = uuid();
      const meta = await Chapters.create({
        id,
        projectId,
        title: piece.title,
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
  };

  return <button onClick={importFromManuscript}>Import Manuscript as Chapters</button>;
}
```

## Export Integration

Export chapters for download:

```tsx
import React from 'react';
import { useChapters } from '@/context/ChaptersContext';
import { Chapters } from '@/services/chaptersService';

function ExportManager({ projectId }: { projectId: string }) {
  const { getChapters } = useChapters();

  const exportAsMarkdown = async () => {
    const chapters = getChapters(projectId);
    let markdown = '';

    for (const chapter of chapters) {
      const fullChapter = await Chapters.get(chapter.id);
      markdown += `# ${fullChapter.title}\n\n`;
      markdown += fullChapter.content;
      markdown += '\n\n---\n\n';
    }

    // Create download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manuscript.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={exportAsMarkdown}>Export as Markdown</button>;
}
```

## Chapter Progress Tracking

Track writing progress by chapter:

```tsx
import React from 'react';
import { useChapters } from '@/context/ChaptersContext';

function ChapterProgress({ projectId }: { projectId: string }) {
  const { getChapters } = useChapters();
  const chapters = getChapters(projectId);

  const targetWordsPerChapter = 3000;

  return (
    <div>
      <h2>Chapter Progress</h2>
      {chapters.map((chapter) => {
        const progress = Math.min(100, (chapter.wordCount / targetWordsPerChapter) * 100);

        return (
          <div key={chapter.id} className="mb-4">
            <div className="flex justify-between mb-1">
              <span>{chapter.title}</span>
              <span>
                {chapter.wordCount} / {targetWordsPerChapter} words
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## Tips

1. **Always check for currentProject** before using chapter hooks/components
2. **Load chapters on mount** using the loadForProject action
3. **Use selectors** (getChapters, getActiveChapter, getChapterCount) instead of accessing state directly
4. **Autosave is automatic** when using useChapterDocument hook
5. **Word counts update automatically** when content changes
6. **Reordering is persistent** - no need for manual save after drag-and-drop
