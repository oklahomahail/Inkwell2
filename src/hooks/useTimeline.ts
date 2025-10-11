import { useMemo, useState, useCallback } from 'react';

export interface TimelineItem {
  id: string;
  label: string;
  timestamp: number; // ms epoch
  notes?: string;
}

export interface UseTimelineResult {
  items: TimelineItem[];
  add: (_item: TimelineItem) => void;
  remove: (_id: string) => void;
  clear: () => void;
}

export default function _useTimeline(initial: TimelineItem[] = []): UseTimelineResult {
  const [items, setItems] = useState<TimelineItem[]>(() =>
    [...initial].sort((a, _b) => a.timestamp - b.timestamp),
  );

  const add = useCallback((item: TimelineItem) => {
    setItems((prev) => [...prev, item].sort((a, _b) => a.timestamp - b.timestamp));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return useMemo(() => ({ items, add, remove, clear }), [items, add, remove, clear]);
}
