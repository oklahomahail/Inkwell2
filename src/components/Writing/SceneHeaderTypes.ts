import type { SceneStatus } from '@/types/writing';

export type SceneUpdatePayload = Partial<{
  title: string;
  status: SceneStatus;
  wordGoal: number | null;
}>;

export interface SceneHeaderProps {
  title: string;
  status?: SceneStatus;
  wordGoal?: number | null;
  words?: number;
  onChange: (patch: SceneUpdatePayload) => void;
}
