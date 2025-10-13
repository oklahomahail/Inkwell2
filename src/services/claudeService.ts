// src/services/claudeService.ts - FIXED VERSION
import CryptoJS from 'crypto-js';

const MESSAGE_LIMIT = 50;
const API_KEY_STORAGE = 'claude_api_key_encrypted';
const ENCRYPTION_KEY = 'inkwell_claude_key';

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
  text: string;
  content: string;
  trim(): string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ClaudeError extends Error {
  type: 'api_error' | 'network_error' | 'rate_limit' | 'auth_error' | 'invalid_request';
  retryable: boolean;
}

type StatusChangeListener = () => void;

class ClaudeService {
  private listeners: Set<StatusChangeListener> = new Set();
  private config: ClaudeServiceConfig;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private readonly STORAGE_KEY = 'claude_messages';
  private readonly RATE_LIMIT_KEY = 'claude_rate_limit';

  private readonly DEFAULT_SYSTEM_PROMPT = `You are Claude, an AI writing assistant integrated into Inkwell, a creative writing platform. 

Your role is to help writers:
- Develop compelling characters and storylines
- Improve prose style and clarity
- Generate creative ideas and plot developments
- Provide constructive feedback on writing
- Suggest improvements while maintaining the writer's voice

Context: You have access to the user's current project and any selected text. Always consider this context when providing assistance. Be encouraging, creative, and specific in your suggestions.`;

