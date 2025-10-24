import React, { useMemo, useState } from 'react';

import { useAiSettings } from '@/context/AiSettingsContext';
import type { AiModel, AiProvider } from '@/types/ai';

const PROVIDER_MODELS: Record<
  AiProvider,
  { label: string; models: { id: AiModel; label: string }[] }
> = {
  anthropic: {
    label: 'Claude',
    models: [{ id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' }],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    ],
  },
  google: {
    label: 'Gemini',
    models: [
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
};

export default function AiSettingsPanel() {
  const { settings, setMode, setProvider, setModel, setCustomApiKey, reset } = useAiSettings();
  const [showKey, setShowKey] = useState(false);

  const currentOptions = useMemo(() => PROVIDER_MODELS[settings.provider], [settings.provider]);

  return (
    <div className="space-y-6">
      {/* AI Mode Section */}
      <section className="rounded-2xl border border-inkwell-border bg-inkwell-surface p-6">
        <h3 className="text-lg font-semibold text-inkwell-text">AI Mode</h3>
        <p className="mt-2 text-sm text-inkwell-muted">
          Inkwell includes a built-in AI companion for quick ideas and edits. Want deeper creative
          assistance? Connect your own Claude key for unlimited power.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            className={`rounded-lg border px-4 py-2 transition-colors ${
              settings.mode === 'simple'
                ? 'border-inkwell-accent bg-inkwell-accent text-white'
                : 'border-inkwell-border bg-inkwell-card text-inkwell-text hover:border-inkwell-accent'
            }`}
            onClick={() => setMode('simple')}
          >
            Simple Mode
          </button>
          <button
            className={`rounded-lg border px-4 py-2 transition-colors ${
              settings.mode === 'custom'
                ? 'border-inkwell-accent bg-inkwell-accent text-white'
                : 'border-inkwell-border bg-inkwell-card text-inkwell-text hover:border-inkwell-accent'
            }`}
            onClick={() => setMode('custom')}
          >
            Power Mode
          </button>
        </div>
      </section>

      {/* Provider and Model Section */}
      <section className="rounded-2xl border border-inkwell-border bg-inkwell-surface p-6">
        <h3 className="text-lg font-semibold text-inkwell-text">Provider and Model</h3>
        <p className="mt-2 text-sm text-inkwell-muted">
          Choose your AI provider and specific model.
          {settings.mode === 'simple' &&
            ' In Simple Mode, this uses Inkwell-provided API access with rate limits.'}
        </p>

        {/* Provider Selection */}
        <div className="mt-4">
          <label className="text-sm font-medium text-inkwell-text">Provider</label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(['anthropic', 'openai', 'google'] as AiProvider[]).map((p) => (
              <button
                key={p}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  settings.provider === p
                    ? 'border-inkwell-accent bg-inkwell-accent text-white'
                    : 'border-inkwell-border bg-inkwell-card text-inkwell-text hover:border-inkwell-accent'
                }`}
                onClick={() => {
                  setProvider(p);
                  const firstModel = PROVIDER_MODELS[p].models[0];
                  if (firstModel) {
                    setModel(firstModel.id);
                  }
                }}
              >
                {PROVIDER_MODELS[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="mt-4">
          <label className="text-sm font-medium text-inkwell-text">Model</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {currentOptions.models.map((m) => (
              <button
                key={m.id}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  settings.model === m.id
                    ? 'border-inkwell-accent bg-inkwell-accent text-white'
                    : 'border-inkwell-border bg-inkwell-card text-inkwell-text hover:border-inkwell-accent'
                }`}
                onClick={() => setModel(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Custom API Key Section */}
      <section className="rounded-2xl border border-inkwell-border bg-inkwell-surface p-6">
        <h3 className="text-lg font-semibold text-inkwell-text">Custom API Key</h3>
        <p className="mt-2 text-sm text-inkwell-muted">
          Paste your personal API key to use Power Mode with full features of your chosen provider.
          The key is stored locally on your device and never sent to Inkwell servers.
        </p>
        {settings.mode === 'simple' && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Switch to Power Mode to use your custom API key.
            </p>
          </div>
        )}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              className="w-full rounded-lg border border-inkwell-border bg-inkwell-card px-3 py-2 text-inkwell-text placeholder:text-inkwell-muted focus:border-inkwell-accent focus:outline-none disabled:opacity-50"
              placeholder="sk-ant-..., sk-..., AIza..."
              value={settings.customApiKey || ''}
              onChange={(e) => setCustomApiKey(e.target.value)}
              disabled={settings.mode === 'simple'}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-inkwell-muted hover:text-inkwell-text"
              onClick={() => setShowKey(!showKey)}
              type="button"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-inkwell-border bg-inkwell-card px-3 py-2 text-sm text-inkwell-text transition-colors hover:border-inkwell-accent disabled:opacity-50"
              onClick={() => setCustomApiKey(null)}
              disabled={settings.mode === 'simple'}
            >
              Clear key
            </button>
            <button
              className="rounded-lg border border-inkwell-border bg-inkwell-card px-3 py-2 text-sm text-inkwell-text transition-colors hover:border-inkwell-accent"
              onClick={reset}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
        <h4 className="font-semibold text-blue-600 dark:text-blue-400">How AI Mode Works</h4>
        <ul className="mt-3 space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <li>
            <strong>Simple Mode:</strong> Quick AI suggestions powered by Inkwell with rate limits.
            Perfect for getting started.
          </li>
          <li>
            <strong>Power Mode:</strong> Use your own API key for unlimited access and advanced
            features. You control the costs.
          </li>
          <li>
            <strong>Security:</strong> Custom API keys are stored locally in your browser and never
            transmitted to Inkwell servers.
          </li>
        </ul>
      </section>
    </div>
  );
}
