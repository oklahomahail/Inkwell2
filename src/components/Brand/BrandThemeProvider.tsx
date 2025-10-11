import React, { createContext, useContext } from 'react';

export interface BrandTheme {
  navy: string;
  gold: string;
  mode: 'light' | 'dark';
}

const defaultTheme: BrandTheme = {
  navy: '#0C5C3D',
  gold: '#D4A537',
  mode: 'light',
};

const BrandThemeContext = createContext<BrandTheme>(defaultTheme);

export const BrandThemeProvider: React.FC<{ children: React.ReactNode; theme?: BrandTheme }> = ({
  children,
  _theme = defaultTheme,
}) => {
  return <BrandThemeContext.Provider value={theme}>{children}</BrandThemeContext.Provider>;
};

export const useBrandTheme = () => useContext(BrandThemeContext);
