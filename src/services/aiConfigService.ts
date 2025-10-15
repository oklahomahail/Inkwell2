// src/services/aiConfigService.ts
import CryptoJS from 'crypto-js';

import { aiRetryService } from './aiRetryService';
import { analyticsService } from './analyticsService';
import { featureFlagService } from './featureFlagService';
import { mockAIService } from './mockAIService';

interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  requiredKeyFormat: RegExp;
  maxTokens: number;
  supportsStreaming: boolean;
}

interface AIConfiguration {
  provider: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  customEndpoint?: string;
  timeout: number;
  isValid: boolean;
  validatedAt?: number;
  lastError?: string;
}

interface ValidationResult {
  isValid: boolean;
  provider?: string;
  model?: string;
  error?: string;
  suggestions?: string[];
  capabilities?: string[];
}

class AIConfigurationService {
  private readonly STORAGE_KEY = 'inkwell_ai_config';
  private readonly ENCRYPTION_KEY = 'inkwell_ai_config_key';
  private readonly VALIDATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private config: AIConfiguration | null = null;
  private listeners: Array<(_config: AIConfiguration | null) => void> = [];

  // Supported AI providers
  private readonly PROVIDERS: Record<string, AIProvider> = {
    claude: {
      id: 'claude',
      name: 'Anthropic Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
      requiredKeyFormat: /^sk-ant-api03-[a-zA-Z0-9\-_]{93}AA$/,
      maxTokens: 4000,
      supportsStreaming: true,
    },
    openai: {
      id: 'openai',
      name: 'OpenAI GPT',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
      requiredKeyFormat: /^sk-[a-zA-Z0-9]{48,}$/,
      maxTokens: 4000,
      supportsStreaming: true,
    },
    custom: {
      id: 'custom',
      name: 'Custom Endpoint',
      baseUrl: '',
      models: ['custom-model'],
      requiredKeyFormat: /.*/,
      maxTokens: 4000,
      supportsStreaming: false,
    },
  };

