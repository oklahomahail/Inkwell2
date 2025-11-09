# AI Provider System

Inkwell supports multiple AI providers, giving users flexibility to choose between free models or add their own API keys for premium models.

## Overview

The AI provider system consists of:

- **Provider Adapters**: Implementations for OpenAI, Anthropic, and OpenRouter
- **Provider Registry**: Central registry of all available providers
- **Settings Service**: Manages user preferences and encrypted API keys
- **AI Service**: Main orchestration layer for generation requests
- **UI Components**: Settings interface for provider and model selection

## Quick Start

### Using Free Models (No API Key Required)

```typescript
import { aiService } from '@/services/aiService';

// Generate text using default free model (OpenRouter)
const result = await aiService.generate('Write a short story about a dragon');
console.log(result.content);
```

### Using Premium Models with API Keys

```typescript
import { aiSettingsService } from '@/services/aiSettingsService';
import { aiService } from '@/services/aiService';

// Add API key
aiSettingsService.setApiKey('openai', 'sk-...');

// Set as default
aiSettingsService.setDefaultProvider('openai', 'gpt-4o');

// Generate
const result = await aiService.generate('Write a short story');
```

### Streaming Responses

```typescript
import { aiService } from '@/services/aiService';

async function streamExample() {
  for await (const chunk of aiService.generateStream('Tell me a joke')) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
}
```

## Available Providers

### OpenRouter (Recommended for Free Tier)

- **ID**: `openrouter`
- **Requires Key**: No (optional)
- **Free Models**:
  - Gemini 2.0 Flash
  - Llama 3.2 3B
  - Mistral 7B
- **Premium Models**:
  - GPT-4o ($2.50/$10.00 per 1M tokens)
  - Claude 3.5 Sonnet ($3.00/$15.00 per 1M tokens)
  - Gemini Pro 1.5 ($1.25/$5.00 per 1M tokens)
  - Grok Beta ($5.00/$15.00 per 1M tokens)

OpenRouter is a unified gateway to 20+ AI providers. It's perfect for users who want:

- Free access to multiple models without API keys
- Single API key for multiple providers
- Transparent pricing across providers

```typescript
// Use free model (no key required)
await aiService.generate('Hello world', {
  providerId: 'openrouter',
  modelId: 'google/gemini-2.0-flash-exp:free',
});

// Use premium model (requires OpenRouter key)
aiSettingsService.setApiKey('openrouter', 'sk-or-...');
await aiService.generate('Hello world', {
  providerId: 'openrouter',
  modelId: 'anthropic/claude-3.5-sonnet',
});
```

### OpenAI

- **ID**: `openai`
- **Requires Key**: Yes
- **Models**:
  - GPT-4o Mini (Free tier)
  - GPT-4o ($2.50/$10.00 per 1M tokens)
  - GPT-4 Turbo ($10.00/$30.00 per 1M tokens)
  - GPT-3.5 Turbo ($0.50/$1.50 per 1M tokens)

```typescript
aiSettingsService.setApiKey('openai', 'sk-...');
await aiService.generate('Hello world', {
  providerId: 'openai',
  modelId: 'gpt-4o',
});
```

### Anthropic

- **ID**: `anthropic`
- **Requires Key**: Yes
- **Models**:
  - Claude 3.5 Sonnet ($3.00/$15.00 per 1M tokens)
  - Claude 3 Opus ($15.00/$75.00 per 1M tokens)
  - Claude 3 Haiku ($0.25/$1.25 per 1M tokens)

```typescript
aiSettingsService.setApiKey('anthropic', 'sk-ant-...');
await aiService.generate('Hello world', {
  providerId: 'anthropic',
  modelId: 'claude-3-5-sonnet-20241022',
});
```

## API Reference

### AI Service

#### `generate(prompt: string, options?: GenerateOptions): Promise<AIGenerateResult>`

Generate text from a prompt.

**Options:**

- `providerId?: string` - Override default provider
- `modelId?: string` - Override default model
- `systemMessage?: string` - System message/context
- `temperature?: number` - Temperature (0-2, default 0.7)
- `maxTokens?: number` - Max tokens to generate (default 2048)
- `signal?: AbortSignal` - Abort signal for cancellation

