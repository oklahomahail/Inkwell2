# Enhanced AI Services System

> **Production-ready Claude AI integration with robust error handling, mock modes, and comprehensive monitoring.**

## Overview

The Inkwell AI Services System provides a comprehensive, production-ready integration with AI providers (primarily Claude, with OpenAI and custom endpoint support). The system is built for reliability, demo-friendliness, and excellent user experience.

## Architecture

```
AI Services System
├── 🚀 featureFlagService.ts    # Feature flag management
├── 🎭 mockAIService.ts         # Demo-safe mock responses
├── 🔄 aiRetryService.ts        # Retry logic & circuit breaker
├── ⚙️ aiConfigService.ts       # Multi-provider configuration
├── 📊 aiStatusMonitor.ts       # Real-time health monitoring
└── 📈 analyticsService.ts      # Privacy-first event tracking
```

## Key Features

### 🎭 **Demo-Safe Mock Mode**

- **No API Keys Required**: Full AI functionality for presentations
- **Realistic Responses**: 8+ response types for different AI operations
- **Configurable Delays**: Simulate real API response times
- **Error Simulation**: Test error handling with configurable failure rates

### 🛡️ **Production Reliability**

- **Circuit Breaker Pattern**: Prevents cascading failures
- **Exponential Backoff**: Smart retry logic with jitter
- **Multi-Provider Support**: Claude, OpenAI, custom endpoints
- **Real-time Monitoring**: Health checks and performance metrics

### ⚙️ **Flexible Configuration**

- **Encrypted Storage**: Secure API key management
- **Environment Overrides**: Development vs production settings
- **Validation System**: API key format and connectivity testing
- **Fallback Modes**: Graceful degradation when services unavailable

## Services Detail

### 🚀 Feature Flag Service (`featureFlagService.ts`)

Manages feature toggles for AI functionality with categorized flags and environment overrides.

```typescript
// Enable AI features
featureFlagService.setEnabled('ai_enabled', true);

// Check feature status
if (featureFlagService.isEnabled('ai_mock_mode')) {
  // Use mock responses
}

// Get flags by category
const aiFlags = featureFlagService.getFlagsByCategory('ai');
```

**Categories:**

- `ai`: AI-powered features (Claude integration, mock mode, etc.)
- `performance`: Performance optimizations (virtualization, monitoring)
- `ui`: User interface enhancements (PWA, analytics)
- `experimental`: Beta and demo features

### 🎭 Mock AI Service (`mockAIService.ts`)

Provides realistic AI responses without API costs for demos and development.

```typescript
// Generate mock response
const response = await mockAIService.generateMockResponse('Please improve this dialogue', {
  selectedText: 'Hello world',
});

// Check if mock mode should be active
if (mockAIService.shouldUseMockMode()) {
  // Use mock service
}
```

**Response Types:**

- `general`: General AI assistance
- `continue`: Text continuation
- `improve`: Text improvement suggestions
- `analyze`: Style analysis
- `plot`: Plot ideas and development
- `character`: Character analysis
- `brainstorm`: Creative brainstorming
- `story_outline`: Story structure generation
- `consistency`: Consistency checking

### 🔄 AI Retry Service (`aiRetryService.ts`)

Implements robust retry logic with circuit breaker protection.

```typescript
// Execute operation with retry protection
const result = await aiRetryService.executeWithRetry(async () => {
  return await claudeService.generateResponse(prompt);
}, 'story_generation');

// Get circuit breaker status
const status = aiRetryService.getStatus();
console.log(`Circuit breaker is ${status.state}`);

// Manual reset if needed
if (status.state === 'open') {
  aiRetryService.resetCircuit();
}
```

**Features:**

- **Exponential Backoff**: 1s → 2s → 4s → 8s delays with jitter
- **Circuit Breaker States**: Closed (normal) → Open (failing) → Half-Open (testing)
- **Failure Analysis**: Track error patterns and response times
- **Manual Override**: Reset circuit breaker when needed

### ⚙️ AI Configuration Service (`aiConfigService.ts`)

Manages AI provider configurations with validation and secure storage.

```typescript
// Initialize AI configuration
const result = await aiConfigService.initialize(apiKey, 'claude');

if (result.isValid) {
  console.log('AI configured successfully');
} else {
  console.error('Configuration failed:', result.error);
}

// Update settings
await aiConfigService.updateConfiguration({
  model: 'claude-3-sonnet-20240229',
  temperature: 0.8,
});

// Get current status
const status = aiConfigService.getStatus();
```

**Supported Providers:**

- **Claude (Anthropic)**: Primary integration with all models
- **OpenAI GPT**: GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Custom Endpoints**: Flexible configuration for custom APIs

### 📊 AI Status Monitor (`aiStatusMonitor.ts`)

Real-time monitoring of AI service health with user feedback.

