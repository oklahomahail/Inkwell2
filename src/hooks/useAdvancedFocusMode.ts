// src/hooks/useAdvancedFocusMode.ts
// Enhanced focus mode with typewriter mode, writing sprints, and ambient sounds

import { useState, useCallback, useEffect, useRef } from 'react';

export interface FocusSettings {
  typewriterMode: boolean;
  showWordCount: boolean;
  showTimer: boolean;
  ambientSound: string;
  ambientVolume: number;
  hideUI: boolean;
  zenMode: boolean; // Ultra-minimal UI
}

export interface SprintSettings {
  duration: number; // in minutes
  wordTarget: number;
  breakDuration: number; // in minutes
  autoStartBreaks: boolean;
}

export interface SprintState {
  isActive: boolean;
  isPaused: boolean;
  isOnBreak: boolean;
  startTime: number;
  pausedTime: number;
  duration: number; // in seconds
  remainingTime: number;
  target: number;
  wordsAtStart: number;
  currentWords: number;
  sprintsCompleted: number;
}

export interface SessionStats {
  sessionStartTime: number;
  totalWordsWritten: number;
  totalSprintTime: number; // in seconds
  sprintsCompleted: number;
  averageWPM: number;
}

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'None', url: '' },
  { id: 'rain', name: 'Gentle Rain', url: '/sounds/rain.mp3' },
  { id: 'forest', name: 'Forest Ambience', url: '/sounds/forest.mp3' },
  { id: 'cafe', name: 'Coffee Shop', url: '/sounds/cafe.mp3' },
  { id: 'ocean', name: 'Ocean Waves', url: '/sounds/ocean.mp3' },
  { id: 'fireplace', name: 'Fireplace', url: '/sounds/fireplace.mp3' },
  { id: 'white-noise', name: 'White Noise', url: '/sounds/white-noise.mp3' },
  { id: 'library', name: 'Library Ambience', url: '/sounds/library.mp3' },
];

