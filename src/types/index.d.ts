// Global type definitions and re-exports
export * from './profile';

// Custom module declarations
declare module '@/types' {
  export * from './profile';
}

// Global augmentations
declare global {
  interface Window {
    // Add any global window augmentations here
    debugSearch?: any;
    __PROFILE_TOUR_DEBUG__?: boolean;
  }
}
