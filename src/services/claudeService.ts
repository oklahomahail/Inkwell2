// src/services/claudeService.ts
// Constants for Claude service
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
  
  // Default system prompt for writing assistance
  private readonly DEFAULT_SYSTEM_PROMPT = `You are Claude, an AI writing assistant integrated into Inkwell, a sophisticated writing platform. You help authors with:

- Plot development and story structure
- Character development and dialogue
- Writing style improvement and editing
- Brainstorming and creative inspiration
- Grammar and readability enhancement

Context: The user is working on a writing project. When they select text, you can see it and provide specific feedback. Be concise but helpful, offering actionable suggestions that improve their writing.

Guidelines:
- Keep responses focused and practical
- Offer specific improvements rather than general praise
- When continuing text, match the existing style and tone
- For brainstorming, provide creative but realistic ideas
- Always maintain the author's voice and vision`;

  constructor(config?: Partial<ClaudeServiceConfig>) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
      ...config
    };
  }

  /**
   * Initialize the service with API key
   */
  initialize(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.saveConfig();
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Send a message to Claude
   */
  async sendMessage(content: string, context?: {
    selectedText?: string;
    projectContext?: string;
    conversationHistory?: ClaudeMessage[];
  }): Promise<ClaudeResponse> {
    if (!this.isConfigured()) {
      throw this.createError('Claude API key not configured', 'auth_error', false);
    }

    // Check rate limiting
    if (this.isRateLimited()) {
      throw this.createError('Rate limit exceeded. Please wait before sending another message.', 'rate_limit', true);
    }

    try {
      const messages = this.buildMessageHistory(content, context);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          system: this.config.systemPrompt,
          messages
        })
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      this.updateRateLimit();
      
      return {
        content: data.content[0]?.text || '',
        usage: data.usage ? {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens
        } : undefined
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'ClaudeError') {
        throw error;
      }
      
      // Handle network and other errors
      throw this.createError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'network_error',
        true
      );
    }
  }

  /**
   * Specialized methods for different writing tasks
   */
  async continueText(selectedText: string, projectContext?: string): Promise<string> {
    const prompt = `Continue this text naturally, maintaining the same style and tone:

"${selectedText}"

${projectContext ? `\nProject context: ${projectContext}` : ''}

Provide 1-3 sentences that flow naturally from the selected text.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async improveText(selectedText: string): Promise<string> {
    const prompt = `Improve this text for clarity, flow, and engagement while maintaining the author's voice:

"${selectedText}"

Provide the improved version with brief explanation of key changes.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async analyzeWritingStyle(selectedText: string): Promise<string> {
    const prompt = `Analyze the writing style of this text:

"${selectedText}"

Provide insights on:
- Tone and voice
- Sentence structure patterns
- Strengths and areas for improvement
- Style recommendations

Keep analysis concise and actionable.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async generatePlotIdeas(context?: string): Promise<string> {
    const prompt = context 
      ? `Generate 3-5 plot development ideas based on this context:\n\n"${context}"\n\nProvide creative but realistic plot directions that build on the existing story.`
      : `Generate 5 creative plot ideas for a story. Include brief descriptions of potential conflicts, character arcs, and story directions.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async analyzeCharacter(characterName: string, projectContext?: string): Promise<string> {
    const prompt = `Analyze the character "${characterName}" and provide development suggestions:

${projectContext ? `Project context: ${projectContext}\n` : ''}

Include:
- Character arc potential
- Relationship dynamics
- Growth opportunities
- Potential conflicts or challenges

Provide actionable character development ideas.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async brainstormIdeas(topic: string): Promise<string> {
    const prompt = `Brainstorm creative ideas around this topic: "${topic}"

Provide 5-7 diverse, creative ideas that could enhance a story. Include:
- Unique angles or perspectives
- Potential plot elements
- Character possibilities
- Setting or world-building ideas

Make suggestions specific and usable.`;

    const response = await this.sendMessage(prompt);
    return response.content;
  }

  /**
   * Message management
   */
  saveMessage(message: ClaudeMessage): void {
    const messages = this.getMessages();
    messages.push(message);
    
    // Keep only recent messages to avoid storage bloat
    const recentMessages = messages.slice(-MESSAGE_LIMIT);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentMessages));
    } catch (error) {
      console.warn('Failed to save Claude messages:', error);
    }
  }

  getMessages(): ClaudeMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) : [];
    } catch (error) {
      console.warn('Failed to load Claude messages:', error);
      return [];
    }
  }

  clearMessages(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Configuration management
   */
  updateConfig(updates: Partial<ClaudeServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getConfig(): ClaudeServiceConfig {
    return { ...this.config };
  }

  private saveConfig(): void {
    try {
      // Don't save API key to localStorage for security
      const { apiKey, ...configToSave } = this.config;
      localStorage.setItem('claude_config', JSON.stringify(configToSave));
    } catch (error) {
      console.warn('Failed to save Claude config:', error);
    }
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('claude_config');
      if (stored) {
        const config = JSON.parse(stored);
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.warn('Failed to load Claude config:', error);
    }
  }

  /**
   * Private helper methods
   */
  private buildMessageHistory(content: string, context?: {
    selectedText?: string;
    projectContext?: string;
    conversationHistory?: ClaudeMessage[];
  }): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history (last 10 messages to stay within token limits)
    if (context?.conversationHistory) {
      const recentHistory = context.conversationHistory.slice(-10);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Build current message with context
    let messageContent = content;
    
    if (context?.selectedText) {
      messageContent = `Selected text: "${context.selectedText}"\n\nRequest: ${content}`;
    }
    
    if (context?.projectContext) {
      messageContent += `\n\nProject context: ${context.projectContext}`;
    }

    messages.push({
      role: 'user',
      content: messageContent
    });

    return messages;
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorMessage = `API request failed with status ${response.status}`;
    let errorType: ClaudeError['type'] = 'api_error';
    let retryable = false;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
      
      switch (response.status) {
        case 401:
          errorType = 'auth_error';
          errorMessage = 'Invalid API key. Please check your Claude API key.';
          break;
        case 429:
          errorType = 'rate_limit';
          errorMessage = 'Rate limit exceeded. Please wait before trying again.';
          retryable = true;
          break;
        case 400:
          errorType = 'invalid_request';
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 500:
        case 502:
        case 503:
          errorType = 'api_error';
          errorMessage = 'Claude API is temporarily unavailable. Please try again.';
          retryable = true;
          break;
      }
    } catch {
      // Use default error message if parsing fails
    }

    throw this.createError(errorMessage, errorType, retryable);
  }

  private createError(message: string, type: ClaudeError['type'], retryable: boolean): Error {
    const error = new Error(message);
    error.name = 'ClaudeError';
    (error as any).type = type;
    (error as any).retryable = retryable;
    return error;
  }

  private isRateLimited(): boolean {
    try {
      const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      const now = Date.now();
      
      // Simple rate limiting: 10 requests per minute
      const timeWindow = 60 * 1000; // 1 minute
      const maxRequests = 10;
      
      const recentRequests = data.requests?.filter((timestamp: number) => 
        now - timestamp < timeWindow
      ) || [];
      
      return recentRequests.length >= maxRequests;
    } catch {
      return false;
    }
  }

  private updateRateLimit(): void {
    try {
      const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
      const data = stored ? JSON.parse(stored) : { requests: [] };
      const now = Date.now();
      
      // Keep only recent requests
      const timeWindow = 60 * 1000;
      data.requests = (data.requests || []).filter((timestamp: number) => 
        now - timestamp < timeWindow
      );
      
      data.requests.push(now);
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to update rate limit data:', error);
    }
  }

  /**
   * Utility methods for integration
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize from stored config on construction
   */
  private constructor_init() {
    this.loadConfig();
  }
}



// Create and export the service instance
const claudeService = new ClaudeService();

// Export as default
export default claudeService;
