// src/context/ClaudeProvider.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types for Claude integration
interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    currentProject?: string;
    activeView?: string;
    selectedText?: string;
  };
}

interface ClaudeContextType {
  // Chat state
  messages: ClaudeMessage[];
  isLoading: boolean;
  isVisible: boolean;

  // Actions
  sendMessage: (message: string, context?: Partial<ClaudeMessage['context']>) => Promise<void>;
  clearMessages: () => void;
  toggleVisibility: () => void;
  setVisible: (visible: boolean) => void;

  // Writing assistance
  suggestContinuation: (currentText: string) => Promise<string>;
  improveText: (text: string, instructions?: string) => Promise<string>;
  analyzeCharacter: (characterName: string, context?: string) => Promise<string>;
  generatePlotIdeas: (currentPlot?: string) => Promise<string>;
}

const ClaudeContext = createContext<ClaudeContextType | undefined>(undefined);

// Custom hook
export const useClaude = (): ClaudeContextType => {
  const context = useContext(ClaudeContext);
  if (!context) {
    throw new Error('useClaude must be used within a ClaudeProvider');
  }
  return context;
};

interface ClaudeProviderProps {
  children: ReactNode;
}

const ClaudeProvider: React.FC<ClaudeProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Generate unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Core Claude API call wrapper
  const callClaude = useCallback(async (prompt: string): Promise<string> => {
    try {
      // Check if window.claude.complete is available
      if (typeof window !== 'undefined' && window.claude?.complete) {
        const response = await window.claude.complete(prompt);
        return response;
      } else {
        // Fallback for development/testing
        console.warn('Claude API not available, using mock response');
        return `Mock response to: ${prompt.substring(0, 50)}...`;
      }
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to get response from Claude');
    }
  }, []);

  // Send a chat message
  const sendMessage = useCallback(
    async (message: string, context?: Partial<ClaudeMessage['context']>) => {
      const userMessage: ClaudeMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        context,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Build context-aware prompt
        let fullPrompt = message;

        if (context) {
          const contextInfo = [];
          if (context.currentProject)
            contextInfo.push(`Current project: ${context.currentProject}`);
          if (context.activeView) contextInfo.push(`Current view: ${context.activeView}`);
          if (context.selectedText) contextInfo.push(`Selected text: "${context.selectedText}"`);

          if (contextInfo.length > 0) {
            fullPrompt = `Context: ${contextInfo.join(', ')}\n\nUser request: ${message}`;
          }
        }

        const response = await callClaude(fullPrompt);

        const assistantMessage: ClaudeMessage = {
          id: generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          context,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: ClaudeMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          context,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [callClaude],
  );

  // Writing assistance functions
  const suggestContinuation = useCallback(
    async (currentText: string): Promise<string> => {
      const prompt = `Based on this writing, suggest a natural continuation that maintains the tone and style:

"${currentText}"

Please provide 2-3 sentences that would logically follow this text, maintaining consistency in voice, tense, and narrative style.`;

      return await callClaude(prompt);
    },
    [callClaude],
  );

  const improveText = useCallback(
    async (text: string, instructions?: string): Promise<string> => {
      const prompt = `Please improve the following text${instructions ? ` with these specific instructions: ${instructions}` : ''}:

"${text}"

Provide an improved version that enhances clarity, flow, and impact while maintaining the original intent and voice.`;

      return await callClaude(prompt);
    },
    [callClaude],
  );

  const analyzeCharacter = useCallback(
    async (characterName: string, context?: string): Promise<string> => {
      const prompt = `Analyze the character "${characterName}"${context ? ` in the context of: ${context}` : ''}.

Please provide insights about:
1. Character motivations and goals
2. Potential character development arcs
3. Relationship dynamics with other characters
4. Opportunities for conflict or growth

Be specific and actionable for a fiction writer.`;

      return await callClaude(prompt);
    },
    [callClaude],
  );

  const generatePlotIdeas = useCallback(
    async (currentPlot?: string): Promise<string> => {
      const prompt = currentPlot
        ? `Given this current plot: "${currentPlot}"

Generate 3-5 potential plot developments, complications, or twists that could enhance the story. Focus on:
1. Raising stakes
2. Character conflicts
3. Unexpected revelations
4. New obstacles or challenges`
        : `Generate 5 compelling plot ideas for a new story. Include:
1. A brief premise
2. Main conflict
3. Potential character types
4. Story hooks

Make them diverse in genre and tone.`;

      return await callClaude(prompt);
    },
    [callClaude],
  );

  // UI actions
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const value: ClaudeContextType = {
    messages,
    isLoading,
    isVisible,
    sendMessage,
    clearMessages,
    toggleVisibility,
    setVisible,
    suggestContinuation,
    improveText,
    analyzeCharacter,
    generatePlotIdeas,
  };

  return <ClaudeContext.Provider value={value}>{children}</ClaudeContext.Provider>;
};

export default ClaudeProvider;
