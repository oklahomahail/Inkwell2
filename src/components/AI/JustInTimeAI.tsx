// src/components/AI/JustInTimeAI.tsx
import { Sparkles, Key, Zap, Info, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

import { aiConfigService } from '../../services/aiConfigService';
import { analyticsService } from '../../services/analyticsService';
import { featureFlagService } from '../../services/featureFlagService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';

interface JustInTimeAIProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: () => void;
  requestedAction: string;
  selectedText?: string;
  projectId?: string;
}

interface AIConfigStep {
  step: 'intro' | 'provider' | 'apikey' | 'testing' | 'complete';
}

export function JustInTimeAI({
  isOpen,
  onClose,
  onConfigured,
  requestedAction,
  selectedText,
  projectId,
}: JustInTimeAIProps) {
  const [currentStep, setCurrentStep] = useState<AIConfigStep['step']>('intro');
  const [selectedProvider, setSelectedProvider] = useState<'claude' | 'openai' | 'mock'>('claude');
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showMockOption, setShowMockOption] = useState(false);

  const handleClose = () => {
    // Track abandonment
    analyticsService.track('ai_setup_abandoned', {
      projectId,
      requestedAction,
      step: currentStep,
      reason: 'user_closed',
    });

    setCurrentStep('intro');
    setApiKey('');
    setValidationError(null);
    onClose();
  };

  const handleUseMock = () => {
    // Enable mock mode
    featureFlagService.setEnabled('ai_mock_mode', true);

    analyticsService.track('ai_setup_mock_selected', {
      projectId,
      requestedAction,
      reason: 'user_choice',
    });

    onConfigured();
    onClose();
  };

  const handleProviderSelect = (provider: 'claude' | 'openai' | 'mock') => {
    setSelectedProvider(provider);

    if (provider === 'mock') {
      handleUseMock();
      return;
    }

    analyticsService.track('ai_provider_selected', {
      provider,
      projectId,
      requestedAction,
    });

    setCurrentStep('apikey');
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await aiConfigService.initialize(apiKey, selectedProvider);

      if (result.isValid) {
        analyticsService.track('ai_setup_completed', {
          provider: selectedProvider,
          projectId,
          requestedAction,
          setupDuration: Date.now() - Date.now(), // Would track actual duration
        });

        setCurrentStep('complete');
        setTimeout(() => {
          onConfigured();
          onClose();
        }, 2000);
      } else {
        setValidationError(result.error || 'Configuration failed');

        // Show mock option as fallback
        if (!showMockOption) {
          setShowMockOption(true);
        }
      }
    } catch (_error) {
      setValidationError('Failed to connect to AI service');
      setShowMockOption(true);
    } finally {
      setIsValidating(false);
    }
  };

  const getProviderInfo = (provider: 'claude' | 'openai') => {
    switch (provider) {
      case 'claude':
        return {
          name: 'Anthropic Claude',
          description: 'Advanced AI assistant optimized for creative writing',
          keyFormat: 'sk-ant-api03-...',
          signupUrl: 'https://console.anthropic.com/',
          recommended: true,
        };
      case 'openai':
        return {
          name: 'OpenAI GPT',
          description: 'Popular AI model with broad capabilities',
          keyFormat: 'sk-...',
          signupUrl: 'https://platform.openai.com/',
          recommended: false,
        };
    }
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Try AI-powered writing assistance</h3>
        <p className="text-gray-600">
          You wanted to "{requestedAction}". Let's set up AI to help with that.
        </p>
      </div>

      {selectedText && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Your selected text:</p>
          <p className="text-gray-800 italic">
            "{selectedText.substring(0, 100)}
            {selectedText.length > 100 ? '...' : ''}"
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button onClick={() => setCurrentStep('provider')} className="w-full" size="lg">
          <Key className="w-4 h-4 mr-2" />
          Set up AI (2 minutes)
        </Button>

        <Button variant="outline" onClick={handleUseMock} className="w-full">
          <Zap className="w-4 h-4 mr-2" />
          Try demo mode instead
        </Button>
      </div>

      <div className="text-center">
        <button onClick={handleClose} className="text-sm text-gray-500 hover:text-gray-700">
          Maybe later
        </button>
      </div>
    </div>
  );

  const renderProviderStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose your AI provider</h3>
        <p className="text-gray-600">
          Select the AI service you'd like to use for writing assistance.
        </p>
      </div>

      <div className="space-y-3">
        {(['claude', 'openai'] as const).map((provider) => {
          const info = getProviderInfo(provider);
          return (
            <button
              key={provider}
              onClick={() => handleProviderSelect(provider)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 focus:border-blue-500 focus:outline-none transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{info.name}</span>
                    {info.recommended && (
                      <Badge variant="default" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          );
        })}

        {/* Mock option */}
        <button
          onClick={() => handleProviderSelect('mock')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 focus:border-green-500 focus:outline-none transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">Demo Mode</span>
                <Badge variant="secondary" className="text-xs">
                  No setup required
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Try AI features with realistic mock responses</p>
            </div>
            <Zap className="w-4 h-4 text-green-600" />
          </div>
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep('intro')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>
    </div>
  );

  const renderApiKeyStep = () => {
    const info = getProviderInfo(selectedProvider);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Connect to {info.name}</h3>
          <p className="text-gray-600">Enter your API key to enable AI assistance.</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={info.keyFormat}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your key is stored securely and never shared.
            </p>
          </div>

          {validationError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          {showMockOption && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Having trouble? You can{' '}
                    <button
                      onClick={handleUseMock}
                      className="font-medium text-blue-600 hover:text-blue-700 underline"
                    >
                      try demo mode instead
                    </button>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleApiKeySubmit}
            disabled={!apiKey.trim() || isValidating}
            className="w-full"
            size="lg"
          >
            {isValidating ? 'Testing connection...' : 'Connect AI'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Don't have an API key?{' '}
            <a
              href={info.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              Sign up for {info.name} →
            </a>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentStep('provider')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
      <div>
        <h3 className="text-lg font-semibold mb-2">AI is ready!</h3>
        <p className="text-gray-600">Returning to your text to "{requestedAction}"</p>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return renderIntroStep();
      case 'provider':
        return renderProviderStep();
      case 'apikey':
        return renderApiKeyStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderIntroStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {currentStep === 'complete' ? 'Setup Complete!' : 'AI Writing Assistant'}
            </h2>
            {currentStep !== 'complete' && (
              <p className="text-sm text-gray-600 mt-1">
                Quick setup to enable "{requestedAction}" and other AI features.
              </p>
            )}
          </div>

          {getStepContent()}
        </div>
      </div>
    </Dialog>
  );
}

// Hook for managing just-in-time AI flow
export function useJustInTimeAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{
    action: string;
    selectedText?: string;
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);

  const requestAIAction = async (action: string, selectedText?: string, projectId?: string) => {
    // Check if AI is already configured
    if (aiConfigService.isConfigured() || featureFlagService.isEnabled('ai_mock_mode')) {
      return Promise.resolve();
    }

    // Track the request
    analyticsService.track('ai_action_requested', {
      action,
      hasSelectedText: !!selectedText,
      projectId,
    });

    return new Promise<void>((resolve, reject) => {
      setPendingRequest({ action, selectedText, resolve, reject });
      setIsOpen(true);
    });
  };

  const handleConfigured = () => {
    if (pendingRequest) {
      pendingRequest.resolve();
      setPendingRequest(null);
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    if (pendingRequest) {
      pendingRequest.reject(new Error('AI setup cancelled'));
      setPendingRequest(null);
    }
    setIsOpen(false);
  };

  const JustInTimeDialog = pendingRequest ? (
    <JustInTimeAI
      isOpen={isOpen}
      onClose={handleClose}
      onConfigured={handleConfigured}
      requestedAction={pendingRequest.action}
      selectedText={pendingRequest.selectedText}
    />
  ) : null;

  return {
    requestAIAction,
    JustInTimeDialog,
  };
}
