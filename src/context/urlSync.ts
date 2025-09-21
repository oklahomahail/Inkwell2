import { NavState } from './navTypes';

export function toUrl(state: NavState): string {
  const { activeProjectId, activeChapterId, activeSceneId, mode } = state;
  if (!activeProjectId) return '/';
  if (mode === 'search') return `/project/${activeProjectId}/search`;
  if (mode === 'timeline') return `/project/${activeProjectId}/timeline`;
  if (activeChapterId && activeSceneId) {
    return `/project/${activeProjectId}/chapter/${activeChapterId}/scene/${activeSceneId}`;
  }
  if (activeChapterId) return `/project/${activeProjectId}/chapter/${activeChapterId}`;
  return `/project/${activeProjectId}`;
}

export function fromUrl(pathname: string): Partial<NavState> {
  const parts = pathname.split('/').filter(Boolean);
  const p = (i: number) => parts[i];
  if (p(0) === 'project' && p(1)) {
    const projectId = p(1);
    if (p(2) === 'search') return { mode: 'search', activeProjectId: projectId };
    if (p(2) === 'timeline') return { mode: 'timeline', activeProjectId: projectId };
    if (p(2) === 'chapter' && p(3)) {
      const chapterId = p(3);
      if (p(4) === 'scene' && p(5)) {
        return {
          mode: 'writing',
          activeProjectId: projectId,
          activeChapterId: chapterId,
          activeSceneId: p(5),
        };
      }
      return { mode: 'overview', activeProjectId: projectId, activeChapterId: chapterId };
    }
    return { mode: 'overview', activeProjectId: projectId };
  }
  return {};
}