**Returns:**

```typescript
{
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}
```

#### `generateStream(prompt: string, options?: GenerateOptions): AsyncIterable<AIStreamChunk>`

Generate text with streaming.

**Returns:** Async iterable of chunks:

```typescript
{
  content: string;
  isComplete: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
```

#### `testProvider(providerId: string, apiKey?: string): Promise<{success: boolean; error?: string}>`

Test provider configuration.

### Settings Service

#### `setDefaultProvider(providerId: string, modelId: string): void`

Set default provider and model.

#### `setApiKey(providerId: string, apiKey: string): void`

Save encrypted API key for provider.

#### `getApiKey(providerId: string): string | undefined`

Get decrypted API key for provider.

#### `hasApiKey(providerId: string): boolean`

Check if provider has API key.

#### `removeApiKey(providerId: string): void`

Remove API key for provider.

#### `updateUsage(providerId: string, promptTokens: number, completionTokens: number): void`

Update usage statistics.

#### `getUsage(providerId: string)`

Get usage stats for provider.

#### `getTotalUsage()`

Get total usage across all providers.

#### `updatePreferences(preferences: Partial<Preferences>): void`

Update user preferences.

**Preferences:**

- `autoFallback: boolean` - Auto-fallback to free models on error
- `temperature: number` - Default temperature
- `maxTokens: number` - Default max tokens
- `trackUsage: boolean` - Track usage statistics

## UI Integration

### Settings Component

```tsx
import { AiModelSettings } from '@/components/Settings/AiModelSettings';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <AiModelSettings />
    </div>
  );
}
```

The `AiModelSettings` component provides:

- Provider selection dropdown
- Model selection dropdown
- API key management with encryption notice
- API key validation and testing
- Usage statistics dashboard
- Preference toggles

## Security

### API Key Encryption

API keys are encrypted client-side before storage using XOR encryption with a fixed key. For production use with sensitive keys, consider:

1. Using Web Crypto API with user-derived keys
2. Storing keys in secure enclaves
3. Using environment variables for server-side keys

```typescript
// Keys are automatically encrypted when saved
aiSettingsService.setApiKey('openai', 'sk-...');

// And decrypted when retrieved
const key = aiSettingsService.getApiKey('openai');
```

### Best Practices

- ✅ Never commit API keys to version control
- ✅ Store keys client-side when possible
- ✅ Use environment variables for server-side keys
- ✅ Implement rate limiting for API calls
- ✅ Monitor usage to prevent quota exhaustion
- ✅ Use free models for testing and development

## Error Handling

### Error Types

```typescript
import { AIKeyError, AIRateLimitError, AIQuotaError, AIProviderError } from '@/ai/types';

try {
  await aiService.generate('Hello');
} catch (error) {
  if (error instanceof AIKeyError) {
    console.error('Invalid or missing API key');
  } else if (error instanceof AIRateLimitError) {
    console.error('Rate limit exceeded, try again later');
  } else if (error instanceof AIQuotaError) {
    console.error('Quota exceeded, upgrade plan or add credits');
  } else if (error instanceof AIProviderError) {
    console.error('Provider error:', error.message);
  }
}
```

### Auto-Fallback

Enable auto-fallback to automatically use free models when premium models fail:

```typescript
aiSettingsService.updatePreferences({ autoFallback: true });

// If OpenAI fails, automatically falls back to free OpenRouter model
try {
  const result = await aiService.generate('Hello', {
    providerId: 'openai',
    modelId: 'gpt-4o',
  });
} catch (error) {
  // Fallback already attempted, handle final error
}
```

## Usage Tracking

### Enable Tracking

```typescript
aiSettingsService.updatePreferences({ trackUsage: true });
```

### View Usage Stats

