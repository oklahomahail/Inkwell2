import { FeatureFlagConfig } from '../../types/featureFlags';

export const TEST_FLAGS: FeatureFlagConfig = {
  PLOT_BOARDS: {
    key: 'plotBoards',
    name: 'Plot Boards',
    description: 'Test feature',
    defaultValue: false,
    category: 'experimental',
  },
  EXPORT_WIZARD: {
    key: 'exportWizard',
    name: 'Export Wizard',
    description: 'Test feature',
    defaultValue: true,
    category: 'core',
  },
  ADVANCED_EXPORT: {
    key: 'advancedExport',
    name: 'Advanced Export',
    description: 'Test feature',
    defaultValue: false,
    category: 'experimental',
    dependencies: ['exportWizard'],
  },
  DEBUG_STATE: {
    key: 'debugState',
    name: 'Debug State',
    description: 'Test feature',
    defaultValue: false,
    category: 'debug',
  },
};
