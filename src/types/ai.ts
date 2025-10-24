export type AiProvider = 'anthropic' | 'openai' | 'google';

export type AiModel =
  // Anthropic
  | 'claude-3-5-sonnet-20241022'
  // OpenAI
  | 'gpt-4o-mini'
  | 'gpt-4o'
  // Google
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro';

export interface AiRequest {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AiResponseChunk {
  content: string;
  done?: boolean;
}

export interface AiSettings {
  mode: 'simple' | 'custom';
  provider: AiProvider;
  model: AiModel;
  customApiKey?: string | null;
}
