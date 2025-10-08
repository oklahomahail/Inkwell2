import React, { createContext, useContext, useEffect, useState } from 'react';

export type BrandTheme = 'light' | 'dark' | 'auto';

interface BrandThemeContextType {
  theme: BrandTheme;
  effectiveTheme: 'light' | 'dark'; // The actual theme being applied
  setTheme: (theme: BrandTheme) => void;
  toggleTheme: () => void;
}

const BrandThemeContext = createContext<BrandThemeContextType | undefined>(undefined);

export const useBrandTheme = () => {
  const context = useContext(BrandThemeContext);
  if (context === undefined) {
    throw new Error('useBrandTheme must be used within a BrandThemeProvider');
  }
  return context;
};

interface BrandThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: BrandTheme;
  storageKey?: string;
}

export const BrandThemeProvider: React.FC<BrandThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  storageKey = 'inkwell-theme',
}) => {
  const [theme, setThemeState] = useState<BrandTheme>(defaultTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as BrandTheme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeState(savedTheme);
    } else if (defaultTheme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setThemeState('auto');
      setEffectiveTheme(systemTheme);
    }
  }, [storageKey, defaultTheme]);

  // Update effective theme when theme changes
  useEffect(() => {
    let newEffectiveTheme: 'light' | 'dark' = 'light';

    if (theme === 'dark') {
      newEffectiveTheme = 'dark';
    } else if (theme === 'auto') {
      newEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      newEffectiveTheme = 'light';
    }

    setEffectiveTheme(newEffectiveTheme);

    // Apply theme to document
    const root = document.documentElement;
    if (newEffectiveTheme === 'dark') {
      root.classList.add('dark');
      // Dark theme variables
      root.style.setProperty('--color-bg-primary', '#2d3748'); // inkwell-charcoal
      root.style.setProperty('--color-bg-secondary', '#1e3a5f'); // inkwell-navy
      root.style.setProperty('--color-bg-accent', '#d4af37'); // inkwell-gold
      root.style.setProperty('--color-text-primary', '#f7fafc');
      root.style.setProperty('--color-text-secondary', '#e2e8f0');
      root.style.setProperty('--color-text-muted', '#a0aec0');
      root.style.setProperty('--color-accent', '#d4af37');
      root.style.setProperty('--color-accent-hover', '#b8941f');
      root.style.setProperty('--color-border', 'rgba(212, 175, 55, 0.3)');
      root.style.setProperty('--color-border-light', 'rgba(212, 175, 55, 0.1)');
    } else {
      root.classList.remove('dark');
      // Light theme variables
      root.style.setProperty('--color-bg-primary', '#ffffff');
      root.style.setProperty('--color-bg-secondary', '#f8fafc');
      root.style.setProperty('--color-bg-accent', '#d4af37'); // inkwell-gold
      root.style.setProperty('--color-text-primary', '#1e3a5f'); // inkwell-navy
      root.style.setProperty('--color-text-secondary', '#2d3748'); // inkwell-charcoal
      root.style.setProperty('--color-text-muted', '#64748b');
      root.style.setProperty('--color-accent', '#d4af37');
      root.style.setProperty('--color-accent-hover', '#b8941f');
      root.style.setProperty('--color-border', 'rgba(212, 175, 55, 0.2)');
      root.style.setProperty('--color-border-light', 'rgba(212, 175, 55, 0.1)');
    }
  }, [theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setEffectiveTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: BrandTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  const value = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <BrandThemeContext.Provider value={value}>
      <div className={`inkwell-theme-${effectiveTheme}`}>{children}</div>
    </BrandThemeContext.Provider>
  );
};

export default BrandThemeProvider;
