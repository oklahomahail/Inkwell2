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

// Environment variables
interface ImportMetaEnv {
  readonly VITE_ENABLE_FREE_PREVIEW?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_AI_MOCK_MODE?: string;
  readonly VITE_DEBUG_ENABLED?: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
