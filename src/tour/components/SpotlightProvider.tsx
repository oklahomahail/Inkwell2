// src/tour/components/SpotlightProvider.tsx
import React, { createContext, useState } from 'react';

export const SpotlightContext = createContext({
  start: (_id: string) => {},
  stop: () => {},
});

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTour, setActiveTour] = useState<string | null>(null);

  const start = (id: string) => {
    setActiveTour(id);
    // You can add more logic here if needed
  };

  const stop = () => {
    setActiveTour(null);
  };

  return <SpotlightContext.Provider value={{ start, stop }}>{children}</SpotlightContext.Provider>;
}
