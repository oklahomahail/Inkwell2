// src/components/Writing/AdvancedFocusMode.tsx
/**
 * Advanced Focus Mode UI
 *
 * Features:
 * - Full-screen distraction-free writing
 * - Writing sprints with timers and word targets
 * - Ambient sound support
 * - Typewriter mode (centers current line)
 * - Zen mode (minimal UI)
 * - Session statistics tracking
 */

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

import { useAdvancedFocusMode } from '@/hooks/useAdvancedFocusMode';

interface AdvancedFocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  currentWordCount: number;
  children: React.ReactNode;
}

export function AdvancedFocusMode({
  isActive: _isActive,
  onToggle: _onToggle,
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
          className="fixed bottom-6 right-6 z-50 p-3 bg-inkwell-gold hover:bg-inkwell-gold-dark dark:bg-inkwell-gold-light dark:hover:bg-inkwell-gold text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Enter Focus Mode (F11)"
        >
          <Focus className="w-6 h-6" />
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-inkwell-parchment dark:bg-inkwell-dark-bg flex flex-col">
      {/* Top Controls Bar */}
      {showControls && !settings.zenMode && (
        <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-inkwell-dark-surface/80 backdrop-blur-sm border-b border-inkwell-panel/30 dark:border-inkwell-dark-elevated">
          <div className="flex items-center space-x-4">
            {/* Exit Focus Mode */}
            <button
              onClick={disableFocusMode}
              className="flex items-center gap-2 px-3 py-2 text-inkwell-ink/60 dark:text-inkwell-dark-muted hover:text-inkwell-ink dark:hover:text-inkwell-dark-text transition-colors"
              title="Exit Focus Mode (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-sans">Exit Focus</span>
            </button>

            {/* Sprint Controls */}
            <div className="flex items-center space-x-2 pl-4 border-l border-inkwell-panel/30 dark:border-inkwell-dark-elevated">
              {!sprint.isActive ? (
                <button
                  onClick={() => startSprint(currentWordCount)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-sans"
                  title="Start Writing Sprint (Ctrl+Shift+S)"
                >
                  <Zap className="w-4 h-4" />
                  Start Sprint
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={sprint.isPaused ? resumeSprint : pauseSprint}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-sans"
                  >
                    {sprint.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {sprint.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={stopSprint}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-sans"
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
                  <Timer className="w-4 h-4 text-inkwell-ink/60 dark:text-inkwell-dark-muted" />
                  <span className="text-sm font-mono font-medium text-inkwell-ink dark:text-inkwell-dark-text">
                    {formatTime(sprint.remainingTime)}
                  </span>
                </div>
                <div className="w-24 h-2 bg-inkwell-panel/30 dark:bg-inkwell-dark-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-1000"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-inkwell-ink/60 dark:text-inkwell-dark-muted" />
                  <span className="text-sm text-inkwell-ink dark:text-inkwell-dark-text font-sans">
                    {sprint.currentWords - sprint.wordsAtStart}/{sprint.target}
                  </span>
                </div>
              </div>
            )}

            {/* Word Count */}
            {settings.showWordCount && (
              <div className="text-sm text-inkwell-ink/60 dark:text-inkwell-dark-muted font-sans">
                {currentWordCount.toLocaleString()} words
              </div>
            )}

            {/* Audio Controls */}
            {settings.ambientSound !== 'none' && (
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated rounded-lg transition-colors text-inkwell-ink/60 dark:text-inkwell-dark-muted hover:text-inkwell-ink dark:hover:text-inkwell-dark-text"
                title="Toggle Ambient Sound (Ctrl+Shift+M)"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated rounded-lg transition-colors text-inkwell-ink/60 dark:text-inkwell-dark-muted hover:text-inkwell-ink dark:hover:text-inkwell-dark-text"
              title="Focus Mode Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Hide Controls */}
            <button
              onClick={() => setShowControls(false)}
              className="p-2 hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated rounded-lg transition-colors text-inkwell-ink/60 dark:text-inkwell-dark-muted hover:text-inkwell-ink dark:hover:text-inkwell-dark-text"
              title="Hide Controls"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-inkwell-dark-surface rounded-lg shadow-xl border border-inkwell-panel/30 dark:border-inkwell-dark-elevated p-4 z-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-inkwell-ink dark:text-inkwell-dark-text font-serif">
              Focus Mode Settings
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated rounded text-inkwell-ink/60 dark:text-inkwell-dark-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Typewriter Mode */}
            <label className="flex items-center justify-between">
              <span className="text-sm text-inkwell-ink dark:text-inkwell-dark-text font-sans">
                Typewriter Mode
              </span>
              <input
                type="checkbox"
                checked={settings.typewriterMode}
                onChange={(e) => updateSettings({ typewriterMode: e.target.checked })}
                className="rounded border-inkwell-panel dark:border-inkwell-dark-elevated text-inkwell-gold dark:text-inkwell-gold-light focus:ring-inkwell-gold dark:focus:ring-inkwell-gold-light"
              />
            </label>

            {/* Zen Mode */}
            <label className="flex items-center justify-between">
              <span className="text-sm text-inkwell-ink dark:text-inkwell-dark-text font-sans">
                Zen Mode
              </span>
              <input
                type="checkbox"
                checked={settings.zenMode}
                onChange={(e) => updateSettings({ zenMode: e.target.checked })}
                className="rounded border-inkwell-panel dark:border-inkwell-dark-elevated text-inkwell-gold dark:text-inkwell-gold-light focus:ring-inkwell-gold dark:focus:ring-inkwell-gold-light"
              />
            </label>

            {/* Show Word Count */}
            <label className="flex items-center justify-between">
              <span className="text-sm text-inkwell-ink dark:text-inkwell-dark-text font-sans">
                Show Word Count
              </span>
              <input
                type="checkbox"
                checked={settings.showWordCount}
                onChange={(e) => updateSettings({ showWordCount: e.target.checked })}
                className="rounded border-inkwell-panel dark:border-inkwell-dark-elevated text-inkwell-gold dark:text-inkwell-gold-light focus:ring-inkwell-gold dark:focus:ring-inkwell-gold-light"
              />
            </label>

            {/* Ambient Sound */}
            <div>
              <label className="block text-sm text-inkwell-ink dark:text-inkwell-dark-text mb-2 font-sans">
                Ambient Sound
              </label>
              <select
                value={settings.ambientSound}
                onChange={(e) => updateSettings({ ambientSound: e.target.value })}
                className="w-full px-3 py-2 border border-inkwell-panel dark:border-inkwell-dark-elevated rounded-lg bg-white dark:bg-inkwell-dark-surface text-inkwell-ink dark:text-inkwell-dark-text text-sm font-sans"
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
                <label className="block text-sm text-inkwell-ink dark:text-inkwell-dark-text mb-2 font-sans">
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
            <div className="pt-4 border-t border-inkwell-panel/30 dark:border-inkwell-dark-elevated">
              <h4 className="font-medium text-inkwell-ink dark:text-inkwell-dark-text mb-3 font-serif">
                Sprint Settings
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-inkwell-ink dark:text-inkwell-dark-text mb-1 font-sans">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={sprintSettings.duration}
                    onChange={(e) => updateSprintSettings({ duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-inkwell-panel dark:border-inkwell-dark-elevated rounded-lg bg-white dark:bg-inkwell-dark-surface text-inkwell-ink dark:text-inkwell-dark-text text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm text-inkwell-ink dark:text-inkwell-dark-text mb-1 font-sans">
                    Word Target
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    step="50"
                    value={sprintSettings.wordTarget}
                    onChange={(e) => updateSprintSettings({ wordTarget: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-inkwell-panel dark:border-inkwell-dark-elevated rounded-lg bg-white dark:bg-inkwell-dark-surface text-inkwell-ink dark:text-inkwell-dark-text text-sm font-sans"
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
            className="absolute top-4 right-4 z-50 p-2 bg-inkwell-ink/50 hover:bg-inkwell-ink/70 dark:bg-inkwell-dark-surface/50 dark:hover:bg-inkwell-dark-surface/70 text-white rounded-lg backdrop-blur-sm transition-all"
            title="Show Controls"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Writing Area */}
        <div
          className={`h-full ${settings.typewriterMode ? 'typewriter-container' : ''} ${settings.zenMode ? 'zen-mode-container' : ''}`}
        >
          {children}
        </div>

        {/* Sprint Completion Notification */}
        {sprint.sprintsCompleted > 0 && !sprint.isActive && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 dark:bg-green-700 text-white p-6 rounded-lg shadow-xl z-60">
            <div className="text-center">
              <Coffee className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold mb-2 font-serif">Sprint Complete!</h3>
              <p className="text-sm mb-4 font-sans">
                You wrote {sprint.currentWords - sprint.wordsAtStart} words
              </p>
              <button
                onClick={() => startSprint(currentWordCount)}
                className="px-4 py-2 bg-white text-green-600 dark:text-green-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors font-sans"
              >
                Start Another Sprint
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Status Bar (only in zen mode) */}
      {settings.zenMode && sprint.isActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-inkwell-ink/70 dark:bg-inkwell-dark-surface/70 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-mono">
          {formatTime(sprint.remainingTime)} • {sprint.currentWords - sprint.wordsAtStart}/
          {sprint.target}
        </div>
      )}
    </div>
  );
}
