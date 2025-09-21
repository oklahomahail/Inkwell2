import React from 'react';

import { useNavigation } from '@/context/NavContext';

export default function NavInspector() {
  const nav = useNavigation();
  const { currentView, currentProjectId, currentChapterId, currentSceneId, canGoBack } = nav;

  const buildLink = () => {
    const params = new URLSearchParams();
    params.set('view', currentView);
    if (currentProjectId) params.set('project', currentProjectId);
    if (currentChapterId) params.set('chapter', currentChapterId);
    if (currentSceneId) params.set('scene', currentSceneId);
    return `${window.location.pathname}?${params.toString()}`;
  };

  return (
    <div className="p-2 text-sm rounded border border-dashed">
      <div className="font-semibold mb-1">NavInspector (dev)</div>
      <div>
        view: <b>{currentView}</b>
      </div>
      <div>
        project: <code>{currentProjectId ?? '-'}</code>
      </div>
      <div>
        chapter: <code>{currentChapterId ?? '-'}</code>
      </div>
      <div>
        scene: <code>{currentSceneId ?? '-'}</code>
      </div>
      <div>canGoBack: {String(canGoBack)}</div>
      <div className="mt-2">
        <a className="underline" href={buildLink()}>
          Copy deep-link
        </a>
      </div>
    </div>
  );
}