  constructor(config?: Partial<ClaudeServiceConfig>) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4000, // 🔧 Increased for Story Architect
      temperature: 0.7,
      systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
      ...config,
    };
    this.loadConfig();
  }

  initialize(apiKey: string): void {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      throw this.createError('Invalid API key format', 'auth_error', false);
    }

    this.config.apiKey = apiKey;
    this.saveApiKey(apiKey);
    this.saveConfig();
    this.notifyListeners();
  }

  isConfigured(): boolean {
    if (!this.config.apiKey) {
      this.config.apiKey = this.loadApiKey();
    }
    return !!this.config.apiKey;
  }

  addStatusChangeListener(listener: StatusChangeListener): void {
    this.listeners.add(listener);
  }

  removeStatusChangeListener(listener: StatusChangeListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async sendMessage(
    content: string,
    context?: {
      selectedText?: string;
      projectContext?: string;
      conversationHistory?: ClaudeMessage[];
      maxTokens?: number; // 🆕 Allow override for Story Architect
    },
  ): Promise<ClaudeResponse> {
    if (!this.isConfigured()) {
      throw this.createError(
        'Claude API key not configured. Please set your API key in settings.',
        'auth_error',
        false,
      );
    }

    if (this.isRateLimited()) {
      throw this.createError(
        'Rate limit exceeded. Please wait before sending another message.',
        'rate_limit',
        true,
      );
    }

    if (!content.trim()) {
      throw this.createError('Message content cannot be empty', 'invalid_request', false);
    }

    try {
      const messages = this.buildMessageHistory(content, context);

      const requestBody = {
        model: this.config.model,
        max_tokens: context?.maxTokens || this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        messages,
      };

      console.log('🚀 Sending request to Claude API...', {
        model: requestBody.model,
        maxTokens: requestBody.max_tokens,
        messageCount: messages.length,
        contentLength: content.length,
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-api-key': this.config.apiKey!, // 🔧 FIXED: Correct header name
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      this.updateRateLimit();

      console.log('✅ Received response from Claude API', {
        contentLength: data.content?.[0]?.text?.length || 0,
        usage: data.usage,
      });

      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw this.createError('Invalid response format from Claude API', 'api_error', false);
      }

      const responseText = data.content[0]?.text || '';

      return {
        content: responseText,
        text: responseText,
        trim: () => responseText.trim(),
        usage: data.usage
          ? {
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error('❌ Claude API Error:', error);

      if ((error as Error)?.name === 'ClaudeError') {
        throw error;
      }
      throw this.createError(
        `Network error: ${(error as Error)?.message || 'Unknown error'}`,
        'network_error',
        true,
      );
    }
  }

  // 🆕 Story Architect specific method
  async generateStoryOutline(prompt: string): Promise<string> {
    console.log('🎯 Story Architect: Generating outline with Claude API');

    const response = await this.sendMessage(prompt, {
      maxTokens: 4000, // Higher token limit for story generation
    });

    return response.content;
  }

  // Convenience methods for specific writing tasks
  async continueText(selectedText: string): Promise<string> {
    const response = await this.sendMessage(
      `Please continue this text naturally, maintaining the same tone and style:\n\n"${selectedText}"`,
    );
    return response.content;
  }

  async improveText(selectedText: string): Promise<string> {
    const response = await this.sendMessage(
      `Please improve this text for clarity, flow, and engagement while maintaining the original meaning:\n\n"${selectedText}"`,
    );
    return response.content;
  }

  async analyzeWritingStyle(selectedText: string): Promise<string> {
    const response = await this.sendMessage(
      `Please analyze the writing style of this text, including tone, voice, pacing, and literary techniques used:\n\n"${selectedText}"`,
    );
    return response.content;
  }

  async generatePlotIdeas(context?: string): Promise<string> {
    const prompt = context
      ? `Based on this context: "${context}", generate 5 creative plot ideas or story developments.`
      : 'Generate 5 creative plot ideas for a story. Make them diverse in genre and tone.';

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async analyzeCharacter(characterName: string, context?: string): Promise<string> {
    const prompt = context
      ? `Analyze the character "${characterName}" based on this context: "${context}". Discuss their motivations, conflicts, and development potential.`
      : `Provide a character analysis framework for "${characterName}". Suggest personality traits, backstory elements, and potential character arcs.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async brainstormIdeas(topic: string): Promise<string> {
    const response = await this.sendMessage(
      `Let's brainstorm creative ideas around the topic: "${topic}". Provide various angles, themes, and approaches to explore.`,
    );
    return response.content;
  }

  saveMessage(message: ClaudeMessage): void {
    try {
      const messages = this.getMessages().slice(-MESSAGE_LIMIT + 1);
      messages.push(message);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save Claude messages:', e);
    }
    this.notifyListeners();
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
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear messages:', e);
    }
    this.notifyListeners();
  }

  updateConfig(updates: Partial<ClaudeServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getConfig(): ClaudeServiceConfig {
    return { ...this.config };
  }

  private saveApiKey(apiKey: string): void {
    try {
      const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
      localStorage.setItem(API_KEY_STORAGE, encrypted);
    } catch (e) {
      console.warn('Failed to save API key:', e);
    }
  }

  private loadApiKey(): string | undefined {
    try {
      const encrypted = localStorage.getItem(API_KEY_STORAGE);
      if (!encrypted) return undefined;
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.warn('Failed to load API key:', e);
      return undefined;
    }
  }

  private saveConfig(): void {
    try {
      const { apiKey: _apiKey, ...rest } = this.config;
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
      if (!this.config.apiKey) {
        this.config.apiKey = this.loadApiKey();
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
          message = 'Invalid API key. Please check your Claude API key in settings.';
          break;
        case 429:
          errorType = 'rate_limit';
          retryable = true;
          message = 'Rate limit exceeded. Please wait a moment before trying again.';
          break;
        case 400:
          errorType = 'invalid_request';
          break;
        case 500:
        case 502:
        case 503:
          retryable = true;
          message = 'Claude service temporarily unavailable. Please try again.';
          break;
        default:
          message = `Claude API error (${response.status}): ${message}`;
      }
    } catch {
      // Use default message if JSON parsing fails
    }

    throw this.createError(message, errorType, retryable);
  }

  private createError(message: string, type: ClaudeError['type'], retryable: boolean): ClaudeError {
    const error = new Error(message) as ClaudeError;
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
      const maxRequests = 10;

      const recent = (data.requests || []).filter(
        (timestamp: number) => now - timestamp < timeWindow,
      );
      return recent.length >= maxRequests;
    } catch {
      return false;
    }
  }

  private updateRateLimit(): void {
    try {
      const now = Date.now();
      const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
      const data = stored ? JSON.parse(stored) : { requests: [] };

      data.requests = (data.requests || []).filter((timestamp: number) => now - timestamp < 60_000);
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
