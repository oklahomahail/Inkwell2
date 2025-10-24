import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AiSettings, AiProvider, AiModel } from '@/types/ai';

const DEFAULT_PROVIDER = (import.meta.env.VITE_DEFAULT_SIMPLE_PROVIDER ||
  'anthropic') as AiProvider;
const DEFAULT_MODEL = (import.meta.env.VITE_DEFAULT_SIMPLE_MODEL ||
  'claude-3-5-sonnet-20241022') as AiModel;

const defaultSettings: AiSettings = {
  mode: 'simple',
  provider: DEFAULT_PROVIDER,
  model: DEFAULT_MODEL,
  customApiKey: null,
};

type Ctx = {
  settings: AiSettings;
  setMode: (m: 'simple' | 'custom') => void;
  setProvider: (p: AiProvider) => void;
  setModel: (m: AiModel) => void;
  setCustomApiKey: (k: string | null) => void;
  reset: () => void;
};

const AiSettingsContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'inkwell.ai.settings.v1';

export function AiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AiSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const api: Ctx = useMemo(
    () => ({
      settings,
      setMode: (mode) => setSettings((s) => ({ ...s, mode })),
      setProvider: (provider) => setSettings((s) => ({ ...s, provider })),
      setModel: (model) => setSettings((s) => ({ ...s, model })),
      setCustomApiKey: (key) => setSettings((s) => ({ ...s, customApiKey: key })),
      reset: () => setSettings(defaultSettings),
    }),
    [settings],
  );

  return <AiSettingsContext.Provider value={api}>{children}</AiSettingsContext.Provider>;
}

export function useAiSettings() {
  const ctx = useContext(AiSettingsContext);
  if (!ctx) throw new Error('useAiSettings must be used within AiSettingsProvider');
  return ctx;
}
