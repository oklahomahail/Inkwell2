import { generateId } from '../utils/id';

import { aiConfigService } from './aiConfigService';
import claudeService from './claudeService';
import { mockAnalyzeBoard } from './mockAIService';
import { plotAnalysisSystem, plotAnalysisUser } from './prompts/plotAnalysisPrompts';

import type { AnalyzeBoardInput, PlotAnalysis } from '../types/plotAnalysis';

function safeParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error('AI returned invalid JSON');
  }
}

export async function analyzeBoard(input: AnalyzeBoardInput): Promise<PlotAnalysis> {
  const cfg = aiConfigService.getConfiguration();

  // Use mock mode if no configuration or in mock mode
  if (!cfg?.isValid || cfg?.provider === 'mock') {
    const mock = await mockAnalyzeBoard(input);
    return {
      ...mock,
      id: generateId('analysis'),
      profileId: input.profileId,
      projectId: input.projectId,
      model: 'mock',
      updatedAt: Date.now(),
    };
  }

  try {
    // Build the analysis prompt
    const systemPrompt = plotAnalysisSystem;
    const userPrompt = plotAnalysisUser(input);

    // Use Claude service to get analysis
    const result = await claudeService.sendMessage(userPrompt, {
      conversationHistory: [], // Fresh conversation for analysis
      maxTokens: 2000, // Higher token limit for comprehensive analysis
    });

    // Parse the JSON response
    const parsed = safeParse<
      Omit<PlotAnalysis, 'id' | 'profileId' | 'projectId' | 'model' | 'updatedAt'>
    >(result.content);

    return {
      id: generateId('analysis'),
      profileId: input.profileId,
      projectId: input.projectId,
      model: 'claude',
      updatedAt: Date.now(),
      ...parsed,
    };
  } catch (error) {
    console.error('Plot analysis failed, falling back to mock:', error);

    // Fall back to mock if Claude fails
    const mock = await mockAnalyzeBoard(input);
    return {
      ...mock,
      id: generateId('analysis'),
      profileId: input.profileId,
      projectId: input.projectId,
      model: 'mock',
      updatedAt: Date.now(),
    };
  }
}
