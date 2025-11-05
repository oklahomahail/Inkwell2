import { useCallback } from 'react';

import { useAppContext } from '@/context/AppContext';

export interface AssistantActions {
  suggestContinuation: (_text: string) => Promise<void>;
  improveText: (_text: string, _goal?: string) => Promise<void>;
  analyzeStyle: (_text: string) => Promise<void>;
  brainstorm: (_topic: string) => Promise<void>;
  send: (_message: string) => Promise<void>;
  clear: () => void;
  toggle: () => void;
}

export default function useWritingAssistant(): AssistantActions {
  const { claudeActions } = useAppContext();

  const send = useCallback(
    async (message: string) => {
      await claudeActions.sendMessage(message);
    },
    [claudeActions],
  );

  const clear = useCallback(() => {
    claudeActions.clearMessages();
  }, [claudeActions]);

  const toggle = useCallback(() => {
    claudeActions.toggleVisibility();
  }, [claudeActions]);

  const suggestContinuation = useCallback(
    async (text: string) => {
      await claudeActions.suggestContinuation(text);
    },
    [claudeActions],
  );

  const improveText = useCallback(
    async (text: string, _goal?: string) => {
      await claudeActions.improveText(text, undefined);
    },
    [claudeActions],
  );

  const analyzeStyle = useCallback(
    async (text: string) => {
      await claudeActions.analyzeWritingStyle(text);
    },
    [claudeActions],
  );

  const brainstorm = useCallback(
    async (topic: string) => {
      await claudeActions.brainstormIdeas(topic);
    },
    [claudeActions],
  );

  return { suggestContinuation, improveText, analyzeStyle, brainstorm, send, clear, toggle };
}