```typescript
// Per-provider usage
const openaiUsage = aiSettingsService.getUsage('openai');
console.log(openaiUsage);
// {
//   totalTokens: 15000,
//   promptTokens: 10000,
//   completionTokens: 5000,
//   requestCount: 50,
//   lastUsed: '2025-01-15T10:30:00Z'
// }

// Total usage across all providers
const totalUsage = aiSettingsService.getTotalUsage();
console.log(totalUsage);
// {
//   totalTokens: 50000,
//   promptTokens: 30000,
//   completionTokens: 20000,
//   requestCount: 200
// }
```

### Reset Usage

```typescript
// Reset specific provider
aiSettingsService.resetUsage('openai');

// Reset all providers
aiSettingsService.resetUsage();
```

## Advanced Usage

### Custom Temperature and Max Tokens

```typescript
const result = await aiService.generate('Write a creative story', {
  temperature: 0.9, // Higher = more creative
  maxTokens: 4000, // Longer output
});
```

### System Messages

```typescript
const result = await aiService.generate('What is 2+2?', {
  systemMessage: 'You are a helpful math tutor. Explain your reasoning step by step.',
});
```

### Abort Long-Running Requests

```typescript
const controller = new AbortController();

// Start generation
const promise = aiService.generate('Write a very long story', {
  signal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  await promise;
} catch (error) {
  console.log('Request aborted');
}
```

### Per-Document Provider Selection

```typescript
// Store provider preference per document
interface Document {
  id: string;
  content: string;
  aiProvider?: string;
  aiModel?: string;
}

function generateForDocument(doc: Document, prompt: string) {
  return aiService.generate(prompt, {
    providerId: doc.aiProvider || undefined,
    modelId: doc.aiModel || undefined,
  });
}
```

## Testing

Run the AI provider tests:

```bash
pnpm test src/ai/__tests__/providers.test.ts
pnpm test src/services/__tests__/aiService.test.ts
```

## Adding New Providers

To add a new AI provider:

1. **Create provider adapter** in `src/ai/providers/`:

```typescript
// src/ai/providers/myProvider.ts
import { AIProvider, AIModel, AIGenerateOptions, AIGenerateResult } from '../types';

const MY_MODELS: AIModel[] = [
  {
    id: 'my-model-v1',
    name: 'My Model v1',
    description: 'Description',
    isFree: false,
    contextWindow: 8192,
    inputCost: 1.0,
    outputCost: 2.0,
    maxOutputTokens: 4096,
    supportsStreaming: true,
  },
];

export const myProvider: AIProvider = {
  id: 'myprovider',
  name: 'My Provider',
  description: 'My AI provider',
  requiresKey: true,
  models: MY_MODELS,
  defaultModel: 'my-model-v1',

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    // Implementation
  },

  async *generateStream(prompt: string, options?: AIGenerateOptions) {
    // Implementation
  },
};
```

2. **Register in registry** (`src/ai/registry.ts`):

```typescript
import { myProvider } from './providers/myProvider';

export const providers: AIProvider[] = [
  openrouterProvider,
  openaiProvider,
  anthropicProvider,
  myProvider, // Add here
];
```

3. **Add tests** in `src/ai/__tests__/providers.test.ts`

4. **Update documentation**

## Troubleshooting

### "API key required" error

- Make sure you've added an API key for the provider
- Use `aiSettingsService.setApiKey(providerId, key)` to save the key
- Or switch to a free model that doesn't require a key

### "Invalid API key" error

- Verify the key format (OpenAI: `sk-...`, Anthropic: `sk-ant-...`, OpenRouter: `sk-or-...`)
- Use `aiService.testProvider(providerId, key)` to validate
- Check provider dashboard for key status

### "Rate limit exceeded" error

- Wait before retrying (usually 1-60 seconds)
- Enable auto-fallback to switch to free models
- Consider upgrading your provider plan

### Streaming not working

- Verify the model supports streaming (check `model.supportsStreaming`)
- Use `aiService.generateStream()` instead of `aiService.generate()`
- Check browser console for errors

## Examples

See [examples/ai-generation.tsx](../examples/ai-generation.tsx) for complete examples including:

- Basic generation
- Streaming with progress indicators
- Error handling with fallbacks
- Provider switching
- Usage tracking
- Abort/cancel functionality
