import React, { createContext, useContext } from 'react';

export interface BrandTheme {
  navy: string;
  gold: string;
  mode: 'light' | 'dark';
}

const defaultTheme: BrandTheme = {
  navy: '#13294B',
  gold: '#D4AF37',
  mode: 'light',
};

const BrandThemeContext = createContext<BrandTheme>(defaultTheme);

export const BrandThemeProvider: React.FC<{ children: React.ReactNode; theme?: BrandTheme }> = ({
  children,
  theme = defaultTheme,
}) => {
  return <BrandThemeContext.Provider value={theme}>{children}</BrandThemeContext.Provider>;
};

export const useBrandTheme = () => useContext(BrandThemeContext);
