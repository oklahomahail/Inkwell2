/**
 * FormattingContext - Project-level typography and layout management
 *
 * Provides formatting configuration and CSS variable injection for
 * consistent typesetting across editor, preview, and exports.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_FORMATTING, type ProjectFormatting } from '@/types/formatting';
import devLog from '@/utils/devLog';

// ─────────────────────────────────────────────────────────────────────────────
// Persistence Layer
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'inkwell:project:formatting';

/**
 * Load formatting configuration from localStorage
 */
async function loadFormatting(projectId: string): Promise<ProjectFormatting | null> {
  try {
    const key = `${STORAGE_PREFIX}:${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const data = JSON.parse(raw) as ProjectFormatting;

    // Version migration if needed
    if (!data.version || data.version !== 1) {
      devLog.warn('Formatting data version mismatch, using defaults');
      return null;
    }

    return data;
  } catch (error) {
    devLog.error('Failed to load formatting:', error);
    return null;
  }
}

/**
 * Save formatting configuration to localStorage
 */
async function saveFormatting(projectId: string, data: ProjectFormatting): Promise<void> {
  try {
    const key = `${STORAGE_PREFIX}:${projectId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    devLog.error('Failed to save formatting:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Definition
// ─────────────────────────────────────────────────────────────────────────────

interface FormattingContextValue {
  formatting: ProjectFormatting;
  loaded: boolean;
  setFormatting: (next: Partial<ProjectFormatting>) => void;
  resetFormatting: () => void;
  applyToElement: (el: HTMLElement | null) => void;
}

const FormattingContext = createContext<FormattingContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

export interface FormattingProviderProps {
  projectId: string;
  children: ReactNode;
}

export const FormattingProvider: React.FC<FormattingProviderProps> = ({ projectId, children }) => {
  const [formatting, setFmt] = useState<ProjectFormatting>(DEFAULT_FORMATTING);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef<ProjectFormatting | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Load formatting on mount or projectId change
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoaded(false);
      const data = await loadFormatting(projectId);
      if (!cancelled) {
        setFmt(data ?? DEFAULT_FORMATTING);
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Persist formatting with debounce
  useEffect(() => {
    if (!loaded) return;

    pendingRef.current = formatting;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      if (pendingRef.current) {
        saveFormatting(projectId, pendingRef.current);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [formatting, loaded, projectId]);

  /**
   * Update formatting (partial merge)
   */
  const setFormatting = useCallback((next: Partial<ProjectFormatting>) => {
    setFmt((prev) => ({
      ...prev,
      ...next,
      // Deep merge chapterHeader
      chapterHeader: {
        ...prev.chapterHeader,
        ...(next.chapterHeader ?? {}),
      },
      // Deep merge margin if provided
      margin: next.margin ? { ...prev.margin, ...next.margin } : prev.margin,
    }));
  }, []);

  /**
   * Reset to default formatting
   */
  const resetFormatting = useCallback(() => {
    setFmt(DEFAULT_FORMATTING);
  }, []);

  /**
   * Apply formatting as CSS variables to a DOM element
   * Call this on a container element to scope formatting
   */
  const applyToElement = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;

      const f = formatting;

      // Base typography
      el.style.setProperty('--ink-font-family', f.fontFamily);
      el.style.setProperty('--ink-font-size', `${f.fontSize}rem`);
      el.style.setProperty('--ink-line-height', `${f.lineHeight}`);
      el.style.setProperty('--ink-para-spacing', `${f.paragraphSpacing}rem`);
      el.style.setProperty('--ink-first-indent', `${f.firstLineIndent ?? 0}rem`);

      // Page margins (for preview)
      el.style.setProperty('--ink-margin-top', `${f.margin?.top ?? 0}rem`);
      el.style.setProperty('--ink-margin-right', `${f.margin?.right ?? 0}rem`);
      el.style.setProperty('--ink-margin-bottom', `${f.margin?.bottom ?? 0}rem`);
      el.style.setProperty('--ink-margin-left', `${f.margin?.left ?? 0}rem`);

      // Page dimensions (for preview)
      el.style.setProperty('--ink-page-width', `${f.pageWidth ?? 48}rem`);
      el.style.setProperty('--ink-page-height', `${f.pageHeight ?? 68}rem`);

      // Chapter header
      const ch = f.chapterHeader;
      el.style.setProperty('--ink-ch-font', ch.fontFamily || f.fontFamily);
      el.style.setProperty('--ink-ch-size', `${ch.fontSize ?? 1.75}rem`);
      el.style.setProperty('--ink-ch-weight', `${ch.fontWeight ?? 700}`);
      el.style.setProperty('--ink-ch-space-above', `${ch.spacingAbove ?? 1.5}rem`);
      el.style.setProperty('--ink-ch-space-below', `${ch.spacingBelow ?? 0.75}rem`);
    },
    [formatting]
  );

  const value = useMemo<FormattingContextValue>(
    () => ({
      formatting,
      loaded,
      setFormatting,
      resetFormatting,
      applyToElement,
    }),
    [formatting, loaded, setFormatting, resetFormatting, applyToElement]
  );

  return <FormattingContext.Provider value={value}>{children}</FormattingContext.Provider>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Access formatting configuration and controls
 * Must be used within a FormattingProvider
 */
export const useFormatting = (): FormattingContextValue => {
  const ctx = useContext(FormattingContext);
  if (!ctx) {
    throw new Error('useFormatting must be used within FormattingProvider');
  }
  return ctx;
};

/**
 * Convenience hook to apply formatting to a ref element
 * Returns a ref to attach to your container
 */
export function useFormattingScope<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const { applyToElement } = useFormatting();

  useEffect(() => {
    applyToElement(ref.current);
  }, [applyToElement]);

  return ref;
}
