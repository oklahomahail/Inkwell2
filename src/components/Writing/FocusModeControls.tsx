// src/components/Writing/FocusModeControls.tsx
import React, { useState } from 'react';
import { Play, Pause, Square, Settings, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

import { useAdvancedFocusMode } from '../../hooks/useAdvancedFocusMode';

interface FocusModeControlsProps {
  currentWordCount: number;
}

export const FocusModeControls: React.FC<FocusModeControlsProps> = ({ currentWordCount }) => {
  const {
    isFocusMode,
    toggleFocusMode,
    settings,
    updateSettings,
    sprintSettings,
    updateSprintSettings,
    sprint,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    updateSprintWordCount,
    sprintProgress,
    wordsProgress,
    isMuted,
    toggleMute,
    ambientSounds,
    formatTime,
  } = useAdvancedFocusMode();

  const [showSettings, setShowSettings] = useState(false);

  // Update sprint word count when component receives new word count
  React.useEffect(() => {
    if (sprint.isActive) {
      updateSprintWordCount(currentWordCount);
    }
  }, [currentWordCount, sprint.isActive, updateSprintWordCount]);

  const handleSprintToggle = () => {
    if (!sprint.isActive) {
      startSprint(currentWordCount);
    } else if (sprint.isPaused) {
      resumeSprint();
    } else {
      pauseSprint();
    }
  };

  const wordsWritten = sprint.isActive ? currentWordCount - sprint.wordsAtStart : 0;

  return (
    <>
      {/* Focus Mode Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleFocusMode}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isFocusMode
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && (
        <FocusModeOverlay
          settings={settings}
          updateSettings={updateSettings}
          sprintSettings={sprintSettings}
          updateSprintSettings={updateSprintSettings}
          sprint={sprint}
          sprintProgress={sprintProgress}
          wordsProgress={wordsProgress}
          wordsWritten={wordsWritten}
          isMuted={isMuted}
          toggleMute={toggleMute}
          ambientSounds={ambientSounds}
          formatTime={formatTime}
          onSprintToggle={handleSprintToggle}
          onStopSprint={stopSprint}
          onExitFocus={toggleFocusMode}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <FocusSettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          sprintSettings={sprintSettings}
          updateSprintSettings={updateSprintSettings}
          ambientSounds={ambientSounds}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

// Focus Mode Overlay Component
interface FocusModeOverlayProps {
  settings: any;
  updateSettings: (settings: any) => void;
  sprintSettings: any;
  updateSprintSettings: (settings: any) => void;
  sprint: any;
  sprintProgress: number;
  wordsProgress: number;
  wordsWritten: number;
  isMuted: boolean;
  toggleMute: () => void;
  ambientSounds: any[];
  formatTime: (seconds: number) => string;
  onSprintToggle: () => void;
  onStopSprint: () => void;
  onExitFocus: () => void;
}

const FocusModeOverlay: React.FC<FocusModeOverlayProps> = ({
  settings,
  sprint,
  sprintProgress,
  wordsProgress,
  wordsWritten,
  isMuted,
  toggleMute,
  formatTime,
  onSprintToggle,
  onStopSprint,
  onExitFocus,
}) => {
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Top Controls Bar */}
      <div 
        className={`w-full bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Sprint Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSprintToggle}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {!sprint.isActive ? (
                  <>
                    <Play className="w-4 h-4" />
                    Start Sprint
                  </>
                ) : sprint.isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </button>

              {sprint.isActive && (
                <button
                  onClick={onStopSprint}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              )}
            </div>

            {/* Audio Controls */}
            <button
              onClick={toggleMute}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {showControls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={onExitFocus}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Exit Focus
            </button>
          </div>
        </div>

        {/* Sprint Status */}
        {sprint.isActive && (
          <div className="px-4 pb-4">
            <div className="bg-black bg-opacity-30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">
                  Sprint: {formatTime(sprint.remainingTime)}
                </span>
                <span className="text-white">
                  {wordsWritten}/{sprint.target} words
                </span>
              </div>
              
              {/* Progress Bars */}
              <div className="space-y-2">
                <div className="bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <div className="bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${wordsProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* This is where the TipTap editor would be rendered */}
          <div className="min-h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* Editor content placeholder */}
              <p className="text-gray-500 text-center">
                Your writing editor will be rendered here in focus mode.
                <br />
                <span className="text-sm">
                  Press Escape to exit, Ctrl+Shift+S to start sprint, Ctrl+Shift+M to toggle audio
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar (minimal) */}
      {!settings.zenMode && (
        <div className="bg-black bg-opacity-30 backdrop-blur-sm p-2">
          <div className="flex items-center justify-center gap-8 text-white text-sm">
            {settings.showWordCount && (
              <span>Words: {wordsWritten > 0 ? `+${wordsWritten}` : '0'}</span>
            )}
            {sprint.isActive && settings.showTimer && (
              <span>Time: {formatTime(sprint.remainingTime)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Panel Component
interface FocusSettingsPanelProps {
  settings: any;
  updateSettings: (settings: any) => void;
  sprintSettings: any;
  updateSprintSettings: (settings: any) => void;
  ambientSounds: any[];
  onClose: () => void;
}

const FocusSettingsPanel: React.FC<FocusSettingsPanelProps> = ({
  settings,
  updateSettings,
  sprintSettings,
  updateSprintSettings,
  ambientSounds,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Focus Mode Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Writing Experience */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Writing Experience</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.typewriterMode}
                  onChange={(e) => updateSettings({ typewriterMode: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Typewriter Mode (center current line)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.zenMode}
                  onChange={(e) => updateSettings({ zenMode: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Zen Mode (ultra-minimal UI)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showWordCount}
                  onChange={(e) => updateSettings({ showWordCount: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show word count
                </span>
              </label>
            </div>
          </div>

          {/* Ambient Sounds */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Ambient Sounds</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Sound
                </label>
                <select
                  value={settings.ambientSound}
                  onChange={(e) => updateSettings({ ambientSound: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {ambientSounds.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
              </div>

              {settings.ambientSound !== 'none' && (
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Volume: {Math.round(settings.ambientVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.ambientVolume}
                    onChange={(e) => updateSettings({ ambientVolume: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sprint Settings */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Writing Sprints</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Sprint Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={sprintSettings.duration}
                  onChange={(e) => updateSprintSettings({ duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Word Target
                </label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  value={sprintSettings.wordTarget}
                  onChange={(e) => updateSprintSettings({ wordTarget: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};