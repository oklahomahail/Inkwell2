import { useEffect, useRef, useState } from 'react';

import { Chapters } from '@/services/chaptersService';

export function useChapterDocument(chapterId?: string) {
  const [content, setContent] = useState<string>('');
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
      await Chapters.saveDoc({ id: chapterId, content, version: ++versionRef.current });
    };
    timerRef.current = window.setInterval(save, 10000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      // flush on unmount
      if (chapterId) Chapters.saveDoc({ id: chapterId, content, version: ++versionRef.current });
    };
  }, [chapterId, content]);

  return [content, setContent] as const;
}
