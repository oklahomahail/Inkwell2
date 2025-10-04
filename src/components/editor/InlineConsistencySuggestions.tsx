// src/components/editor/InlineConsistencySuggestions.tsx - Inline suggestions and tooltips for consistency issues
import {
  AlertTriangle,
  User,
  MessageSquare,
  Clock,
  Lightbulb,
  X,
  CheckCircle,
  ArrowRight,
  Wand2,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@/context/ToastContext';
import type { CharacterTraitIssue } from '@/services/characterConsistencyAnalyzer';
import claudeService from '@/services/claudeService';
import type { EditorIssue } from '@/services/editorConsistencyDecorator';
import type { VoiceConsistencyWarning } from '@/services/voiceConsistencyService';

// Union type for all consistency issues
type ConsistencyIssue = EditorIssue | CharacterTraitIssue | VoiceConsistencyWarning;

interface InlineConsistencySuggestionsProps {
  issue: ConsistencyIssue;
  position: { x: number; y: number };
  onResolve: (issueId: string, resolution?: string) => void;
  onDismiss: (issueId: string) => void;
  onApplySuggestion: (issueId: string, suggestion: string) => void;
  className?: string;
}

interface AISuggestionResult {
  alternatives: string[];
  explanation: string;
  confidence: number;
}

const issueTypeIcons = {
  character: User,
  voice: MessageSquare,
  phrase: Lightbulb,
  timeline: Clock,
  world: AlertTriangle,
  plot: AlertTriangle,
  'voice-inconsistency': MessageSquare,
  'personality-contradiction': User,
  'behavior-inconsistency': User,
  'voice-mismatch': MessageSquare,
  'relationship-conflict': User,
};

const severityColors = {
  low: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-200',
  medium:
    'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-600 dark:text-orange-200',
  high: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-600 dark:text-red-200',
  critical:
    'bg-red-200 border-red-400 text-red-900 dark:bg-red-900/40 dark:border-red-500 dark:text-red-100',
};

export default function InlineConsistencySuggestions({
  issue,
  position,
  onResolve,
  onDismiss,
  onApplySuggestion,
  className = '',
}: InlineConsistencySuggestionsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestionResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const { showToast } = useToast();
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Auto-position the tooltip to stay within viewport
  useEffect(() => {
    if (suggestionRef.current) {
      const rect = suggestionRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position if tooltip would overflow
      if (rect.right > viewportWidth) {
        adjustedX = Math.max(10, position.x - rect.width);
      }

      // Adjust vertical position if tooltip would overflow
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(10, position.y - rect.height - 10);
      }

      if (adjustedX !== position.x || adjustedY !== position.y) {
        suggestionRef.current.style.left = `${adjustedX}px`;
        suggestionRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [position, showDetails]);

  const IconComponent = issueTypeIcons[issue.type] || AlertTriangle;
  const colorClasses = severityColors[issue.severity];

  const getIssueText = useCallback((): string => {
    if ('textSegment' in issue) {
      return issue.textSegment;
    }
    if ('text' in issue) {
      return issue.text;
    }
    if ('textSample' in issue) {
      return issue.textSample;
    }
    return 'No text available';
  }, [issue]);

  const handleGetAISuggestions = async () => {
    if (!claudeService.isConfigured()) {
      showToast('Claude API not configured', 'error');
      return;
    }

    setIsLoadingAI(true);
    try {
      const issueText = getIssueText();
      const prompt = buildAISuggestionPrompt(issue, issueText);

      const response = await claudeService.sendMessage(prompt, {
        maxTokens: 1500,
      });

      const suggestions = parseAISuggestionsResponse(response.content);
      setAISuggestions(suggestions);
      setShowDetails(true);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      showToast('Failed to get AI suggestions', 'error');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    onApplySuggestion(issue.id, suggestion);
    showToast('Suggestion applied', 'success');
  };

  const handleResolve = () => {
    onResolve(issue.id, selectedSuggestion || undefined);
    showToast('Issue resolved', 'success');
  };

  const handleDismiss = () => {
    onDismiss(issue.id);
  };

  return (
    <div
      ref={suggestionRef}
      className={`fixed z-50 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 ${colorClasses} ${className}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">{issue.title}</h4>
            <p className="text-xs opacity-80 mt-1 line-clamp-2">{issue.description}</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick suggestion from the analysis */}
      {issue.suggestion && (
        <div className="px-3 pb-2">
          <div className="text-xs bg-black/5 dark:bg-white/5 rounded p-2">
            <strong>Suggestion:</strong> {issue.suggestion}
          </div>
        </div>
      )}

      {/* Issue text preview */}
      <div className="px-3 pb-2">
        <div className="text-xs bg-black/10 dark:bg-white/10 rounded p-2 font-mono">
          "{getIssueText().slice(0, 100)}
          {getIssueText().length > 100 ? '...' : ''}"
        </div>
      </div>

      {/* Evidence for character issues */}
      {'evidence' in issue && (
        <div className="px-3 pb-2">
          <details className="text-xs">
            <summary className="cursor-pointer font-medium mb-1">Evidence</summary>
            <div className="bg-black/5 dark:bg-white/5 rounded p-2 space-y-1">
              <div>
                <strong>Established:</strong> {issue.evidence.established}
              </div>
              <div>
                <strong>Contradicting:</strong> {issue.evidence.contradicting}
              </div>
              <div>
                <strong>Location:</strong> {issue.evidence.location}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* AI-powered suggestions */}
      <div className="border-t border-black/10 dark:border-white/10 p-3">
        {!aiSuggestions && !showDetails && (
          <button
            onClick={handleGetAISuggestions}
            disabled={isLoadingAI}
            className="flex items-center gap-2 w-full text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-2 rounded transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            {isLoadingAI ? 'Getting AI suggestions...' : 'Get AI suggestions'}
          </button>
        )}

        {aiSuggestions && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm">AI Suggestions:</h5>
            {aiSuggestions.alternatives.map((suggestion, index) => (
              <div key={index} className="space-y-1">
                <div className="text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                  {suggestion}
                </div>
                <button
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  Apply this suggestion
                </button>
              </div>
            ))}

            {aiSuggestions.explanation && (
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                <strong>Explanation:</strong> {aiSuggestions.explanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-black/10 dark:border-white/10 p-3 flex gap-2">
        <button
          onClick={handleResolve}
          className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200 px-3 py-1.5 rounded transition-colors"
        >
          <CheckCircle className="w-3 h-3" />
          Resolve
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 transition-colors"
        >
          {showDetails ? 'Less' : 'More'}
        </button>
      </div>
    </div>
  );
}

/**
 * Build AI prompt for getting contextual suggestions
 */
function buildAISuggestionPrompt(issue: ConsistencyIssue, issueText: string): string {
  const issueType = issue.type;
  const severity = issue.severity;

  return `You are a writing improvement assistant. Help fix this ${severity} ${issueType} consistency issue.

ISSUE: ${issue.title}
DESCRIPTION: ${issue.description}
CURRENT TEXT: "${issueText}"
EXISTING SUGGESTION: ${issue.suggestion}

Provide 2-3 specific alternative text suggestions that would resolve this consistency issue. Focus on:

${getTypeSpecificGuidance(issueType)}

Respond in this JSON format:
{
  "alternatives": [
    "Alternative text suggestion 1",
    "Alternative text suggestion 2", 
    "Alternative text suggestion 3"
  ],
  "explanation": "Brief explanation of why these alternatives work better",
  "confidence": 0.85
}

Keep suggestions concise and directly applicable to the highlighted text.`;
}

function getTypeSpecificGuidance(issueType: string): string {
  switch (issueType) {
    case 'character':
    case 'personality-contradiction':
    case 'behavior-inconsistency':
      return '- Maintaining character personality consistency\n- Ensuring actions align with established traits\n- Preserving character voice and behavior patterns';

    case 'voice':
    case 'voice-inconsistency':
    case 'voice-mismatch':
      return '- Matching established dialogue patterns\n- Maintaining character-specific speech patterns\n- Ensuring vocabulary and syntax consistency';

    case 'phrase':
      return '- Reducing repetitive phrases\n- Finding fresh alternatives\n- Maintaining flow and readability';

    case 'timeline':
      return '- Correcting chronological inconsistencies\n- Maintaining temporal logic\n- Ensuring event sequencing makes sense';

    case 'relationship-conflict':
      return '- Aligning with established relationships\n- Maintaining character dynamic consistency\n- Ensuring interaction patterns match relationship status';

    default:
      return '- Improving overall consistency\n- Maintaining story logic\n- Enhancing narrative coherence';
  }
}

/**
 * Parse AI response into structured suggestions
 */
function parseAISuggestionsResponse(response: string): AISuggestionResult {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      alternatives: parsed.alternatives || ['Consider revising this text'],
      explanation: parsed.explanation || 'Alternative suggestions provided',
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error('Failed to parse AI suggestions response:', error);

    // Fallback suggestions based on response content
    const lines = response.split('\n').filter((line) => line.trim().length > 0);
    const alternatives = lines
      .slice(0, 3)
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter((alt) => alt.length > 0);

    return {
      alternatives:
        alternatives.length > 0
          ? alternatives
          : ['Consider revising this text for better consistency'],
      explanation: 'Automatic suggestions generated',
      confidence: 0.3,
    };
  }
}
