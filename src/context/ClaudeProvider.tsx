// src/context/ClaudeProvider.tsx - Fixed
import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';

import claudeService from '@/services/claudeService';
import type { ClaudeMessage } from '@/services/claudeService';

interface ClaudeState {
  messages: ClaudeMessage[];
  isLoading: boolean;
  error: string | null;
  isVisible: boolean;
  isConfigured: boolean;
}

interface ClaudeContextValue {
  claude: ClaudeState;
  sendMessage: (_content: string, _selectedText?: string) => Promise<string>;
  clearMessages: () => void;
  toggleVisibility: () => void;
  configureApiKey: (_apiKey: string) => void;
  suggestContinuation: (_selectedText: string) => Promise<string>;
  improveText: (_selectedText: string) => Promise<string>;
  analyzeWritingStyle: (_selectedText: string) => Promise<string>;
  generatePlotIdeas: (_context?: string) => Promise<string>;
  analyzeCharacter: (_characterName: string) => Promise<string>;
  brainstormIdeas: (_topic: string) => Promise<string>;
}

const ClaudeContext = createContext<ClaudeContextValue | null>(null);

export const ClaudeProvider = ({ children }: { children: ReactNode }) => {
  const [claudeState, setClaudeState] = useState<ClaudeState>(() => ({
    messages: claudeService.getMessages(),
    isLoading: false,
    error: null,
    isVisible: false,
    isConfigured: claudeService.isConfigured(),
  }));

  const sendMessage = useCallback(
    async (content: string, selectedText?: string): Promise<string> => {
      if (!claudeService.isConfigured()) {
        setClaudeState((prev) => ({
          ...prev,
          error: 'Claude API key not configured. Please set your API key in settings.',
        }));
        return '';
      }

      setClaudeState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const userMessage: ClaudeMessage = {
          id: claudeService.generateMessageId(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        // Get fresh messages on each call
        const freshMessages = claudeService.getMessages();

        const response = await claudeService.sendMessage(content, {
          selectedText,
          conversationHistory: freshMessages,
        });

        const assistantMessage: ClaudeMessage = {
          id: claudeService.generateMessageId(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        };

        claudeService.saveMessage(userMessage);
        claudeService.saveMessage(assistantMessage);

        setClaudeState((prev) => ({
          ...prev,
          messages: [...prev.messages, userMessage, assistantMessage],
          isLoading: false,
        }));

        return response.content;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message to Claude';
        setClaudeState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return '';
      }
    },
    [],
  );

  const clearMessages = useCallback(() => {
    try {
      claudeService.clearMessages();
      setClaudeState((prev) => ({ ...prev, messages: [] }));
    } catch {
      setClaudeState((prev) => ({ ...prev, messages: [] }));
    }
  }, []);

  const toggleVisibility = useCallback(() => {
    setClaudeState((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  }, []);

  const configureApiKey = useCallback((apiKey: string) => {
    try {
      claudeService.initialize(apiKey);
      setClaudeState((prev) => ({ ...prev, isConfigured: true, error: null }));
    } catch {
      setClaudeState((prev) => ({ ...prev, error: 'Failed to configure API key' }));
    }
  }, []);

  const suggestContinuation = useCallback(async (selectedText: string): Promise<string> => {
    try {
      const response = await claudeService.sendMessage(
        `Please continue this text naturally, maintaining the same tone and style:\n\n"${selectedText}"`,
      );
      return response.content;
    } catch (error) {
      console.error('Failed to suggest continuation:', error);
      throw error;
    }
  }, []);

  const improveText = useCallback(async (selectedText: string): Promise<string> => {
    try {
      const response = await claudeService.sendMessage(
        `Please improve this text for clarity, flow, and engagement while maintaining the original meaning:\n\n"${selectedText}"`,
      );
      return response.content;
    } catch (error) {
      console.error('Failed to improve text:', error);
      throw error;
    }
  }, []);

  const analyzeWritingStyle = useCallback(async (selectedText: string): Promise<string> => {
    try {
      const response = await claudeService.sendMessage(
        `Please analyze the writing style of this text, including tone, voice, pacing, and literary techniques used:\n\n"${selectedText}"`,
      );
      return response.content;
    } catch (error) {
      console.error('Failed to analyze writing style:', error);
      throw error;
    }
  }, []);

  const generatePlotIdeas = useCallback(async (context?: string): Promise<string> => {
    try {
      const prompt = context
        ? `Based on this context: "${context}", generate 5 creative plot ideas or story developments.`
        : 'Generate 5 creative plot ideas for a story. Make them diverse in genre and tone.';

      const response = await claudeService.sendMessage(prompt);
      return response.content;
    } catch (error) {
      console.error('Failed to generate plot ideas:', error);
      throw error;
    }
  }, []);

  const analyzeCharacter = useCallback(async (characterName: string): Promise<string> => {
    try {
      const response = await claudeService.sendMessage(
        `Provide a character analysis framework for "${characterName}". Suggest personality traits, backstory elements, and potential character arcs.`,
      );
      return response.content;
    } catch (error) {
      console.error('Failed to analyze character:', error);
      throw error;
    }
  }, []);

  const brainstormIdeas = useCallback(async (topic: string): Promise<string> => {
    try {
      const response = await claudeService.sendMessage(
        `Let's brainstorm creative ideas around the topic: "${topic}". Provide various angles, themes, and approaches to explore.`,
      );
      return response.content;
    } catch (error) {
      console.error('Failed to brainstorm ideas:', error);
      throw error;
    }
  }, []);

  const contextValue: ClaudeContextValue = {
    claude: claudeState,
    sendMessage,
    clearMessages,
    toggleVisibility,
    configureApiKey,
    suggestContinuation,
    improveText,
    analyzeWritingStyle,
    generatePlotIdeas,
    analyzeCharacter,
    brainstormIdeas,
  };

  return <ClaudeContext.Provider value={contextValue}>{children}</ClaudeContext.Provider>;
};

ClaudeProvider.displayName = 'ClaudeProvider';

export function _useClaude() {
  const context = useContext(ClaudeContext);
  if (!context) throw new Error('useClaude must be used within ClaudeProvider');
  return context;
}

export const useClaude = _useClaude;

export { ClaudeContext };