export function useAdvancedFocusMode() {
  // Basic focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Advanced focus settings
  const [settings, setSettings] = useState<FocusSettings>({
    typewriterMode: false,
    showWordCount: true,
    showTimer: true,
    ambientSound: 'none',
    ambientVolume: 0.3,
    hideUI: false,
    zenMode: false,
  });

  // Sprint functionality
  const [sprintSettings, setSprintSettings] = useState<SprintSettings>({
    duration: 25, // Pomodoro default
    wordTarget: 500,
    breakDuration: 5,
    autoStartBreaks: true,
  });

  const [sprint, setSprint] = useState<SprintState>({
    isActive: false,
    isPaused: false,
    isOnBreak: false,
    startTime: 0,
    pausedTime: 0,
    duration: 0,
    remainingTime: 0,
    target: 0,
    wordsAtStart: 0,
    currentWords: 0,
    sprintsCompleted: 0,
  });

  // Session statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionStartTime: Date.now(),
    totalWordsWritten: 0,
    totalSprintTime: 0,
    sprintsCompleted: 0,
    averageWPM: 0,
  });

  // Audio management
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Replace NodeJS.Timeout with a cross-env type
  type TimeoutRef = ReturnType<typeof setTimeout>;
  const sprintTimerRef = useRef<TimeoutRef | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('inkwell_focus_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to load focus settings:', e);
      }
    }

    const savedSprintSettings = localStorage.getItem('inkwell_sprint_settings');
    if (savedSprintSettings) {
      try {
        const parsed = JSON.parse(savedSprintSettings);
        setSprintSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to load sprint settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('inkwell_focus_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('inkwell_sprint_settings', JSON.stringify(sprintSettings));
  }, [sprintSettings]);

  // Ambient sound management
  useEffect(() => {
    if (settings.ambientSound && settings.ambientSound !== 'none') {
      const sound = AMBIENT_SOUNDS.find((s) => s.id === settings.ambientSound);
      if (sound) {
        if (audioRef.current) {
          audioRef.current.pause();
        }

        audioRef.current = new Audio(sound.url);
        audioRef.current.loop = true;
        audioRef.current.volume = isMuted ? 0 : settings.ambientVolume;

        if (isFocusMode) {
          audioRef.current.play().catch((e) => console.warn('Failed to play ambient sound:', e));
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [settings.ambientSound, settings.ambientVolume, isMuted, isFocusMode]);

  // Sprint timer management
  useEffect(() => {
    if (sprint.isActive && !sprint.isPaused && !sprint.isOnBreak) {
      sprintTimerRef.current = setInterval(() => {
        setSprint((prev) => {
          const elapsed = Date.now() - prev.startTime - prev.pausedTime;
          const remaining = Math.max(0, prev.duration * 1000 - elapsed);

          if (remaining === 0) {
            // Sprint completed
            return {
              ...prev,
              isActive: false,
              isOnBreak: sprintSettings.autoStartBreaks,
              remainingTime: 0,
              sprintsCompleted: prev.sprintsCompleted + 1,
            };
          }

          return {
            ...prev,
            remainingTime: Math.floor(remaining / 1000),
          };
        });
      }, 1000);
    } else {
      if (sprintTimerRef.current) {
        clearInterval(sprintTimerRef.current);
        sprintTimerRef.current = null;
      }
    }

    return () => {
      if (sprintTimerRef.current) {
        clearInterval(sprintTimerRef.current);
      }
    };
  }, [sprint.isActive, sprint.isPaused, sprint.isOnBreak, sprintSettings.autoStartBreaks]);

  // Focus mode management
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const enableFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const disableFocusMode = useCallback(() => {
    setIsFocusMode(false);
    // Stop any active sprints when exiting focus mode
    if (sprint.isActive) {
      stopSprint();
    }
  }, []);

  // Sprint management
  const startSprint = useCallback(
    (wordCount: number = 0) => {
      const duration = sprintSettings.duration * 60; // Convert to seconds
      setSprint({
        isActive: true,
        isPaused: false,
        isOnBreak: false,
        startTime: Date.now(),
        pausedTime: 0,
        duration,
        remainingTime: duration,
        target: sprintSettings.wordTarget,
        wordsAtStart: wordCount,
        currentWords: wordCount,
        sprintsCompleted: 0,
      });

      // Update session stats
      setSessionStats((prev) => ({
        ...prev,
        sessionStartTime: prev.sessionStartTime || Date.now(),
      }));
    },
    [sprintSettings],
  );

  const pauseSprint = useCallback(() => {
    setSprint((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeSprint = useCallback(() => {
    setSprint((prev) => ({
      ...prev,
      isPaused: false,
      pausedTime: prev.pausedTime + (Date.now() - prev.startTime),
    }));
  }, []);

  const stopSprint = useCallback(() => {
    setSprint((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      isOnBreak: false,
      remainingTime: 0,
    }));
  }, []);

  // Update word count during sprint
  const updateSprintWordCount = useCallback(
    (wordCount: number) => {
      setSprint((prev) => ({
        ...prev,
        currentWords: wordCount,
      }));

      // Update session stats
      setSessionStats((prev) => ({
        ...prev,
        totalWordsWritten: Math.max(
          prev.totalWordsWritten,
          wordCount - sessionStats.sessionStartTime,
        ),
      }));
    },
    [sessionStats.sessionStartTime],
  );

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<FocusSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const updateSprintSettings = useCallback((newSettings: Partial<SprintSettings>) => {
    setSprintSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Audio controls
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? settings.ambientVolume : 0;
    }
  }, [isMuted, settings.ambientVolume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle focus mode with F11 or Cmd/Ctrl + Shift + F
      if (
        event.key === 'F11' ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F')
      ) {
        event.preventDefault();
        toggleFocusMode();
      }

      // Exit focus mode with Escape
      if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault();
        disableFocusMode();
      }

      // Sprint controls (only in focus mode)
      if (isFocusMode) {
        // Start sprint with Cmd/Ctrl + Shift + S
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'S') {
          event.preventDefault();
          if (!sprint.isActive) {
            startSprint();
          } else if (sprint.isPaused) {
            resumeSprint();
          } else {
            pauseSprint();
          }
        }

        // Stop sprint with Cmd/Ctrl + Shift + X
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'X') {
          event.preventDefault();
          stopSprint();
        }

        // Toggle mute with Cmd/Ctrl + Shift + M
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'M') {
          event.preventDefault();
          toggleMute();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    sprint,
    toggleFocusMode,
    disableFocusMode,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    toggleMute,
  ]);

  // Apply focus mode styles
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
      if (settings.zenMode) {
        document.body.classList.add('zen-mode');
      }
      if (settings.typewriterMode) {
        document.body.classList.add('typewriter-mode');
      }
      document.body.style.overflow = 'hidden';

      const originalTitle = document.title;
      document.title = `${originalTitle} - Focus Mode`;

      return () => {
        document.body.classList.remove('focus-mode', 'zen-mode', 'typewriter-mode');
        document.body.style.overflow = '';
        document.title = originalTitle;
      };
    } else {
      document.body.classList.remove('focus-mode', 'zen-mode', 'typewriter-mode');
      document.body.style.overflow = '';
    }
  }, [isFocusMode, settings.zenMode, settings.typewriterMode]);

  // Calculate sprint progress
  const sprintProgress =
    sprint.isActive && sprint.duration > 0
      ? ((sprint.duration - sprint.remainingTime) / sprint.duration) * 100
      : 0;

  const wordsProgress =
    sprint.target > 0
      ? Math.min(((sprint.currentWords - sprint.wordsAtStart) / sprint.target) * 100, 100)
      : 0;

  return {
    // Basic focus mode
    isFocusMode,
    toggleFocusMode,
    enableFocusMode,
    disableFocusMode,

    // Settings
    settings,
    updateSettings,
    sprintSettings,
    updateSprintSettings,

    // Sprint functionality
    sprint,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    updateSprintWordCount,
    sprintProgress,
    wordsProgress,

    // Session stats
    sessionStats,

    // Audio
    isMuted,
    toggleMute,
    ambientSounds: AMBIENT_SOUNDS,

    // Utilities
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
  };
}
