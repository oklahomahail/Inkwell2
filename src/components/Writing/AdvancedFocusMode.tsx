// src/components/Writing/AdvancedFocusMode.tsx
// Enhanced focus mode UI that integrates with your existing writing editor

import {
  Focus,
  Timer,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Settings,
  Target,
  Coffee,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useState } from 'react';

import { useAdvancedFocusMode } from '../../hooks/useAdvancedFocusMode';

interface AdvancedFocusModeProps {
  _isActive: boolean;
  _onToggle: () => void;
  currentWordCount: number;
  children: React.ReactNode;
}

export function AdvancedFocusMode({
  _isActive,
  _onToggle,
  currentWordCount,
  children,
}: AdvancedFocusModeProps) {
  const {
    isFocusMode,
    toggleFocusMode,
    disableFocusMode,
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
    wordsProgress: _wordsProgress,
    sessionStats: _sessionStats,
    isMuted,
    toggleMute,
    ambientSounds,
    formatTime,
  } = useAdvancedFocusMode();

  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Sync word count updates
  React.useEffect(() => {
    if (sprint.isActive) {
      updateSprintWordCount(currentWordCount);
    }
  }, [currentWordCount, sprint.isActive, updateSprintWordCount]);

  if (!isFocusMode) {
    return (
      <>
        {children}
        {/* Focus Mode Toggle Button - Always visible */}
        <button
          onClick={toggleFocusMode}
          className="fixed bottom-6 right-6 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Enter Focus Mode (F11)"
        >
          <Focus className="w-6 h-6" />
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Controls Bar */}
      {showControls && !settings.zenMode && (
        <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Exit Focus Mode */}
            <button
              onClick={disableFocusMode}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Exit Focus Mode (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Exit Focus</span>
            </button>

            {/* Sprint Controls */}
            <div className="flex items-center space-x-2 pl-4 border-l border-gray-300 dark:border-gray-600">
              {!sprint.isActive ? (
                <button
                  onClick={() => startSprint(currentWordCount)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  title="Start Writing Sprint (Ctrl+Shift+S)"
                >
                  <Zap className="w-4 h-4" />
                  Start Sprint
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={sprint.isPaused ? resumeSprint : pauseSprint}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    {sprint.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {sprint.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={stopSprint}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    title="Stop Sprint (Ctrl+Shift+X)"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sprint Progress */}
            {sprint.isActive && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-mono font-medium">
                    {formatTime(sprint.remainingTime)}
                  </span>
                </div>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm">
                    {sprint.currentWords - sprint.wordsAtStart}/{sprint.target}
                  </span>
                </div>
              </div>
            )}

            {/* Word Count */}
            {settings.showWordCount && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentWordCount.toLocaleString()} words
              </div>
            )}

            {/* Audio Controls */}
            {settings.ambientSound !== 'none' && (
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle Ambient Sound (Ctrl+Shift+M)"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Focus Mode Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Hide Controls */}
            <button
              onClick={() => setShowControls(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Hide Controls"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Focus Mode Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Typewriter Mode */}
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Typewriter Mode</span>
              <input
                type="checkbox"
                checked={settings.typewriterMode}
                onChange={(e) => updateSettings({ typewriterMode: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </label>

            {/* Zen Mode */}
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Zen Mode</span>
              <input
                type="checkbox"
                checked={settings.zenMode}
                onChange={(e) => updateSettings({ zenMode: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </label>

            {/* Show Word Count */}
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Word Count</span>
              <input
                type="checkbox"
                checked={settings.showWordCount}
                onChange={(e) => updateSettings({ showWordCount: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </label>

            {/* Ambient Sound */}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Ambient Sound
              </label>
              <select
                value={settings.ambientSound}
                onChange={(e) => updateSettings({ ambientSound: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                {ambientSounds.map((sound) => (
                  <option key={sound.id} value={sound.id}>
                    {sound.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume */}
            {settings.ambientSound !== 'none' && (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
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

            {/* Sprint Settings */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sprint Settings</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={sprintSettings.duration}
                    onChange={(e) => updateSprintSettings({ duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Word Target
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    step="50"
                    value={sprintSettings.wordTarget}
                    onChange={(e) => updateSprintSettings({ wordTarget: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Hidden Controls Toggle */}
        {!showControls && (
          <button
            onClick={() => setShowControls(true)}
            className="absolute top-4 right-4 z-50 p-2 bg-gray-800/50 hover:bg-gray-800/70 text-white rounded-lg backdrop-blur-sm transition-all"
            title="Show Controls"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Writing Area */}
        <div
          className={`
          h-full
          ${settings.typewriterMode ? 'typewriter-container' : ''}
          ${settings.zenMode ? 'zen-mode-container' : ''}
        `}
        >
          {children}
        </div>

        {/* Sprint Completion Notification */}
        {sprint.sprintsCompleted > 0 && !sprint.isActive && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white p-6 rounded-lg shadow-xl z-60">
            <div className="text-center">
              <Coffee className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Sprint Complete!</h3>
              <p className="text-sm mb-4">
                You wrote {sprint.currentWords - sprint.wordsAtStart} words
              </p>
              <button
                onClick={() => startSprint(currentWordCount)}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Another Sprint
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Status Bar (only in zen mode) */}
      {settings.zenMode && sprint.isActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/70 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm">
          {formatTime(sprint.remainingTime)} • {sprint.currentWords - sprint.wordsAtStart}/
          {sprint.target}
        </div>
      )}
    </div>
  );
}
