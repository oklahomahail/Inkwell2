import { useCallback, useEffect, useState } from 'react';

const KEY = 'inkwell.theme';
type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(KEY) as Theme | null;
    return saved ?? 'light'; // default to light
  });

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
    // Ensure we start with light mode unless explicitly set to dark
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(KEY);
      const initial = saved === 'dark' ? 'dark' : 'light';
      apply(initial);
      if (initial !== theme) {
        setThemeState(initial);
      }
    }
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
