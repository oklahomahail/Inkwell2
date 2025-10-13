import { SceneStatus } from '@/types/writing';

export type Position = 'absolute' | 'fixed' | 'relative';

export interface ClaudeToolbarProps {
  selectedText: string;
  onInsertText: (text: string) => void;
  sceneTitle?: string;
  currentContent?: string;
  position?: Position;
  popupPosition?: Position;
}

export interface SceneHeaderProps {
  title: string;
  status?: SceneStatus;
  wordGoal?: number | null;
  words?: number;
  onChange: (
    patch: Partial<{
      title: string;
      status: SceneStatus;
      wordGoal: number | null;
    }>,
  ) => void;
}
