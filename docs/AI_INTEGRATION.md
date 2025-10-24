# Two-Tier AI Integration

This document describes Inkwell's two-tier AI integration system that provides both a simple out-of-the-box AI experience and advanced power-user capabilities.

## Overview

Inkwell implements a dual-mode AI system:

1. **Simple Mode**: Built-in AI assistance powered by Inkwell-managed API keys with rate limits
2. **Power Mode**: User-provided API keys for unlimited access and advanced features

## Architecture

### Data Flow

| Mode        | Key Storage            | API Calls              | Cost Model                             | Features                                    |
| ----------- | ---------------------- | ---------------------- | -------------------------------------- | ------------------------------------------- |
| Simple Mode | Inkwell-owned (shared) | Routed through proxy   | Inkwell's cost, capped via rate limits | Basic prompts, small context windows        |
| Power Mode  | User-provided (local)  | Direct to provider API | User's cost                            | Full creative suite, larger context windows |

### Components

#### 1. Type Definitions (`src/types/ai.ts`)

Defines the core types:

- `AiProvider`: Supported providers (anthropic, openai, google)
- `AiModel`: Supported models for each provider
- `AiRequest`: Standard request format
- `AiSettings`: User's AI configuration

#### 2. Settings Context (`src/context/AiSettingsContext.tsx`)

Manages AI settings state:

- Persists settings to localStorage
- Provides hooks for updating configuration
- Defaults to Simple Mode with Claude 3.5 Sonnet

#### 3. Provider Clients (`src/services/providers/`)

Direct API implementations for Power Mode:

- `anthropicClient.ts`: Claude API integration
- `openaiClient.ts`: OpenAI API integration
- `googleClient.ts`: Gemini API integration

#### 4. Unified Service (`src/services/aiService.ts`)

The `useAi()` hook provides a single interface:

```typescript
const { complete } = useAi();
const response = await complete({
  system: 'You are a helpful writing assistant',
  prompt: 'Suggest a title for my story about...',
  temperature: 0.8,
  maxTokens: 300,
});
```

The hook automatically routes to Simple Mode or Power Mode based on user settings.

#### 5. Simple Mode Proxy (`api/ai/simple.ts`)

Edge function that:

- Protects Inkwell's API keys
- Implements rate limiting (20 requests/minute per IP)
- Caps token output (max 1000 tokens)
- Validates input (max 5000 character prompts)

#### 6. Settings UI (`src/components/AI/AiSettingsPanel.tsx`)

User interface for:

- Switching between Simple/Power Mode
- Selecting provider (Claude, OpenAI, Gemini)
- Choosing specific models
- Managing custom API keys (stored locally)

## Usage

### For Users

#### Simple Mode (Default)

1. No configuration needed
2. AI features work out of the box
3. Subject to rate limits
4. Perfect for casual use and getting started

#### Power Mode

1. Go to Settings → AI Writing Companion
2. Switch to "Power Mode"
3. Select your preferred provider
4. Choose a model
5. Enter your API key
6. Key is stored locally and never sent to Inkwell servers

### For Developers

#### Basic Usage

```typescript
import { useAi } from '@/services/aiService';

function MyComponent() {
  const { complete } = useAi();

  const handleSuggest = async () => {
    try {
      const result = await complete({
        system: "You help authors with creative suggestions",
        prompt: "Suggest 3 plot twists for a mystery novel",
        temperature: 0.9,
        maxTokens: 500
      });
      console.log(result);
    } catch (error) {
      console.error('AI request failed:', error);
    }
  };

  return <button onClick={handleSuggest}>Get Suggestions</button>;
}
```

#### Example Hook

See `src/hooks/useSuggestTitle.ts` for a complete example:

```typescript
import { useAi } from '@/services/aiService';

export function useSuggestTitle() {
  const { complete } = useAi();

  return async function suggestTitle(synopsis: string): Promise<string> {
    const text = await complete({
      system: 'You help authors craft concise, evocative working titles...',
      prompt: `Synopsis:\n${synopsis}\n\nGive 5 title options.`,
      temperature: 0.8,
      maxTokens: 300,
    });
    return text;
  };
}
```

## Environment Configuration

### Client-side (.env)

```bash
# Enable custom AI keys feature
VITE_ENABLE_CUSTOM_AI_KEYS=true

# Default provider for Simple Mode
VITE_DEFAULT_SIMPLE_PROVIDER=anthropic

# Default model for Simple Mode
VITE_DEFAULT_SIMPLE_MODEL=claude-3-5-sonnet-20241022
```

### Server-side (Vercel/Production)

Set these in your deployment platform (NOT in .env):

```bash
# Provider to use for Simple Mode
AI_SIMPLE_PROVIDER=anthropic

# API keys (keep secret!)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

## Supported Models

### Anthropic (Claude)

- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet

### OpenAI

- `gpt-4o` - GPT-4o
- `gpt-4o-mini` - GPT-4o mini

### Google (Gemini)

- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

## Security & Privacy

### Simple Mode

- Inkwell's API keys are never exposed to the client
- Requests are proxied through `/api/ai/simple`
- Rate limiting prevents abuse
- Input validation prevents prompt injection

### Power Mode

- User API keys stored in browser's localStorage
- Keys never transmitted to Inkwell servers
- Direct API calls from browser to provider
- Optional encryption can be added for enhanced security

### Rate Limiting

Simple Mode implements basic rate limiting:

- 20 requests per minute per IP
- Can be enhanced with Upstash Redis or similar for production

### Best Practices

1. **Never commit API keys**: Use environment variables
2. **Validate input**: Always sanitize user prompts
3. **Handle errors gracefully**: Network issues, rate limits, invalid keys
4. **Monitor costs**: Track usage in Power Mode
5. **Implement timeouts**: Prevent hanging requests

## Future Enhancements

Potential additions to the system:

1. **Per-project AI preferences**: Different models for different projects
2. **Usage analytics**: Track token usage and costs
3. **Model comparison**: A/B test different models
4. **Streaming responses**: Real-time token streaming
5. **Local models**: Ollama integration for offline use
6. **Advanced rate limiting**: Redis-based distributed rate limiting
7. **API key encryption**: Web Crypto API for enhanced security
8. **Organization accounts**: Team-based API key management

## Testing

### Unit Tests

Mock the `useAiSettings` hook:

```typescript
vi.mock('@/context/AiSettingsContext', () => ({
  useAiSettings: () => ({
    settings: {
      mode: 'simple',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      customApiKey: null,
    },
  }),
}));
```

### Integration Tests

Stub fetch for provider endpoints:

```typescript
global.fetch = vi.fn((url) => {
  if (url.includes('/api/ai/simple')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ text: 'Mock response' }),
    });
  }
});
```

## Troubleshooting

### Common Issues

**Issue**: "Simple AI error 500"

- **Solution**: Check server-side API keys are set in Vercel

**Issue**: "No custom API key set"

- **Solution**: User needs to switch to Power Mode and enter their key

**Issue**: "Rate limit exceeded"

- **Solution**: User should wait or switch to Power Mode

**Issue**: "Invalid API key format"

- **Solution**: Verify key starts with correct prefix (sk-ant-, sk-, AIza)

## Migration Guide

If you have existing Claude integration code:

1. Keep existing ClaudeProvider for backward compatibility
2. New features should use the unified AI service
3. Gradually migrate existing features to use `useAi()`
4. The new system is additive and doesn't break existing code

## Support

For issues or questions:

- Check the Settings panel for connection status
- Review browser console for error messages
- Verify API keys are valid and have sufficient credits
- Test with Simple Mode first to isolate issues
