// src/services/claudeService.ts

const MESSAGE_LIMIT = 50;

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ClaudeServiceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ClaudeError {
  message: string;
  type: 'api_error' | 'network_error' | 'rate_limit' | 'auth_error' | 'invalid_request';
  retryable: boolean;
}

class ClaudeService {
  private config: ClaudeServiceConfig;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private readonly STORAGE_KEY = 'claude_messages';
  private readonly RATE_LIMIT_KEY = 'claude_rate_limit';

  private readonly DEFAULT_SYSTEM_PROMPT =
    'You are Claude, an AI writing assistant integrated into Inkwell...';

  constructor(config?: Partial<ClaudeServiceConfig>) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
      ...config,
    };
    this.loadConfig();
  }

  initialize(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.saveConfig();
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async sendMessage(
    content: string,
    context?: {
      selectedText?: string;
      projectContext?: string;
      conversationHistory?: ClaudeMessage[];
    },
  ): Promise<ClaudeResponse> {
    if (!this.isConfigured()) {
      throw this.createError('Claude API key not configured', 'auth_error', false);
    }

    if (this.isRateLimited()) {
      throw this.createError(
        'Rate limit exceeded. Please wait before sending another message.',
        'rate_limit',
        true,
      );
    }

    try {
      const messages = this.buildMessageHistory(content, context);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          messages,
        }),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      this.updateRateLimit();

      return {
        content: data.content[0]?.text || '',
        usage: data.usage
          ? {
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'ClaudeError') {
        throw error;
      }
      throw this.createError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'network_error',
        true,
      );
    }
  }

  // Writing tools (same as before — you can copy/paste yours or let me know to regenerate)

  saveMessage(message: ClaudeMessage): void {
    const messages = this.getMessages().slice(-MESSAGE_LIMIT + 1);
    messages.push(message);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save Claude messages:', e);
    }
  }

  getMessages(): ClaudeMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
        : [];
    } catch (e) {
      console.warn('Failed to load Claude messages:', e);
      return [];
    }
  }

  clearMessages(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  updateConfig(updates: Partial<ClaudeServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getConfig(): ClaudeServiceConfig {
    return { ...this.config };
  }

  private saveConfig(): void {
    try {
      const { apiKey, ...rest } = this.config;
      void apiKey; // avoid unused var warning
      localStorage.setItem('claude_config', JSON.stringify(rest));
    } catch (e) {
      console.warn('Failed to save config:', e);
    }
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('claude_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load config:', e);
    }
  }

  private buildMessageHistory(
    content: string,
    context?: {
      selectedText?: string;
      projectContext?: string;
      conversationHistory?: ClaudeMessage[];
    },
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (context?.conversationHistory) {
      const recent = context.conversationHistory.slice(-10);
      messages.push(...recent.map((m) => ({ role: m.role, content: m.content })));
    }

    let msgContent = content;
    if (context?.selectedText) {
      msgContent = `Selected text: "${context.selectedText}"\n\nRequest: ${content}`;
    }
    if (context?.projectContext) {
      msgContent += `\n\nProject context: ${context.projectContext}`;
    }

    messages.push({ role: 'user', content: msgContent });
    return messages;
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorType: ClaudeError['type'] = 'api_error';
    let retryable = false;
    let message = `API request failed with status ${response.status}`;

    try {
      const data = await response.json();
      message = data.error?.message || message;
      switch (response.status) {
        case 401:
          errorType = 'auth_error';
          break;
        case 429:
          errorType = 'rate_limit';
          retryable = true;
          break;
        case 400:
          errorType = 'invalid_request';
          break;
        case 500:
        case 502:
        case 503:
          retryable = true;
          break;
      }
    } catch {
      // fallback to default message
    }

    throw this.createError(message, errorType, retryable);
  }

  private createError(
    message: string,
    type: ClaudeError['type'],
    retryable: boolean,
  ): Error & ClaudeError {
    const error = new Error(message) as Error & ClaudeError;
    error.name = 'ClaudeError';
    error.type = type;
    error.retryable = retryable;
    return error;
  }

  private isRateLimited(): boolean {
    try {
      const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
      if (!stored) return false;
      const data = JSON.parse(stored);
      const now = Date.now();
      const timeWindow = 60 * 1000;
      const recent = data.requests?.filter((t: number) => now - t < timeWindow) || [];
      return recent.length >= 10;
    } catch {
      return false;
    }
  }

  private updateRateLimit(): void {
    try {
      const now = Date.now();
      const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
      const data = stored ? JSON.parse(stored) : { requests: [] };
      data.requests = data.requests?.filter((t: number) => now - t < 60_000) || [];
      data.requests.push(now);
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to update rate limit:', e);
    }
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

const claudeService = new ClaudeService();
export default claudeService;
