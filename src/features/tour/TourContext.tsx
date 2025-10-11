import { createContext, useContext } from 'react';

type TourApi = {
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  isActive: boolean;
};

const noopApi: TourApi = {
  start() {},
  stop() {},
  next() {},
  prev() {},
  isActive: false,
};

const TourContext = createContext<TourApi | null>(null);

export function _TourProvider({ children }: { children: React.ReactNode }) {
  // Your existing tour implementation here
  const value: TourApi = {
    start() {},
    stop() {},
    next() {},
    prev() {},
    isActive: false,
  }; // Replace with your actual implementation

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function _useTourSafe(): TourApi {
  return useContext(TourContext) ?? noopApi;
}
