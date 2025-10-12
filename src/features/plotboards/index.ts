// Plot Boards feature exports with feature flag integration

import { withFeatureFlag } from '../../utils/flags';

import { PlotBoards as PlotBoardsComponent } from './components/PlotBoards';

// Export the feature-flagged component
export const PlotBoards = withFeatureFlag('plotBoards', PlotBoardsComponent);

// Export other components for direct use (when feature is enabled)
export { PlotBoard, PlotCard, PlotColumn } from './components';
export { usePlotBoardStore, initializePlotBoardStore } from './store';
export { usePlotBoardIntegration } from './hooks/usePlotBoardIntegration';
export * from './types';
export * from './utils/integration';

// Feature metadata for navigation and discovery
export const PLOT_BOARDS_FEATURE = {
  key: 'plotBoards',
  name: 'Plot Boards',
  description: 'Kanban-style plot and scene organization boards',
  category: 'experimental' as const,
  icon: '🎭',
  route: '/plot-boards',
  requiresFeatureFlag: true,
};
