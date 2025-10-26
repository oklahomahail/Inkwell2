/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// PWA virtual modules
declare module 'virtual:pwa-register/react' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (_registration: any) => void;
    onRegisterError?: (_error: any) => void;
  }
  export function _useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (_value: boolean) => void];
    offlineReady: [boolean, (_value: boolean) => void];
    updateServiceWorker: (_reloadPage?: boolean) => Promise<void>;
  };
}

// Global window augmentations
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, any>) => void;
  }
}