```typescript
// Subscribe to status updates
aiStatusMonitor.subscribe((status) => {
  console.log('AI Status:', status.statusCode);
  updateUIWithStatus(status);
});

// Subscribe to user feedback
aiStatusMonitor.subscribeTo Feedback((feedback) => {
  showUserNotification(feedback);
});

// Get current status
const status = aiStatusMonitor.getStatus();
const recommendations = aiStatusMonitor.getRecommendations();
```

**Monitoring Features:**

- **Health Checks**: Periodic connectivity and performance testing
- **Rate Limit Tracking**: Monitor API usage and limits
- **Circuit Breaker Integration**: Real-time failure state monitoring
- **User Feedback**: Contextual notifications and recommendations

## Configuration

### Environment Variables

```bash
# Development
NODE_ENV=development
VITE_AI_MOCK_MODE=true

# Production
NODE_ENV=production
VITE_AI_MOCK_MODE=false
```

### Feature Flags

Default flags for AI system:

```typescript
{
  ai_enabled: true,              // Enable AI features
  ai_mock_mode: false,           // Use mock responses
  ai_enhanced_toolbar: true,     // Advanced AI tools
  ai_retry_logic: true,          // Retry with backoff
  ai_circuit_breaker: true,      // Circuit breaker protection
}
```

## Usage Patterns

### Basic AI Integration

```typescript
import { aiConfigService, aiRetryService, mockAIService } from './services';

// Check if AI is configured
if (aiConfigService.isConfigured()) {
  // Use real AI
  const response = await aiRetryService.executeWithRetry(() =>
    claudeService.generateResponse(prompt),
  );
} else if (featureFlagService.isEnabled('ai_mock_mode')) {
  // Use mock AI
  const response = await mockAIService.generateMockResponse(prompt);
} else {
  // Prompt user to configure AI
  showAISetupDialog();
}
```

### Error Handling

```typescript
try {
  const response = await aiRetryService.executeWithRetry(
    () => claudeService.generateResponse(prompt),
    'user_request',
  );
  handleSuccess(response);
} catch (error) {
  // Circuit breaker is open or retries exhausted
  if (featureFlagService.isEnabled('ai_mock_mode')) {
    // Fallback to mock
    const mockResponse = await mockAIService.generateMockResponse(prompt);
    handleMockResponse(mockResponse);
  } else {
    // Show error to user
    showErrorMessage('AI temporarily unavailable. Please try again later.');
  }
}
```

### Status Monitoring UI

```typescript
// React component example
function AIStatusIndicator() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    return aiStatusMonitor.subscribe(setStatus);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.statusCode) {
      case 'operational': return 'green';
      case 'degraded': return 'yellow';
      case 'outage': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className={`status-indicator ${getStatusColor(status)}`}>
      {status?.message || 'AI Status Unknown'}
    </div>
  );
}
```

## Testing

### Mock Service Testing

```typescript
// Test mock responses
describe('Mock AI Service', () => {
  it('should provide realistic responses', async () => {
    const response = await mockAIService.generateMockResponse('improve this');
    expect(response.content).toBeDefined();
    expect(response.confidence).toBeGreaterThan(0.7);
  });
});
```

### Circuit Breaker Testing

```typescript
// Test circuit breaker behavior
describe('AI Retry Service', () => {
  it('should open circuit after failures', async () => {
    // Simulate failures
    for (let i = 0; i < 6; i++) {
      try {
        await aiRetryService.executeWithRetry(() => Promise.reject(new Error('API Error')));
      } catch (e) {}
    }

    const status = aiRetryService.getStatus();
    expect(status.state).toBe('open');
  });
});
```

## Analytics & Privacy

The AI services system includes privacy-first analytics tracking:

- **No Personal Data**: Only interaction patterns and performance metrics
- **User Consent**: Analytics can be disabled via feature flags
- **Local Storage**: All analytics data stays on device
- **Aggregate Insights**: Help improve the system without compromising privacy

## Future Enhancements

- **Multi-Model Support**: Support for multiple models per provider
- **Cost Tracking**: Monitor API usage costs
- **Advanced Caching**: Intelligent response caching
- **Streaming Responses**: Real-time response streaming
- **Custom Prompts**: User-defined prompt templates
- **A/B Testing**: Test different AI configurations

## Troubleshooting

### Common Issues

**AI Not Responding**

1. Check if circuit breaker is open: `aiRetryService.getStatus()`
2. Verify API key configuration: `aiConfigService.getStatus()`
3. Enable mock mode for testing: `featureFlagService.setEnabled('ai_mock_mode', true)`

**Rate Limits**

1. Monitor status: `aiStatusMonitor.getStatus()`
2. Enable demo mode temporarily: `featureFlagService.enableDemoMode()`
3. Check rate limit info in status monitor

**Configuration Issues**

1. Verify API key format matches provider requirements
2. Test connectivity: `aiConfigService.validateConfiguration()`
3. Check for environment overrides affecting flags

### Debug Information

Enable debug logging:

```typescript
// In development
localStorage.setItem('inkwell_debug', 'ai,circuit-breaker,config');
```

This comprehensive AI services system ensures reliable, demo-friendly, and user-centric AI integration for Inkwell.
