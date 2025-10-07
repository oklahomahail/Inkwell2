// src/components/Settings/UIModeToggle.tsx
import { BookOpen, Eye, EyeOff, Info, Settings, Wrench, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { analyticsService } from '../../services/analyticsService';
import { featureFlagService, UIMode } from '../../services/featureFlagService';
import { getPresetForMode, presetToFlags } from '../../services/featureFlagService.presets';
import { updateGlobalSettings, exitFirstDraftPath } from '../../state/onboarding/onboardingSlice';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface UIModeToggleProps {
  projectId?: string;
  currentMode: UIMode;
  onModeChange: (mode: UIMode) => void;
  showDescription?: boolean;
}

export function UIModeToggle({
  projectId,
  currentMode,
  onModeChange,
  showDescription = true,
}: UIModeToggleProps) {
  const [isChanging, setIsChanging] = useState(false);
  const dispatch = useDispatch();

  const handleModeChange = async (newMode: UIMode) => {
    if (newMode === currentMode || isChanging) return;

    setIsChanging(true);

    try {
      // Track the mode change
      analyticsService.track('ui_mode_changed', {
        projectId,
        fromMode: currentMode,
        toMode: newMode,
        trigger: 'settings_toggle',
      });

      // Apply feature flags for the new mode
      const preset = getPresetForMode(newMode);
      const flags = presetToFlags(preset);

      // Update feature flags
      Object.entries(flags).forEach(([flagKey, enabled]) => {
        featureFlagService.setEnabled(flagKey, enabled);
      });

      // If switching to Pro mode, exit First Draft Path
      if (newMode === 'pro' && projectId) {
        dispatch(
          exitFirstDraftPath({
            projectId,
            reason: 'ui_mode_change',
          }),
        );
      }

      // Update global preference
      dispatch(
        updateGlobalSettings({
          preferredUIMode: newMode,
        }),
      );

      // Store per-project preference if projectId is provided
      if (projectId) {
        const projectPreferences = JSON.parse(localStorage.getItem('project_ui_modes') || '{}');
        projectPreferences[projectId] = newMode;
        localStorage.setItem('project_ui_modes', JSON.stringify(projectPreferences));
      }

      onModeChange(newMode);
    } catch (error) {
      console.error('Failed to change UI mode:', error);

      analyticsService.track('ui_mode_change_failed', {
        projectId,
        fromMode: currentMode,
        toMode: newMode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Eye className="w-5 h-5" />
          <span>Interface Mode</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toggle Control */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {currentMode === 'beginner' ? (
                <BookOpen className="w-5 h-5 text-blue-600" />
              ) : (
                <Settings className="w-5 h-5 text-purple-600" />
              )}
              <div>
                <div className="font-medium">
                  {currentMode === 'beginner' ? 'Beginner Mode' : 'Pro Mode'}
                </div>
                <div className="text-sm text-gray-600">
                  {currentMode === 'beginner'
                    ? 'Simplified interface for focused writing'
                    : 'Full interface with advanced features'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Label
              htmlFor="ui-mode-toggle"
              className={`text-sm ${currentMode === 'beginner' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
            >
              Beginner
            </Label>
            <Switch
              id="ui-mode-toggle"
              checked={currentMode === 'pro'}
              onCheckedChange={(checked) => {
                handleModeChange(checked ? 'pro' : 'beginner');
              }}
              disabled={isChanging}
            />
            <Label
              htmlFor="ui-mode-toggle"
              className={`text-sm ${currentMode === 'pro' ? 'text-purple-600 font-medium' : 'text-gray-500'}`}
            >
              Pro
            </Label>
          </div>
        </div>

        {showDescription && (
          <div className="space-y-3">
            {/* Beginner Mode Features */}
            <div
              className={`p-3 rounded-lg border-2 transition-all ${
                currentMode === 'beginner'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Beginner Mode</span>
                {currentMode === 'beginner' && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex items-center text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Projects, Chapters, Scenes, Basic Notes, Export
                </div>
                <div className="flex items-center text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Focus mode enabled by default
                </div>
                <div className="flex items-center text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Simple AI assistance ("Tighten this paragraph")
                </div>
                <div className="flex items-center text-gray-500">
                  <EyeOff className="w-3 h-3 mr-2" />
                  Plot Boards, Timeline, Advanced AI hidden
                </div>
              </div>
            </div>

            {/* Pro Mode Features */}
            <div
              className={`p-3 rounded-lg border-2 transition-all ${
                currentMode === 'pro'
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">Pro Mode</span>
                {currentMode === 'pro' && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex items-center text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  All beginner features plus advanced tools
                </div>
                <div className="flex items-center text-purple-700">
                  <Wrench className="w-3 h-3 mr-2" />
                  Power Tools menu with Plot Boards, Timeline
                </div>
                <div className="flex items-center text-purple-700">
                  <Sparkles className="w-3 h-3 mr-2" />
                  Advanced AI features and model selection
                </div>
                <div className="flex items-center text-purple-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                  Character development, Templates, Bulk import
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning when changing modes */}
        {currentMode === 'pro' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Switching to Beginner mode will hide advanced features but won't delete any of your
              work. You can switch back anytime.
            </AlertDescription>
          </Alert>
        )}

        {/* Change confirmation */}
        {isChanging && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Updating interface mode...</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Compact toggle for navigation bar
export function UIModeQuickToggle({
  projectId: _projectId,
  currentMode,
  onModeChange,
}: UIModeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onModeChange(currentMode === 'beginner' ? 'pro' : 'beginner')}
      className="h-8 px-2 text-xs"
      title={`Switch to ${currentMode === 'beginner' ? 'Pro' : 'Beginner'} mode`}
    >
      {currentMode === 'beginner' ? (
        <BookOpen className="w-3 h-3 mr-1" />
      ) : (
        <Settings className="w-3 h-3 mr-1" />
      )}
      {currentMode === 'beginner' ? 'Beginner' : 'Pro'}
    </Button>
  );
}

// Hook to get the current UI mode for a project
export function useUIMode(projectId?: string): [UIMode, (mode: UIMode) => void] {
  const [currentMode, setCurrentMode] = useState<UIMode>('beginner');

  React.useEffect(() => {
    let mode: UIMode = 'beginner';

    if (projectId) {
      // Check project-specific preference first
      const projectPreferences = JSON.parse(localStorage.getItem('project_ui_modes') || '{}');
      if (projectPreferences[projectId]) {
        mode = projectPreferences[projectId];
      }
    }

    // Fall back to global preference
    if (mode === 'beginner') {
      const globalPreference = localStorage.getItem('preferred_ui_mode');
      if (globalPreference === 'pro') {
        mode = 'pro';
      }
    }

    setCurrentMode(mode);
  }, [projectId]);

  const updateMode = (newMode: UIMode) => {
    setCurrentMode(newMode);

    // Store global preference
    localStorage.setItem('preferred_ui_mode', newMode);
  };

  return [currentMode, updateMode];
}

// Settings panel integration
export function GeneralSettings({ projectId }: { projectId?: string }) {
  const [currentMode, updateMode] = useUIMode(projectId);

  return (
    <div className="space-y-6">
      <UIModeToggle
        projectId={projectId}
        currentMode={currentMode}
        onModeChange={updateMode}
        showDescription={true}
      />

      {/* Other general settings would go here */}
    </div>
  );
}
