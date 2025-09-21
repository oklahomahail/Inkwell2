// src/utils/legacyEventAdapter.ts
type Handlers = {
  goScene: (p: string, c: string, s: string) => void;
  goChapter: (p: string, c: string) => void;
  goProject: (p: string) => void;
};

/**
 * No-op legacy adapter:
 * If you later add an eventBus with .on/.off, wire listeners here and return an unsubscribe.
 */
export function legacyEventAdapter(_handlers: Handlers): () => void {
  // Example for later:
  // const off = eventBus.on('scene:select', ({ projectId, chapterId, sceneId }) => {
  //   _handlers.goScene(projectId, chapterId, sceneId);
  // });
  // return () => off();
  return () => {};
}

export default legacyEventAdapter;
