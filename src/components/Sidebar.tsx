import React, { memo } from 'react';

import { useNavigation } from '@/context/NavContext';

type SceneLite = { id: string; title: string };
type ChapterLite = { id: string; title: string; scenes: SceneLite[] };
type ProjectLite = { id: string; title: string; chapters: ChapterLite[] };

interface SidebarProps {
  projects?: ProjectLite[];
  className?: string;
}

function Sidebar({ projects = [], className }: SidebarProps) {
  const {
    currentProjectId,
    currentChapterId,
    currentSceneId,
    navigateToProject,
    navigateToChapter,
    navigateToScene,
  } = useNavigation();

  return (
    <aside className={className ?? 'p-3 overflow-auto'}>
      <nav aria-label="Project Navigation" className="space-y-3">
        {projects.map((p) => (
          <div key={p.id}>
            <button
              type="button"
              className={`w-full text-left px-2 py-1 rounded ${currentProjectId === p.id ? 'font-semibold underline' : ''}`}
              aria-current={currentProjectId === p.id ? 'page' : undefined}
              onClick={() => navigateToProject(p.id)}
            >
              {p.title}
            </button>

            {p.chapters?.map((ch) => (
              <div key={ch.id} className="ml-3 mt-1">
                <button
                  type="button"
                  className={`w-full text-left px-2 py-1 rounded ${currentChapterId === ch.id ? 'underline' : ''}`}
                  aria-current={currentChapterId === ch.id ? 'true' : undefined}
                  onClick={() => navigateToChapter(p.id, ch.id)}
                >
                  {ch.title}
                </button>

                {ch.scenes?.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    className={`ml-4 block w-full text-left px-2 py-1 rounded ${currentSceneId === sc.id ? 'text-blue-600' : ''}`}
                    aria-current={currentSceneId === sc.id ? 'true' : undefined}
                    onClick={() => navigateToScene(p.id, ch.id, sc.id)}
                  >
                    {sc.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
