import { useCallback, useEffect, useState } from 'react';

const KEY = 'inkwell.theme';
type Theme = 'light' | 'dark';

/**
 * Get the initial theme from the DOM (already set by inline script in index.html)
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const root = document.documentElement;
  if (root.classList.contains('dark')) return 'dark';
  return 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const apply = useCallback((t: Theme) => {
    const html = document.documentElement;
    if (t === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    html.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
  }, []);

  useEffect(() => {
    // On first mount, read from DOM rather than fighting the inline script
    const initial = getInitialTheme();
    if (initial !== theme) {
      setThemeState(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run once on mount
  }, []); // Run once on mount

  useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
