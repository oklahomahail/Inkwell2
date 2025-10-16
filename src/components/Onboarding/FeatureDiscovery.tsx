// src/components/Onboarding/FeatureDiscovery.tsx
import { Lightbulb, X, Sparkles } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTour } from './ProfileTourProvider';

interface FeatureHint {
  id: string;
  title: string;
  description: string;
  target: string;
  trigger: 'hover' | 'click' | 'focus' | 'auto';
  placement: 'top' | 'bottom' | 'left' | 'right';
  priority: 'low' | 'medium' | 'high';
  delay?: number; // Auto-show delay in ms
  category: 'writing' | 'navigation' | 'productivity' | 'ai';
  showOnce?: boolean;
  conditions?: {
    view?: string;
    hasProjects?: boolean;
    hasContent?: boolean;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface FeatureDiscoveryContextValue {
  showHint: (_hintId: string) => void;
  hideHint: (_hintId: string) => void;
  dismissHint: (_hintId: string) => void;
  isHintVisible: (_hintId: string) => boolean;
  isHintDismissed: (_hintId: string) => boolean;
  registerHints: (_hints: FeatureHint[]) => void;
  activeHint: FeatureHint | null;
}

const FeatureDiscoveryContext = React.createContext<FeatureDiscoveryContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = 'inkwell-feature-discovery';

// Predefined feature hints
export const FEATURE_HINTS: FeatureHint[] = [
  {
    id: 'command-palette-hint',
    title: 'Quick Actions',
    description: 'Press ⌘K to open the command palette for instant navigation and actions.',
    target: '[data-hint="command-palette"]',
    trigger: 'auto',
    placement: 'bottom',
    priority: 'high',
    delay: 3000,
    category: 'productivity',
    showOnce: true,
    conditions: { hasProjects: true },
  },
  {
    id: 'ai-toolbar-hint',
    title: 'AI Writing Assistant',
    description:
      'Select any text to see AI suggestions for improvement, continuation, or analysis.',
    target: '[data-hint="ai-toolbar"]',
    trigger: 'hover',
    placement: 'top',
    priority: 'medium',
    category: 'ai',
    conditions: { view: 'Writing', hasContent: true },
  },
  {
    id: 'focus-mode-hint',
    title: 'Focus Mode',
    description: 'Enter distraction-free writing by pressing F11 or using the focus toggle.',
    target: '[data-hint="focus-mode"]',
    trigger: 'hover',
    placement: 'left',
    priority: 'medium',
    category: 'writing',
    conditions: { view: 'Writing' },
  },
  {
    id: 'sidebar-collapse-hint',
    title: 'More Space',
    description: 'Click here to collapse the sidebar and get more writing space.',
    target: '[data-hint="sidebar-toggle"]',
    trigger: 'auto',
    placement: 'right',
    priority: 'low',
    delay: 10000,
    category: 'navigation',
    conditions: { view: 'Writing', hasContent: true },
  },
  {
    id: 'dark-mode-hint',
    title: 'Easy on the Eyes',
    description: 'Switch to dark mode for comfortable writing in low light.',
    target: '[data-hint="dark-mode-toggle"]',
    trigger: 'hover',
    placement: 'bottom',
    priority: 'low',
    category: 'navigation',
  },
  {
    id: 'project-stats-hint',
    title: 'Track Progress',
    description: 'Monitor your word count, writing streaks, and daily goals here.',
    target: '[data-hint="project-stats"]',
    trigger: 'hover',
    placement: 'bottom',
    priority: 'medium',
    category: 'productivity',
    conditions: { view: 'Dashboard' },
  },
  {
    id: 'export-hint',
    title: 'Share Your Work',
    description: 'Export your story to various formats including PDF, DOCX, and Markdown.',
    target: '[data-hint="export-button"]',
    trigger: 'hover',
    placement: 'bottom',
    priority: 'medium',
    category: 'productivity',
    conditions: { hasContent: true },
  },
  {
    id: 'character-tracking-hint',
    title: 'Character Development',
    description: 'Keep track of your characters, their traits, and story arcs.',
    target: '[data-hint="characters-section"]',
    trigger: 'hover',
    placement: 'right',
    priority: 'medium',
    category: 'writing',
    conditions: { view: 'Timeline' },
  },
];

interface FeatureDiscoveryProviderProps {
  children: React.ReactNode;
}

export const FeatureDiscoveryProvider: React.FC<FeatureDiscoveryProviderProps> = ({ children }) => {
  const [dismissedHints, setDismissedHints] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeHint, setActiveHint] = useState<FeatureHint | null>(null);
  const [availableHints, setAvailableHints] = useState<FeatureHint[]>(FEATURE_HINTS);
  const _timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Save dismissed hints to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedHints));
    } catch (error) {
      console.warn('Failed to save feature discovery progress:', error);
    }
  }, [dismissedHints]);

  const showHint = (hintId: string) => {
    const hint = availableHints.find((h) => h.id === hintId);
    if (hint && !dismissedHints.includes(hintId)) {
      setActiveHint(hint);
    }
  };

  const hideHint = (hintId: string) => {
    if (activeHint?.id === hintId) {
      setActiveHint(null);
    }
  };

  const dismissHint = (hintId: string) => {
    setDismissedHints((prev) => [...prev, hintId]);
    hideHint(hintId);
  };

  const isHintVisible = (hintId: string) => {
    return activeHint?.id === hintId;
  };

  const isHintDismissed = (hintId: string) => {
    return dismissedHints.includes(hintId);
  };

  const registerHints = (hints: FeatureHint[]) => {
    setAvailableHints((prev) => [...prev, ...hints]);
  };

  const value: FeatureDiscoveryContextValue = {
    showHint,
    hideHint,
    dismissHint,
    isHintVisible,
    isHintDismissed,
    registerHints,
    activeHint,
  };

  return (
    <FeatureDiscoveryContext.Provider value={value}>
      {children}
      <FeatureHintOverlay />
    </FeatureDiscoveryContext.Provider>
  );
};

