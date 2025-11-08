# AI Services Developer Guide

> **Production-ready Claude AI integration with robust error handling, mock modes, and comprehensive monitoring.**

## Overview

The Inkwell AI Services System provides a comprehensive, production-ready integration with AI providers (primarily Claude, with OpenAI and custom endpoint support). The system is built for reliability, demo-friendliness, and excellent developer experience.

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

## Core Services

### 🚀 Feature Flag Service

**Location**: `src/services/featureFlagService.ts`

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

### 🎭 Mock AI Service

**Location**: `src/services/mockAIService.ts`

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

### 🔄 AI Retry Service

**Location**: `src/services/aiRetryService.ts`

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

### ⚙️ AI Configuration Service

**Location**: `src/services/aiConfigService.ts`

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

### 📊 AI Status Monitor

**Location**: `src/services/aiStatusMonitor.ts`

Real-time monitoring of AI service health with user feedback.

```typescript
// Subscribe to status updates
aiStatusMonitor.subscribe((status) => {
  console.log('AI Status:', status.statusCode);
  updateUIWithStatus(status);
});

// Subscribe to user feedback
aiStatusMonitor.subscribeToFeedback((feedback) => {
  showUserNotification(feedback);
});

// Get current status
const status = aiStatusMonitor.getStatus();
const recommendations = aiStatusMonitor.getRecommendations();
```

## Development Workflow

### 1. Setting Up AI for Development

```bash
# Clone and install
git clone https://github.com/oklahomahail/Inkwell2
cd Inkwell2
pnpm install

# Enable mock mode for development
echo "VITE_AI_MOCK_MODE=true" >> .env.local

# Start development server
pnpm dev
```

### 2. Testing AI Integration

```typescript
// Basic AI integration pattern
import { aiConfigService, aiRetryService, mockAIService } from '@/services';

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

### 3. Error Handling Patterns

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

### 4. Adding New AI Features

1. **Define Feature Flag**: Add to feature flag service
2. **Implement Service**: Create service in `src/services/`
3. **Add Mock Support**: Extend `mockAIService.ts` with new response types
4. **Update UI**: Create components in `src/components/AI/`
5. **Add Tests**: Create tests in `__tests__/` directories

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

## Component Integration

### AI Writing Toolbar

**Location**: `src/components/Writing/EnhancedAIWritingToolbar.tsx`

```typescript
import { useAIService } from '@/hooks/useAIService';

function AIToolbar() {
  const { generateResponse, isLoading, error } = useAIService();

  const handleImproveText = async () => {
    const response = await generateResponse('improve', selectedText);
    applyTextChanges(response.content);
  };

  return (
    <div className="ai-toolbar">
      <button onClick={handleImproveText} disabled={isLoading}>
        {isLoading ? 'Improving...' : 'Improve Text'}
      </button>
      {error && <span className="error">{error.message}</span>}
    </div>
  );
}
```

### Just-in-Time AI Setup

<!-- **Location**: `src/components/AI/JustInTimeAI.tsx` -->

Contextual AI setup component that appears when AI features are first accessed.

```typescript
import { JustInTimeAI } from '@/components/AI/JustInTimeAI';

function WritingPanel() {
  const { isAIConfigured } = useAIService();

  return (
    <div>
      {!isAIConfigured && <JustInTimeAI onSetup={handleAISetup} />}
      <WritingEditor />
    </div>
  );
}
```

This comprehensive AI services system ensures reliable, demo-friendly, and developer-centric AI integration for Inkwell.
