import eventBus from '@/services/eventBus';

export function legacyEventAdapter(nav: {
  goProject: (p: string) => void;
  goChapter: (p: string, c: string) => void;
  goScene: (p: string, c: string, s: string) => void;
}) {
  const onScene = ({ projectId, chapterId, sceneId }: any) =>
    nav.goScene(projectId, chapterId, sceneId);
  const onChapter = ({ projectId, chapterId }: any) => nav.goChapter(projectId, chapterId);
  const onProject = ({ projectId }: any) => nav.goProject(projectId);

  eventBus.on('scene:select', onScene);
  eventBus.on('chapter:select', onChapter);
  eventBus.on('project:select', onProject);

  return () => {
    eventBus.off('scene:select', onScene);
    eventBus.off('chapter:select', onChapter);
    eventBus.off('project:select', onProject);
  };
}
