# AI Provider System - Simplified Baseline

Inkwell supports multiple AI providers with a curated selection of 7 high-quality models from 3 major providers: OpenAI, Anthropic, and Google.

## Overview

The simplified AI provider system consists of:

- **Provider Adapters**: Implementations for OpenAI, Anthropic, and Google Gemini
- **Provider Registry**: Curated list of 7 models
- **Environment Configuration**: API keys via environment variables
- **AI Service**: Streamlined orchestration layer for generation requests
- **UI Components**: Simple ModelSelector dropdown for model selection

## Quick Start

### Setup

Add your API keys to `.env` file:

```bash
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIza...
```

### Basic Text Generation

```typescript
import { aiService } from '@/ai';

// Generate text using default model (GPT-4o Mini)
const result = await aiService.generate('Write a short story about a dragon');
console.log(result.content);
```

### Choosing a Different Provider

```typescript
import { aiService } from '@/ai';

// Use Anthropic's Claude
const result = await aiService.generate('Write a short story', {
  providerId: 'anthropic',
  modelId: 'claude-3-5-sonnet-20241022',
});

// Use Google's Gemini
const result = await aiService.generate('Write a short story', {
  providerId: 'google',
  modelId: 'gemini-1.5-pro',
});
```

### Streaming Responses

```typescript
import { aiService } from '@/ai';

async function streamExample() {
  for await (const chunk of aiService.generateStream('Tell me a joke')) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
}
```

## Curated Models

The baseline version includes 7 carefully selected models:

### OpenAI (3 models)

| Model           | ID            | Description            | Use Case                 | Pricing                     |
| --------------- | ------------- | ---------------------- | ------------------------ | --------------------------- |
| **GPT-4o Mini** | `gpt-4o-mini` | Fast & affordable      | Quick tasks, high volume | $0.15/$0.60 per 1M tokens   |
| **GPT-4o**      | `gpt-4o`      | Balanced general model | Most applications        | $2.50/$10.00 per 1M tokens  |
| **GPT-4 Turbo** | `gpt-4-turbo` | High reasoning depth   | Complex analysis         | $10.00/$30.00 per 1M tokens |

### Anthropic (2 models)

| Model                 | ID                           | Description        | Use Case        | Pricing                    |
| --------------------- | ---------------------------- | ------------------ | --------------- | -------------------------- |
| **Claude 3 Haiku**    | `claude-3-haiku-20240307`    | Fast summarization | Quick responses | $0.25/$1.25 per 1M tokens  |
| **Claude 3.5 Sonnet** | `claude-3-5-sonnet-20241022` | Strong reasoning   | Complex tasks   | $3.00/$15.00 per 1M tokens |

### Google (2 models)

| Model                | ID                 | Description     | Use Case               | Pricing                    |
| -------------------- | ------------------ | --------------- | ---------------------- | -------------------------- |
| **Gemini 1.5 Flash** | `gemini-1.5-flash` | Low latency     | Real-time applications | $0.075/$0.30 per 1M tokens |
| **Gemini 1.5 Pro**   | `gemini-1.5-pro`   | High capability | Complex reasoning      | $1.25/$5.00 per 1M tokens  |

## API Reference

### AI Service

#### `generate(prompt, options?)`

Generate text from a prompt.

```typescript
interface GenerateOptions {
  providerId?: string; // 'openai' | 'anthropic' | 'google'
  modelId?: string; // Model ID from curated list
  systemMessage?: string; // System instructions
  temperature?: number; // 0-2, default: 0.7
  maxTokens?: number; // Default: 2048
  signal?: AbortSignal; // For cancellation
}

const result = await aiService.generate('Your prompt', {
  providerId: 'openai',
  modelId: 'gpt-4o',
  temperature: 0.9,
  maxTokens: 1000,
});
```

#### `generateStream(prompt, options?)`

Generate text with streaming for progressive display.

```typescript
for await (const chunk of aiService.generateStream('Your prompt', options)) {
  console.log(chunk.content); // Stream chunks as they arrive

  if (chunk.isComplete) {
    console.log('Generation complete');
  }
}
```

#### `testProvider(providerId)`

Test if a provider's API key is configured and valid.

```typescript
const result = await aiService.testProvider('openai');
console.log(result.success); // true/false
console.log(result.error); // Error message if failed
```

### Configuration

#### Get API Key

```typescript
import { getApiKey, hasApiKey } from '@/ai';

// Check if key is available
if (hasApiKey('openai')) {
  const key = getApiKey('openai');
}
```

#### Get Available Providers

```typescript
import { getAvailableProviders } from '@/ai';

// Returns array of provider IDs with configured keys
const available = getAvailableProviders();
// e.g., ['openai', 'anthropic']
```

### Registry Functions

#### Get Curated Models

```typescript
import { getCuratedModels } from '@/ai';

const models = getCuratedModels();
// Returns: Array<{ provider: AIProvider, model: AIModel }>
```

#### Get Default Provider and Model

