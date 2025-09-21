import { useNavigation } from '@/context/NavContext';
export function useDeepLinkHandler() {
  const nav = useNavigation();
  return (url: string) => {
    try {
      const u = new URL(url, window.location.origin);
      const p = u.searchParams;
      const view = (p.get('view') ?? 'dashboard') as any;
      const project = p.get('project') ?? undefined;
      const chapter = p.get('chapter') ?? undefined;
      const scene = p.get('scene') ?? undefined;

      if (scene && chapter && project) nav.navigateToScene(project, chapter, scene);
      else if (chapter && project) nav.navigateToChapter(project, chapter);
      else if (project) nav.navigateToProject(project);
      nav.navigateToView(view);
    } catch {}
  };
}
