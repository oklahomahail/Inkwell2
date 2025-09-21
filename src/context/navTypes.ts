export type NavMode = 'overview' | 'writing' | 'planning' | 'timeline' | 'search';

export interface NavError {
  type: 'project_not_found' | 'chapter_not_found' | 'scene_not_found';
  attempted: { projectId?: string; chapterId?: string; sceneId?: string };
}

export interface SearchContext {
  query: string;
  resultIds: string[];
  activeIndex?: number;
  scope: 'project' | 'chapter' | 'scene';
  timestamp: number;
  version: number;
  isRefreshing?: boolean;
}

export interface NavState {
  mode: NavMode;
  activeProjectId?: string;
  activeChapterId?: string;
  activeSceneId?: string;
  search?: SearchContext;
  history: Array<{ mode: NavMode; projectId?: string; chapterId?: string; sceneId?: string }>;
  error?: NavError;
}
