// src/components/Writing/EnhancedAIWritingToolbar.tsx - Advanced AI-powered writing assistance toolbar
import {
  Sparkles,
  Heart,
  MessageSquare,
  TrendingUp,
  Palette,
  Brain,
  Settings,
  Play,
  Pause,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/toast';
import claudeService from '@/services/claudeService';

interface EnhancedAIWritingToolbarProps {
  selectedText?: string;
  onInsertText?: (text: string, replaceSelection?: boolean) => void;
  sceneTitle?: string;
  currentContent?: string;
  projectContext?: string;
  position?: 'panel' | 'popup';
  onClose?: () => void;
  className?: string;
}

interface AdvancedTool {
  id: string;
  name: string;
  icon: React.ComponentType;
  category: 'tone' | 'pacing' | 'emotion' | 'dialogue' | 'analysis';
  description: string;
  requiresSelection?: boolean;
  isRealTime?: boolean;
  isPremium?: boolean;
}

interface AIAnalysisResult {
  score: number;
  issues: string[];
  suggestions: string[];
  improvements: string[];
  confidence: number;
}

interface ToneAdjustmentResult {
  originalTone: string;
  newTone: string;
  adjustedText: string;
  explanation: string;
}

const TONE_OPTIONS = [
  { id: 'mysterious', label: 'Mysterious', description: 'Dark, suspenseful, intriguing' },
  { id: 'romantic', label: 'Romantic', description: 'Warm, intimate, emotional' },
  { id: 'action', label: 'Action-Packed', description: 'Fast-paced, intense, dynamic' },
  { id: 'comedic', label: 'Comedic', description: 'Light, humorous, entertaining' },
  { id: 'dramatic', label: 'Dramatic', description: 'Serious, emotional, impactful' },
  { id: 'contemplative', label: 'Contemplative', description: 'Thoughtful, reflective, deep' },
  { id: 'tense', label: 'Tense', description: 'Anxious, suspenseful, on-edge' },
  { id: 'melancholic', label: 'Melancholic', description: 'Sad, wistful, bittersweet' },
];

const EMOTION_LEVELS = [
  { id: 'subtle', label: 'Subtle', intensity: 1 },
  { id: 'moderate', label: 'Moderate', intensity: 2 },
  { id: 'strong', label: 'Strong', intensity: 3 },
  { id: 'intense', label: 'Intense', intensity: 4 },
];

export default function EnhancedAIWritingToolbar({
  selectedText = '',
  onInsertText,
  sceneTitle = '',
  currentContent = '',
  projectContext = '',
  position = 'panel',
  onClose,
  className = '',
}: EnhancedAIWritingToolbarProps) {
  const { claudeActions: _claudeActions } = useAppContext();
  const { showToast } = useToast();

  // State management
  const [activeCategory, setActiveCategory] = useState<
    'tone' | 'pacing' | 'emotion' | 'dialogue' | 'analysis'
  >('tone');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AIAnalysisResult>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [emotionLevel, setEmotionLevel] = useState<string>('moderate');
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const realTimeAnalysisRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced AI Tools Configuration
  const _advancedTools: AdvancedTool[] = [
    {
      id: 'tone-adjustment',
      name: 'Tone Adjustment',
      icon: Palette,
      category: 'tone',
      description: 'Dynamically adjust the emotional tone of your writing',
      requiresSelection: true,
    },
    {
      id: 'pacing-analysis',
      name: 'Pacing Analysis',
      icon: TrendingUp,
      category: 'pacing',
      description: 'Analyze and optimize story rhythm and flow',
      isRealTime: true,
    },
    {
      id: 'emotion-enhancement',
      name: 'Emotion Enhancement',
      icon: Heart,
      category: 'emotion',
      description: 'Deepen emotional resonance and character feelings',
      requiresSelection: true,
    },
    {
      id: 'dialogue-optimization',
      name: 'Dialogue Optimization',
      icon: MessageSquare,
      category: 'dialogue',
      description: 'Improve conversation flow and character voice',
      requiresSelection: true,
    },
    {
      id: 'comprehensive-analysis',
      name: 'Comprehensive Analysis',
      icon: BarChart3,
      category: 'analysis',
      description: 'Complete writing analysis with actionable insights',
      isRealTime: true,
    },
  ];

  const performRealTimeAnalysis = useCallback(
    async (text: string) => {
      if (!claudeService.isConfigured() || !text.trim()) return;

      setIsAnalyzing(true);

      try {
        const analysisPrompt = buildComprehensiveAnalysisPrompt(text, sceneTitle, projectContext);
        const response = await claudeService.sendMessage(analysisPrompt, {
          maxTokens: 3000,
        });

        const results = parseAnalysisResponse(response.content);
        setAnalysisResults((prev) => ({
          ...prev,
          [activeCategory]: results,
        }));
      } catch (error) {
        console.error('Real-time analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sceneTitle, projectContext, activeCategory],
  );

  // Real-time analysis effect
  useEffect(() => {
    if (isRealTimeMode && currentContent) {
      if (realTimeAnalysisRef.current) {
        clearTimeout(realTimeAnalysisRef.current);
      }

      realTimeAnalysisRef.current = setTimeout(() => {
        performRealTimeAnalysis(currentContent);
      }, 2000); // Debounce for 2 seconds
    }

    return () => {
      if (realTimeAnalysisRef.current) {
        clearTimeout(realTimeAnalysisRef.current);
      }
    };
  }, [currentContent, isRealTimeMode, performRealTimeAnalysis]);

  const handleToneAdjustment = useCallback(
    async (targetTone: string) => {
      if (!selectedText || !claudeService.isConfigured()) {
        showToast('Please select text and ensure Claude is configured', 'error');
        return;
      }

      setIsAnalyzing(true);

      try {
        const tonePrompt = buildToneAdjustmentPrompt(selectedText, targetTone, sceneTitle);
        const response = await claudeService.sendMessage(tonePrompt, {
          maxTokens: 2000,
        });

        const result = parseToneAdjustmentResponse(response.content);
        setGeneratedContent(result.adjustedText);
        showToast(`Tone adjusted to ${targetTone}`, 'success');
      } catch (error) {
        console.error('Tone adjustment failed:', error);
        showToast('Tone adjustment failed', 'error');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [selectedText, sceneTitle, showToast],
  );

  const handleEmotionEnhancement = useCallback(
    async (intensity: string) => {
      if (!selectedText || !claudeService.isConfigured()) {
        showToast('Please select text and ensure Claude is configured', 'error');
        return;
      }

      setIsAnalyzing(true);

      try {
        const emotionPrompt = buildEmotionEnhancementPrompt(selectedText, intensity, sceneTitle);
        const response = await claudeService.sendMessage(emotionPrompt, {
          maxTokens: 2000,
        });

        setGeneratedContent(response.content);
        showToast('Emotional depth enhanced', 'success');
      } catch (error) {
        console.error('Emotion enhancement failed:', error);
        showToast('Emotion enhancement failed', 'error');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [selectedText, sceneTitle, showToast],
  );

  const handleDialogueOptimization = useCallback(async () => {
    if (!selectedText || !claudeService.isConfigured()) {
      showToast('Please select dialogue text and ensure Claude is configured', 'error');
      return;
    }

    setIsAnalyzing(true);

    try {
      const dialoguePrompt = buildDialogueOptimizationPrompt(selectedText, projectContext);
      const response = await claudeService.sendMessage(dialoguePrompt, {
        maxTokens: 2500,
      });

      setGeneratedContent(response.content);
      showToast('Dialogue optimized', 'success');
    } catch (error) {
      console.error('Dialogue optimization failed:', error);
      showToast('Dialogue optimization failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedText, projectContext, showToast]);

  const handlePacingAnalysis = useCallback(async () => {
    if (!currentContent || !claudeService.isConfigured()) {
      showToast('Please ensure there is content to analyze and Claude is configured', 'error');
      return;
    }

    setIsAnalyzing(true);

    try {
      const pacingPrompt = buildPacingAnalysisPrompt(currentContent, sceneTitle);
      const response = await claudeService.sendMessage(pacingPrompt, {
        maxTokens: 2500,
      });

      const results = parseAnalysisResponse(response.content);
      setAnalysisResults((prev) => ({
        ...prev,
        pacing: results,
      }));

      showToast('Pacing analysis complete', 'success');
    } catch (error) {
      console.error('Pacing analysis failed:', error);
      showToast('Pacing analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentContent, sceneTitle, showToast]);

  const handleApplyGeneration = useCallback(
    (replaceSelection = false) => {
      if (!onInsertText || !generatedContent) return;

      onInsertText(generatedContent, replaceSelection);
      setGeneratedContent('');
      showToast('Content applied to editor', 'success');
    },
    [onInsertText, generatedContent, showToast],
  );

  const renderToneAdjustmentPanel = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Select Target Tone</h4>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.id}
              onClick={() => {
                setSelectedTone(tone.id);
                handleToneAdjustment(tone.id);
              }}
              disabled={isAnalyzing}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedTone === tone.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium text-sm">{tone.label}</div>
              <div className="text-xs text-gray-600 mt-1">{tone.description}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedText && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-2">Selected Text:</div>
          <div className="text-sm font-mono">
            "{selectedText.slice(0, 150)}
            {selectedText.length > 150 ? '...' : ''}"
          </div>
        </div>
      )}
    </div>
  );

  const renderEmotionEnhancementPanel = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Emotional Intensity Level</h4>
        <div className="space-y-2">
          {EMOTION_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => {
                setEmotionLevel(level.id);
                handleEmotionEnhancement(level.id);
              }}
              disabled={isAnalyzing}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                emotionLevel === level.id
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{level.label}</span>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < level.intensity ? 'bg-rose-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>Tip:</strong> Higher intensity levels add more emotional language, internal
            thoughts, and physical reactions to convey deeper feelings.
          </div>
        </div>
      </div>
    </div>
  );

  const renderPacingAnalysisPanel = () => {
    const pacingResults = analysisResults.pacing;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Pacing Analysis</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRealTimeMode(!isRealTimeMode)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                isRealTimeMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isRealTimeMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              Real-time
            </button>
            <button
              onClick={handlePacingAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Analyze
            </button>
          </div>
        </div>

        {pacingResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pacing Score:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pacingResults.score}%` }}
                />
              </div>
              <span className="text-sm font-mono">{pacingResults.score}/100</span>
            </div>

            {pacingResults.issues.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-red-600 mb-2">Issues Found:</h5>
                <ul className="space-y-1">
                  {pacingResults.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pacingResults.suggestions.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-blue-600 mb-2">Suggestions:</h5>
                <ul className="space-y-1">
                  {pacingResults.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!pacingResults && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Analyze" to get pacing insights</p>
          </div>
        )}
      </div>
    );
  };

  const renderDialogueOptimizationPanel = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Dialogue Optimization</h4>
        <p className="text-sm text-gray-600 mb-4">
          Improve conversation flow, character voice, and dialogue authenticity
        </p>
        <button
          onClick={handleDialogueOptimization}
          disabled={isAnalyzing || !selectedText}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageSquare className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
          {isAnalyzing ? 'Optimizing...' : 'Optimize Selected Dialogue'}
        </button>
      </div>

      {!selectedText && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-sm text-amber-800">
            Select dialogue text in your editor to optimize character conversations
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h5 className="text-sm font-medium">Optimization Focus Areas:</h5>
        <ul className="space-y-1 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-green-500" />
            Character voice consistency
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-green-500" />
            Natural conversation flow
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-green-500" />
            Subtext and tension
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-green-500" />
            Dialogue tags and action beats
          </li>
        </ul>
      </div>
    </div>
  );

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-sm">Generated Content</h5>
          <div className="flex gap-2">
            <button
              onClick={() => handleApplyGeneration(false)}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Insert
            </button>
            <button
              onClick={() => handleApplyGeneration(true)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Replace
            </button>
            <button
              onClick={() => setGeneratedContent('')}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-40 overflow-y-auto">
          {generatedContent}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg">Enhanced AI Toolkit</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          {position === 'popup' && onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'tone', label: 'Tone', icon: Palette },
          { id: 'emotion', label: 'Emotion', icon: Heart },
          { id: 'pacing', label: 'Pacing', icon: TrendingUp },
          { id: 'dialogue', label: 'Dialogue', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeCategory === id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div className="p-4">
        {isAnalyzing && (
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <Brain className="w-4 h-4 animate-pulse" />
            <span className="text-sm">AI is analyzing...</span>
          </div>
        )}

        {activeCategory === 'tone' && renderToneAdjustmentPanel()}
        {activeCategory === 'emotion' && renderEmotionEnhancementPanel()}
        {activeCategory === 'pacing' && renderPacingAnalysisPanel()}
        {activeCategory === 'dialogue' && renderDialogueOptimizationPanel()}

        {renderGeneratedContent()}
      </div>
    </div>
  );
}

// AI Prompt Building Functions
function buildToneAdjustmentPrompt(text: string, targetTone: string, sceneTitle: string): string {
  const toneDescriptions = {
    mysterious: 'dark, suspenseful, intriguing with hidden meanings',
    romantic: 'warm, intimate, emotional with tender feelings',
    action: 'fast-paced, intense, dynamic with urgency',
    comedic: 'light, humorous, entertaining with wit',
    dramatic: 'serious, emotional, impactful with gravitas',
    contemplative: 'thoughtful, reflective, deep with introspection',
    tense: 'anxious, suspenseful, on-edge with unease',
    melancholic: 'sad, wistful, bittersweet with longing',
  };

  return `You are a tone adjustment specialist. Rewrite the following text to match the target tone while preserving the core meaning and narrative function.

SCENE CONTEXT: ${sceneTitle}
TARGET TONE: ${targetTone} (${toneDescriptions[targetTone as keyof typeof toneDescriptions] || targetTone})

ORIGINAL TEXT:
"${text}"

REQUIREMENTS:
- Maintain the essential plot points and character actions
- Adjust vocabulary, sentence structure, and imagery to match the target tone
- Ensure the new tone feels natural and not forced
- Keep the same general length as the original

Respond with only the rewritten text, maintaining proper formatting.`;
}

function buildEmotionEnhancementPrompt(
  text: string,
  intensity: string,
  sceneTitle: string,
): string {
  const intensityGuidance = {
    subtle: 'Add gentle emotional undertones without overwhelming the narrative',
    moderate: 'Include clear emotional depth with internal thoughts and reactions',
    strong: 'Emphasize emotions with vivid descriptions and character vulnerability',
    intense: 'Create powerful emotional impact with visceral reactions and deep introspection',
  };

  return `You are an emotional depth specialist. Enhance the following text with deeper emotional resonance while maintaining narrative flow.

SCENE CONTEXT: ${sceneTitle}
INTENSITY LEVEL: ${intensity}
GUIDANCE: ${intensityGuidance[intensity as keyof typeof intensityGuidance]}

ORIGINAL TEXT:
"${text}"

ENHANCEMENT TECHNIQUES:
- Add internal emotional responses and thoughts
- Include physical manifestations of emotions
- Deepen character vulnerability and authenticity
- Use sensory details that convey emotional states
- Maintain the original narrative structure

Respond with the enhanced text, showing not telling the emotions.`;
}

function buildPacingAnalysisPrompt(content: string, sceneTitle: string): string {
  return `You are a pacing analysis expert. Analyze the following scene for rhythm, flow, and dramatic timing.

SCENE: ${sceneTitle}

CONTENT TO ANALYZE:
"${content.slice(0, 2000)}${content.length > 2000 ? '...' : ''}"

Provide analysis in this JSON format:
{
  "score": 85,
  "issues": ["Long paragraphs slow down action scenes", "Dialogue lacks urgency"],
  "suggestions": ["Break up descriptive passages", "Add shorter, punchier dialogue"],
  "improvements": ["Consider faster transitions", "Vary sentence length for rhythm"],
  "confidence": 0.85
}

Focus on:
- Sentence variety and rhythm
- Paragraph length and structure
- Dialogue pacing and flow
- Action vs. reflection balance
- Tension building and release
- Scene transitions`;
}

function buildDialogueOptimizationPrompt(text: string, projectContext: string): string {
  return `You are a dialogue optimization expert. Improve the following dialogue for natural flow, character voice, and conversational authenticity.

PROJECT CONTEXT: ${projectContext}

DIALOGUE TO OPTIMIZE:
"${text}"

OPTIMIZATION FOCUS:
- Make conversation feel natural and authentic
- Ensure each character has a distinct voice
- Add appropriate subtext and tension
- Balance dialogue tags with action beats
- Remove unnecessary exposition in dialogue
- Enhance emotional resonance

Respond with the optimized dialogue, maintaining character consistency and scene purpose.`;
}

function buildComprehensiveAnalysisPrompt(
  content: string,
  sceneTitle: string,
  projectContext: string,
): string {
  return `You are a comprehensive writing analyst. Analyze this scene for overall quality and provide actionable feedback.

SCENE: ${sceneTitle}
PROJECT: ${projectContext}

CONTENT:
"${content.slice(0, 1500)}${content.length > 1500 ? '...' : ''}"

Provide analysis in this JSON format:
{
  "score": 78,
  "issues": ["Pacing could be faster", "Character motivation unclear"],
  "suggestions": ["Add more sensory details", "Strengthen dialogue"],
  "improvements": ["Consider shorter paragraphs", "Enhance emotional depth"],
  "confidence": 0.82
}

Analyze for: pacing, character development, dialogue quality, emotional depth, clarity, and engagement.`;
}

// Response Parsing Functions
function parseAnalysisResponse(response: string): AIAnalysisResult {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 0,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        improvements: parsed.improvements || [],
        confidence: parsed.confidence || 0.5,
      };
    }
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
  }

  return {
    score: 0,
    issues: ['Analysis parsing failed'],
    suggestions: ['Please try again'],
    improvements: [],
    confidence: 0,
  };
}

function parseToneAdjustmentResponse(response: string): ToneAdjustmentResult {
  // Simple parsing - in a real implementation, you might want more sophisticated parsing
  return {
    originalTone: 'original',
    newTone: 'adjusted',
    adjustedText: response,
    explanation: 'Tone successfully adjusted',
  };
}