  private readonly DEFAULT_SYSTEM_PROMPT = `You are Claude, an AI writing assistant integrated into Inkwell, a creative writing platform. 

Your role is to help writers:
- Develop compelling characters and storylines
- Improve prose style and clarity  
- Generate creative ideas and plot developments
- Provide constructive feedback on writing
- Suggest improvements while maintaining the writer's voice

Context: You have access to the user's current project and any selected text. Always consider this context when providing assistance. Be encouraging, creative, and specific in your suggestions.`;

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Initialize AI configuration with API key validation
   */
  async initialize(apiKey: string, provider: string = 'claude'): Promise<ValidationResult> {
    try {
      console.log(`🔧 Initializing AI configuration for provider: ${provider}`);

      const validationResult = await this.validateConfiguration(apiKey, provider);

      if (validationResult.isValid) {
        const providerConfig = this.PROVIDERS[provider];
        if (!providerConfig) {
          throw new Error(`Provider configuration not found: ${provider}`);
        }

        this.config = {
          provider,
          apiKey,
          model: providerConfig.models[0] || 'default-model',
          maxTokens: providerConfig.maxTokens,
          temperature: 0.7,
          systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
          timeout: 30000, // 30 seconds
          isValid: true,
          validatedAt: Date.now(),
        };

        await this.saveConfiguration();
        this.notifyListeners();

        analyticsService.track('ai_config_initialized', {
          provider,
          model: this.config.model,
        });

        console.log('✅ AI configuration initialized successfully');
      } else {
        this.config = null;
        await this.clearConfiguration();
        console.warn('❌ AI configuration validation failed:', validationResult.error);
      }

      return validationResult;
    } catch (error) {
      console.error('AI configuration initialization failed:', error);
      return {
        isValid: false,
        error: `Configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Check your API key format',
          'Verify network connectivity',
          'Try again in a moment',
        ],
      };
    }
  }

  /**
   * Validate API key and configuration
   */
  async validateConfiguration(
    apiKey: string,
    provider: string = 'claude',
  ): Promise<ValidationResult> {
    const providerConfig = this.PROVIDERS[provider];
    if (!providerConfig) {
      return {
        isValid: false,
        error: `Unsupported provider: ${provider}`,
        suggestions: ['Choose from: claude, openai, or custom'],
      };
    }

    // Format validation
    if (!providerConfig.requiredKeyFormat.test(apiKey)) {
      return {
        isValid: false,
        error: 'Invalid API key format',
        suggestions: [
          `${providerConfig.name} keys should match the format: ${providerConfig.requiredKeyFormat.source}`,
          'Double-check your API key from the provider dashboard',
        ],
      };
    }

    // Skip actual API validation if in mock mode
    if (featureFlagService.isEnabled('ai_mock_mode')) {
      return {
        isValid: true,
        provider,
        model: providerConfig.models[0],
        capabilities: ['mock_responses', 'demo_mode'],
      };
    }

    // Test API connectivity with retry logic
    try {
      const testResult = await this.testAPIConnectivity(apiKey, provider);
      return testResult;
    } catch (error) {
      return {
        isValid: false,
        error: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Check your internet connection',
          'Verify the API key is active',
          'Check provider service status',
          'Try again in a moment',
        ],
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AIConfiguration | null {
    return this.config;
  }

  /**
   * Update configuration settings
   */
  async updateConfiguration(updates: Partial<AIConfiguration>): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration to update. Initialize first.');
    }

    // Validate model selection
    if (updates.model) {
      const provider = this.PROVIDERS[this.config.provider];
      if (!provider) {
        throw new Error(`Provider configuration not found: ${this.config.provider}`);
      }
      if (!provider.models.includes(updates.model)) {
        throw new Error(`Model ${updates.model} not supported by ${provider.name}`);
      }
    }

    // Validate token limits
    if (updates.maxTokens) {
      const provider = this.PROVIDERS[this.config.provider];
      if (!provider) {
        throw new Error(`Provider configuration not found: ${this.config.provider}`);
      }
      if (updates.maxTokens > provider.maxTokens) {
        updates.maxTokens = provider.maxTokens;
        console.warn(`Token limit capped at ${provider.maxTokens} for ${provider.name}`);
      }
    }

    this.config = { ...this.config, ...updates };
    await this.saveConfiguration();
    this.notifyListeners();

    analyticsService.track('ai_config_updated', {
      provider: this.config.provider,
      updatedFields: Object.keys(updates),
    });
  }

  /**
   * Check if AI is properly configured
   */
  isConfigured(): boolean {
    if (featureFlagService.isEnabled('ai_mock_mode')) {
      return true; // Mock mode is always "configured"
    }

    return !!(this.config?.isValid && this.config.apiKey);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Object.values(this.PROVIDERS);
  }

  /**
   * Get available models for current provider
   */
  getAvailableModels(): string[] {
    if (!this.config) return [];

    const provider = this.PROVIDERS[this.config.provider];
    return provider?.models || [];
  }

  /**
   * Clear configuration and API key
   */
  async clearConfiguration(): Promise<void> {
    const previousProvider = this.config?.provider || 'none';
    this.config = null;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      // Also clear legacy Claude key storage
      localStorage.removeItem('claude_api_key_encrypted');
      localStorage.removeItem('claude_config');
    } catch (error) {
      console.warn('Failed to clear AI configuration storage:', error);
    }

    this.notifyListeners();
    analyticsService.track('ai_config_cleared', {
      previousProvider,
      reason: 'user_requested',
    });
  }

  /**
   * Get configuration status for UI display
   */
  getStatus(): {
    isConfigured: boolean;
    provider?: string;
    model?: string;
    isValid: boolean;
    lastValidated?: string;
    error?: string;
    isMockMode: boolean;
    capabilities: string[];
  } {
    const isMockMode = featureFlagService.isEnabled('ai_mock_mode');

    if (isMockMode) {
      return {
        isConfigured: true,
        provider: 'mock',
        model: 'claude-sonnet-mock',
        isValid: true,
        isMockMode: true,
        capabilities: ['mock_responses', 'demo_safe', 'no_api_costs'],
      };
    }

    if (!this.config) {
      return {
        isConfigured: false,
        isValid: false,
        isMockMode: false,
        capabilities: [],
      };
    }

    const provider = this.PROVIDERS[this.config.provider];
    const capabilities = [];

    if (provider?.supportsStreaming) capabilities.push('streaming');
    if (this.config.maxTokens > 2000) capabilities.push('long_form');
    if (provider?.models && provider.models.length > 1) capabilities.push('model_selection');

    return {
      isConfigured: true,
      provider: this.config.provider,
      model: this.config.model,
      isValid: this.config.isValid,
      lastValidated: this.config.validatedAt
        ? new Date(this.config.validatedAt).toLocaleString()
        : undefined,
      error: this.config.lastError,
      isMockMode: false,
      capabilities,
    };
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(cb: (config: AIConfiguration | null) => void): () => void {
    this.listeners.push(cb);

    // Immediately notify with current config
    cb(this.config);

    return () => {
      const index = this.listeners.indexOf(cb);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Test different fallback modes
   */
  async testFallbackModes(): Promise<{
    mockMode: boolean;
    realAPI: boolean;
    recommendations: string[];
  }> {
    const results = {
      mockMode: false,
      realAPI: false,
      recommendations: [] as string[],
    };

    // Test mock mode
    try {
      const mockResponse = await mockAIService.generateMockResponse('test');
      results.mockMode = !!mockResponse.content;
      if (results.mockMode) {
        results.recommendations.push('Mock mode available for demos and development');
      }
    } catch (error) {
      console.warn('Mock mode test failed:', error);
    }

    // Test real API if configured
    if (this.config?.isValid) {
      try {
        // Use retry service to test real API
        await aiRetryService.executeWithRetry(async () => {
          // This would be replaced with actual API call
          return { content: 'test' };
        }, 'config_test');

        results.realAPI = true;
        results.recommendations.push('Real API connectivity confirmed');
      } catch (error) {
        console.warn('Real API test failed:', error);
        results.recommendations.push('Real API currently unavailable - consider using mock mode');
      }
    } else {
      results.recommendations.push('Configure API key to enable real AI assistance');
    }

    return results;
  }

  // Private methods

  private async testAPIConnectivity(apiKey: string, provider: string): Promise<ValidationResult> {
    const providerConfig = this.PROVIDERS[provider];
    if (!providerConfig) {
      return {
        isValid: false,
        error: `Provider configuration not found: ${provider}`,
      };
    }

    // Mock a test request (replace with actual API calls per provider)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate validation logic
        const isValidFormat = providerConfig.requiredKeyFormat.test(apiKey);

        resolve({
          isValid: isValidFormat,
          provider,
          model: providerConfig.models[0] || 'default-model',
          error: isValidFormat ? undefined : 'Simulated validation failure',
          capabilities: isValidFormat ? ['text_generation', 'creative_writing'] : [],
        });
      }, 1000);
    });
  }

  private async saveConfiguration(): Promise<void> {
    if (!this.config) return;

    try {
      // Encrypt sensitive data
      const sensitiveData = {
        apiKey: this.config.apiKey,
        customEndpoint: this.config.customEndpoint,
      };

      const encryptedSensitive = CryptoJS.AES.encrypt(
        JSON.stringify(sensitiveData),
        this.ENCRYPTION_KEY,
      ).toString();

      // Store non-sensitive config separately
      const publicConfig = {
        provider: this.config.provider,
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
        systemPrompt: this.config.systemPrompt,
        timeout: this.config.timeout,
        isValid: this.config.isValid,
        validatedAt: this.config.validatedAt,
        lastError: this.config.lastError,
      };

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          ...publicConfig,
          _encrypted: encryptedSensitive,
        }),
      );
    } catch (error) {
      console.error('Failed to save AI configuration:', error);
      throw new Error('Failed to save configuration securely');
    }
  }

  private loadConfiguration(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        // Try to migrate from legacy Claude configuration
        this.migrateLegacyConfiguration();
        return;
      }

      const data = JSON.parse(stored);

      if (data._encrypted) {
        // Decrypt sensitive data
        const decrypted = CryptoJS.AES.decrypt(data._encrypted, this.ENCRYPTION_KEY);
        const sensitiveData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

        this.config = {
          ...data,
          apiKey: sensitiveData.apiKey,
          customEndpoint: sensitiveData.customEndpoint,
        };
        delete (this.config as any)._encrypted;
      }

      // Validate configuration is still current
      if (this.config && this.isConfigurationStale()) {
        console.log('AI configuration is stale, clearing...');
        this.config = null;
      }
    } catch (error) {
      console.warn('Failed to load AI configuration:', error);
      this.config = null;
    }
  }

  private migrateLegacyConfiguration(): void {
    try {
      const legacyKey = localStorage.getItem('claude_api_key_encrypted');
      const legacyConfig = localStorage.getItem('claude_config');

      if (legacyKey && legacyConfig) {
        console.log('🔄 Migrating legacy Claude configuration...');

        const decryptedKey = CryptoJS.AES.decrypt(legacyKey, 'inkwell_claude_key');
        const apiKey = decryptedKey.toString(CryptoJS.enc.Utf8);

        if (apiKey) {
          // Create new configuration from legacy data
          this.config = {
            provider: 'claude',
            apiKey,
            model: 'claude-3-sonnet-20240229',
            maxTokens: 4000,
            temperature: 0.7,
            systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
            timeout: 30000,
            isValid: true, // Assume it was valid before
            validatedAt: Date.now(),
          };

          this.saveConfiguration();

          // Clean up legacy storage
          localStorage.removeItem('claude_api_key_encrypted');
          localStorage.removeItem('claude_config');

          console.log('✅ Legacy configuration migrated successfully');
        }
      }
    } catch (error) {
      console.warn('Failed to migrate legacy configuration:', error);
    }
  }

  private isConfigurationStale(): boolean {
    if (!this.config?.validatedAt) return true;

    return Date.now() - this.config.validatedAt > this.VALIDATION_CACHE_DURATION;
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb(this.config);
      } catch (error) {
        console.error('AI configuration listener error:', error);
      }
    });
  }
}

export const aiConfigService = new AIConfigurationService();
export default aiConfigService;
