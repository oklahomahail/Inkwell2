import { useEffect, useRef, useState } from 'react';

import { Chapters } from '@/services/chaptersService';

export function useChapterDocument(chapterId?: string) {
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const versionRef = useRef(1);
  const timerRef = useRef<number | null>(null);

  // load
  useEffect(() => {
    if (!chapterId) return;
    let alive = true;
    (async () => {
      const chapter = await Chapters.get(chapterId);
      if (alive) {
        setContent(chapter.content ?? '');
        versionRef.current = chapter.version ?? 1;
        setLastSavedAt(chapter.updatedAt ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chapterId]);

  // autosave every 8–12s
  useEffect(() => {
    if (!chapterId) return;
    const save = async () => {
      setIsSaving(true);
      try {
        await Chapters.saveDoc({ id: chapterId, content, version: ++versionRef.current });
        setLastSavedAt(new Date().toISOString());
      } finally {
        setIsSaving(false);
      }
    };
    timerRef.current = window.setInterval(save, 10000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      // flush on unmount
      if (chapterId) {
        setIsSaving(true);
        Chapters.saveDoc({ id: chapterId, content, version: ++versionRef.current }).finally(() => {
          setIsSaving(false);
        });
      }
    };
  }, [chapterId, content]);

  return { content, setContent, isSaving, lastSavedAt };
}