```typescript
import { getDefaultProviderAndModel } from '@/ai';

const defaults = getDefaultProviderAndModel();
// { providerId: 'openai', modelId: 'gpt-4o-mini' }
```

#### Get Provider by ID

```typescript
import { getProvider } from '@/ai';

const provider = getProvider('openai');
// Returns: AIProvider | undefined
```

## UI Components

### ModelSelector

Simple dropdown component for model selection.

```typescript
import { ModelSelector } from '@/ai';
import { useState } from 'react';

function MyComponent() {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');

  return (
    <ModelSelector
      selectedProvider={provider}
      selectedModel={model}
      onProviderChange={setProvider}
      onModelChange={setModel}
    />
  );
}
```

The component automatically:

- Groups models by provider
- Shows model descriptions
- Displays pricing information
- Auto-selects first model when provider changes
- Shows context window and max output tokens

## Environment Variables

The baseline version uses environment variables for API keys:

```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-...

# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Google AI
VITE_GOOGLE_API_KEY=AIza...
```

**Important**: API keys are read from environment variables at runtime. Make sure to:

1. Never commit `.env` files to version control
2. Add `.env` to `.gitignore`
3. Set environment variables in your deployment platform

## Advanced Options

### Custom Temperature and Max Tokens

```typescript
const result = await aiService.generate('Your prompt', {
  temperature: 0.9, // Higher = more creative (0-2)
  maxTokens: 4000, // Limit response length
});
```

### System Messages

```typescript
const result = await aiService.generate('User question here', {
  systemMessage: 'You are a helpful coding assistant.',
});
```

### Cancellation with AbortSignal

```typescript
const controller = new AbortController();

// Start generation
const promise = aiService.generate('Long task...', {
  signal: controller.signal,
});

// Cancel if needed
setTimeout(() => controller.abort(), 5000);

try {
  await promise;
} catch (error) {
  console.log('Generation cancelled');
}
```

### Streaming with Callback

```typescript
const chunks: string[] = [];

for await (const chunk of aiService.generateStream('Your prompt', {
  onStream: (chunk) => {
    // Called for each chunk
    chunks.push(chunk.content);
  },
})) {
  // Also yields chunks here
}
```

## Error Handling

```typescript
import { AIProviderError, AIKeyError } from '@/ai';

try {
  const result = await aiService.generate('Your prompt');
} catch (error) {
  if (error instanceof AIKeyError) {
    console.error('API key missing or invalid:', error.provider);
  } else if (error instanceof AIProviderError) {
    console.error('Provider error:', error.message);
  }
}
```

Error types:

- `AIKeyError`: Missing or invalid API key
- `AIRateLimitError`: Rate limit exceeded
- `AIQuotaError`: Usage quota exceeded
- `AIProviderError`: General provider error

## Best Practices

### Model Selection

Choose models based on your use case:

**For quick, high-volume tasks:**

- GPT-4o Mini (OpenAI) - Best value
- Gemini 1.5 Flash (Google) - Lowest latency

**For balanced general use:**

- GPT-4o (OpenAI) - Most reliable
- Claude 3.5 Sonnet (Anthropic) - Strong reasoning

**For complex analysis:**

- GPT-4 Turbo (OpenAI) - Deep reasoning
- Gemini 1.5 Pro (Google) - Large context

### Cost Optimization

1. **Use cheaper models for simple tasks**: Start with GPT-4o Mini or Gemini Flash
2. **Monitor token usage**: Lower `maxTokens` when possible
3. **Batch similar requests**: Combine multiple questions into one prompt
4. **Cache results**: Store responses for repeated queries

### Performance

1. **Use streaming for long responses**: Better UX with progressive display
2. **Set appropriate timeouts**: Use `AbortSignal` for long-running requests
3. **Handle errors gracefully**: Always catch and handle provider errors

## Migration from Previous Version

If migrating from the complex version:

**Before** (Complex):

```typescript
import { aiSettingsService } from '@/services/aiSettingsService';

aiSettingsService.setApiKey('openai', 'sk-...');
aiSettingsService.setDefaultProvider('openai', 'gpt-4o');
```

**After** (Simplified):

```bash
# In .env file
VITE_OPENAI_API_KEY=sk-...
```

**Before** (Complex):

```typescript
import { AiModelSettings } from '@/components/Settings/AiModelSettings';

<AiModelSettings />
```

**After** (Simplified):

```typescript
import { ModelSelector } from '@/ai';

<ModelSelector
  selectedProvider={provider}
  selectedModel={model}
  onProviderChange={setProvider}
  onModelChange={setModel}
/>
```

## Future: Advanced Mode

The baseline version focuses on simplicity. A future "Advanced Mode" will add:

- User-managed API keys (no environment variables)
- Custom endpoints (Ollama, LM Studio)
- Additional providers (Mistral, Cohere)
- Usage tracking and cost estimation
- Per-project model selection

This layered approach keeps the baseline simple while allowing future extensibility.
