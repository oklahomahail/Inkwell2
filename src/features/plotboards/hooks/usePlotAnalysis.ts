import { useCallback, useMemo } from 'react';

import devLog from "@/utils/devLog";

import aiService from '../../../services/aiPlotAnalysisService';
import { analyticsService } from '../../../services/analyticsService';
import { featureFlags } from '../../../utils/flags';
import { usePlotBoardStore } from '../store';

export function usePlotAnalysis(profileId: string, projectId: string) {
  const { boards, activeBoard, analysisByProjectId, setAnalysis } = usePlotBoardStore();

  const analysis = analysisByProjectId[projectId];

  // Get scenes from current board
  const scenes = useMemo(() => {
    if (!activeBoard || !boards[activeBoard]) return [];

    const board = boards[activeBoard];
    const allCards = board.columns.flatMap((col) => col.cards);

    // Convert cards to scenes format - use card content as scene text
    return allCards.map((card, index) => ({
      id: card.id,
      title: card.title,
      text: card.description || card.notes || card.title, // Use available text content
      order: card.order ?? index,
    }));
  }, [activeBoard, boards]);

  const run = useCallback(async () => {
    if (!featureFlags.isEnabled('aiPlotAnalysis') || scenes.length === 0) {
      console.warn('Plot analysis disabled or no scenes available');
      return;
    }

    try {
      const input = {
        profileId,
        projectId,
        scenes,
        structure: 'three_act' as const, // Default structure
      };

      devLog.debug('Running plot analysis for', scenes.length, 'scenes');
      const service: any = (aiService as any) || {};
      const result = service.analyzeBoard
        ? await service.analyzeBoard(input)
        : await service.analyzeProject(projectId, { mockMode: true });
      setAnalysis(projectId, result);

      // Track analytics
      analyticsService.track('plot_analysis_run', {
        projectId,
        scenes: scenes.length,
        model: result.model,
        qualityScore: result.qualityScore,
        issuesFound: result.issues.length,
      });

      devLog.debug('Plot analysis complete:', result);
    } catch (error) {
      console.error('Plot analysis failed:', error);

      // Track failure
      analyticsService.track('plot_analysis_failed', {
        projectId,
        scenes: scenes.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [profileId, projectId, scenes, setAnalysis]);

  return {
    analysis,
    run,
    hasScenes: scenes.length > 0,
    sceneCount: scenes.length,
    isEnabled: featureFlags.isEnabled('aiPlotAnalysis'),
  };
}