export const useFeatureDiscovery = () => {
  const context = React.useContext(FeatureDiscoveryContext);
  if (!context) {
    throw new Error('useFeatureDiscovery must be used within FeatureDiscoveryProvider');
  }
  return context;
};

// Component that renders the active hint
const FeatureHintOverlay: React.FC = () => {
  const { activeHint, hideHint, dismissHint } = useFeatureDiscovery();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeHint) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(activeHint.target) as HTMLElement;
      if (!targetElement || !hintRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const hintRect = hintRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      switch (activeHint.placement) {
        case 'top':
          top = targetRect.top - hintRect.height - 12;
          left = targetRect.left + (targetRect.width - hintRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + 12;
          left = targetRect.left + (targetRect.width - hintRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - hintRect.height) / 2;
          left = targetRect.left - hintRect.width - 12;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - hintRect.height) / 2;
          left = targetRect.right + 12;
          break;
      }

      // Keep hint within viewport
      top = Math.max(12, Math.min(top, viewportHeight - hintRect.height - 12));
      left = Math.max(12, Math.min(left, viewportWidth - hintRect.width - 12));

      setPosition({
        top: top + window.scrollY,
        left: left + window.scrollX,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [activeHint]);

  if (!activeHint) return null;

  const handleDismiss = () => {
    dismissHint(activeHint.id);
  };

  const handleClose = () => {
    hideHint(activeHint.id);
  };

  const getPriorityColor = (priority: FeatureHint['priority']): string => {
    switch (priority) {
      case 'high':
        return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'medium':
        return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-gray-400 bg-gray-50 dark:bg-gray-800/50';
      default:
        return 'border-gray-400 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const getPriorityIcon = (priority: FeatureHint['priority']): React.ReactElement => {
    switch (priority) {
      case 'high':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      case 'medium':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Lightbulb className="w-4 h-4 text-gray-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      ref={hintRef}
      className={`fixed z-40 max-w-xs feature-hint-overlay animate-in fade-in slide-in-from-bottom-2 duration-300 ${getPriorityColor(activeHint.priority)}`}
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getPriorityIcon(activeHint.priority)}
            <h4 className="font-medium text-slate-900 dark:text-white text-sm">
              {activeHint.title}
            </h4>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
          {activeHint.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 capitalize">{activeHint.category}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Later
            </button>
            {activeHint.showOnce && (
              <button
                onClick={handleDismiss}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded transition-colors"
              >
                Got it
              </button>
            )}
          </div>
        </div>

        {/* Arrow pointer */}
        <div
          className={`absolute w-2 h-2 bg-white dark:bg-slate-800 border transform rotate-45 ${
            activeHint.placement === 'top'
              ? '-bottom-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0'
              : activeHint.placement === 'bottom'
                ? '-top-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0'
                : activeHint.placement === 'left'
                  ? '-right-1 top-1/2 -translate-y-1/2 border-l-0 border-b-0'
                  : activeHint.placement === 'right'
                    ? '-left-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                    : 'hidden'
          }`}
        />
      </div>
    </div>
  );
};

// Hook for triggering contextual hints based on conditions
export const useContextualHints = (
  currentView: string,
  appState: {
    hasProjects: boolean;
    hasContent: boolean;
    userLevel: 'beginner' | 'intermediate' | 'advanced';
  },
): void => {
  const { showHint, hideHint, isHintDismissed } = useFeatureDiscovery();
  const { tourState } = useTour();

  useEffect(() => {
    // Don't show hints during active tour
    if (tourState?.active) return;

    const eligibleHints = FEATURE_HINTS.filter((hint) => {
      if (isHintDismissed(hint.id)) return false;

      const conditions = hint.conditions;
      if (!conditions) return true;

      // Check view condition
      if (conditions.view && conditions.view !== currentView) return false;

      // Check project condition
      if (conditions.hasProjects !== undefined && conditions.hasProjects !== appState.hasProjects)
        return false;

      // Check content condition
      if (conditions.hasContent !== undefined && conditions.hasContent !== appState.hasContent)
        return false;

      // Check user level condition
      if (conditions.userLevel && conditions.userLevel !== appState.userLevel) return false;

      return true;
    });

    // Auto-show high priority hints with delay
    eligibleHints
      .filter((hint) => hint.trigger === 'auto' && hint.priority === 'high')
      .forEach((hint) => {
        setTimeout(() => {
          if (!isHintDismissed(hint.id)) {
            showHint(hint.id);
          }
        }, hint.delay || 2000);
      });

    // Show medium priority hints after a longer delay
    setTimeout(() => {
      const mediumPriorityHints = eligibleHints.filter(
        (hint) => hint.trigger === 'auto' && hint.priority === 'medium',
      );

      if (mediumPriorityHints.length > 0) {
        const randomHint =
          mediumPriorityHints[Math.floor(Math.random() * mediumPriorityHints.length)];
        if (randomHint && !isHintDismissed(randomHint.id)) {
          showHint(randomHint.id);
        }
      }
    }, 15000); // Show after 15 seconds
  }, [currentView, appState, showHint, hideHint, isHintDismissed, tourState?.active]);
};

// Component wrapper that adds hint triggers to elements
interface HintTriggerProps {
  hintId: string;
  children: React.ReactNode;
  className?: string;
}

export const HintTrigger: React.FC<HintTriggerProps> = ({ hintId, children, className = '' }) => {
  const { showHint, hideHint, isHintDismissed } = useFeatureDiscovery();

  if (isHintDismissed(hintId)) {
    return <>{children}</>;
  }

  const hint = FEATURE_HINTS.find((h) => h.id === hintId);
  if (!hint) return <>{children}</>;

  const handleMouseEnter = () => {
    if (hint.trigger === 'hover') {
      showHint(hintId);
    }
  };

  const handleMouseLeave = () => {
    if (hint.trigger === 'hover') {
      setTimeout(() => hideHint(hintId), 100); // Small delay to prevent flicker
    }
  };

  const handleClick = () => {
    if (hint.trigger === 'click') {
      showHint(hintId);
    }
  };

  const handleFocus = () => {
    if (hint.trigger === 'focus') {
      showHint(hintId);
    }
  };

  const handleBlur = () => {
    if (hint.trigger === 'focus') {
      hideHint(hintId);
    }
  };

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </div>
  );
};
