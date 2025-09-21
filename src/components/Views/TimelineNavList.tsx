import React from 'react';

import { useNavigation } from '@/context/NavContext';

export type TimelineEventLite = {
  id: string;
  label: string;
  projectId: string;
  chapterId?: string;
  sceneId?: string;
};

export default function TimelineNavList({ events }: { events: TimelineEventLite[] }) {
  const { navigateToScene, currentSceneId } = useNavigation();

  return (
    <div className="p-3 space-y-2">
      {events.map((e) => {
        const isActive = currentSceneId && e.sceneId === currentSceneId;
        return (
          <button
            key={e.id}
            className={`block w-full text-left p-2 rounded ${isActive ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            onClick={() =>
              e.sceneId && e.chapterId && navigateToScene(e.projectId, e.chapterId, e.sceneId)
            }
            disabled={!e.sceneId || !e.chapterId}
            aria-current={isActive ? 'true' : undefined}
          >
            {e.label}
          </button>
        );
      })}
    </div>
  );
}
