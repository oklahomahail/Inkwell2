/**
 * AI Generation Examples
 *
 * Examples of using the multi-provider AI system in React components.
 */

import React, { useState } from 'react';

import { aiService, aiSettingsService } from '@/ai';

/**
 * Example 1: Simple text generation
 */
export function SimpleGeneration() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await aiService.generate('Write a short poem about coding');
      setResult(response.content);
    } catch (error) {
      console.error('Generation failed:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Poem'}
      </button>
      {result && <pre>{result}</pre>}
    </div>
  );
}

/**
 * Example 2: Streaming generation with progress
 */
export function StreamingGeneration() {
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStream = async () => {
    setContent('');
    setIsStreaming(true);

    try {
      for await (const chunk of aiService.generateStream('Tell me a short story')) {
        if (chunk.content) {
          setContent((prev) => prev + chunk.content);
        }
        if (chunk.isComplete) {
          break;
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div>
      <button onClick={handleStream} disabled={isStreaming}>
        {isStreaming ? 'Streaming...' : 'Stream Story'}
      </button>
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}

/**
 * Example 3: Provider selection
 */
export function ProviderSelection() {
  const [provider, setProvider] = useState('openrouter');
  const [model, setModel] = useState('google/gemini-2.0-flash-exp:free');
  const [result, setResult] = useState<string>('');

  const handleGenerate = async () => {
    try {
      const response = await aiService.generate('Hello world', {
        providerId: provider,
        modelId: model,
      });
      setResult(`${response.provider}/${response.model}: ${response.content}`);
    } catch (error) {
      console.error('Generation failed:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <select value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option value="openrouter">OpenRouter</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
      <input
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="Model ID"
      />
      <button onClick={handleGenerate}>Generate</button>
      {result && <pre>{result}</pre>}
    </div>
  );
}

/**
 * Example 4: With API key management
 */
export function ApiKeyManagement() {
  const [apiKey, setApiKey] = useState('');
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  const handleSaveKey = (provider: string) => {
    aiSettingsService.setApiKey(provider, apiKey);
    setSavedKeys([...savedKeys, provider]);
    setApiKey('');
  };

  const handleTest = async (provider: string) => {
    const result = await aiService.testProvider(provider);
    alert(result.success ? 'Key is valid!' : `Error: ${result.error}`);
  };

  return (
    <div>
      <h3>API Key Management</h3>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter API key"
      />
      <div>
        <button onClick={() => handleSaveKey('openai')}>Save for OpenAI</button>
        <button onClick={() => handleSaveKey('anthropic')}>Save for Anthropic</button>
      </div>
      <div>
        {savedKeys.map((provider) => (
          <div key={provider}>
            {provider} key saved
            <button onClick={() => handleTest(provider)}>Test</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 5: Usage tracking
 */
export function UsageTracking() {
  const [usage, setUsage] = useState(aiSettingsService.getTotalUsage());

  const refreshUsage = () => {
    setUsage(aiSettingsService.getTotalUsage());
  };

  const resetUsage = () => {
    aiSettingsService.resetUsage();
    refreshUsage();
  };

  return (
    <div>
      <h3>Usage Statistics</h3>
      <div>Total Tokens: {usage.totalTokens}</div>
      <div>Requests: {usage.requestCount}</div>
      <div>Input Tokens: {usage.promptTokens}</div>
      <div>Output Tokens: {usage.completionTokens}</div>
      <button onClick={refreshUsage}>Refresh</button>
      <button onClick={resetUsage}>Reset</button>
    </div>
  );
}

/**
 * Example 6: Abort/Cancel generation
 */
export function CancellableGeneration() {
  const [result, setResult] = useState<string>('');
  const [controller, setController] = useState<AbortController | null>(null);

  const handleGenerate = async () => {
    const abortController = new AbortController();
    setController(abortController);

    try {
      const response = await aiService.generate('Write a very long essay about AI', {
        signal: abortController.signal,
      });
      setResult(response.content);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setResult('Generation cancelled');
      } else {
        setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setController(null);
    }
  };

  const handleCancel = () => {
    controller?.abort();
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={!!controller}>
        Generate
      </button>
      {controller && <button onClick={handleCancel}>Cancel</button>}
      {result && <pre>{result}</pre>}
    </div>
  );
}
