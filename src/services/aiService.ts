import { useAiSettings } from '@/context/AiSettingsContext';
import type { AiRequest } from '@/types/ai';

import { anthropicComplete } from './providers/anthropicClient';
import { googleComplete } from './providers/googleClient';
import { openaiComplete } from './providers/openaiClient';

export function useAi() {
  const { settings } = useAiSettings();

  async function complete(req: AiRequest): Promise<string> {
    if (settings.mode === 'simple') {
      // Use your server proxy so your app key is never exposed
      const res = await fetch('/api/ai/simple', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...req,
          provider: settings.provider,
          model: settings.model,
        }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Simple AI error ${res.status}: ${error}`);
      }
      const { text } = await res.json();
      return text as string;
    }

    // Custom mode: call provider directly with the user's key
    const key = settings.customApiKey;
    if (!key) throw new Error('No custom API key set');

    if (settings.provider === 'anthropic') {
      return anthropicComplete(key, settings.model, req);
    }
    if (settings.provider === 'openai') {
      return openaiComplete(key, settings.model, req);
    }
    return googleComplete(key, settings.model, req);
  }

  return { complete, settings };
}
