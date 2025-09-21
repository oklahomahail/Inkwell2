import React from 'react';

import { useNavigation } from '@/context/NavContext';

type Result = {
  id: string;
  projectId: string;
  chapterId: string;
  sceneId: string;
  snippet: string;
  title: string;
};

export default function SearchResults({ results }: { results: Result[] }) {
  const { navigateToScene } = useNavigation();

  return (
    <ul className="divide-y">
      {results.map((r) => (
        <li key={r.id}>
          <button
            className="w-full text-left p-2 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => navigateToScene(r.projectId, r.chapterId, r.sceneId)}
          >
            <div className="font-medium">{r.title}</div>
            <div className="text-sm opacity-75">{r.snippet}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}
