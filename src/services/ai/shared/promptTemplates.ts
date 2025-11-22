/**
 * AI Prompt Templates
 * Centralized prompt engineering for all AI features
 */

import { z } from 'zod';

import type { PromptTemplate, ChapterSynopsis, SceneType, PublishingMaterials } from '@/types/ai';
import type { Chapter } from '@/types/project';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Chapter Synopsis Schema (Wave 1, Feature #1)
 */
export const ChapterSynopsisSchema = z.object({
  summary: z.string().min(50).max(500),
  keyBeats: z.array(z.string()).min(1).max(10),
  emotionalArc: z.string().min(20).max(200),
  conflicts: z.array(z.string()).min(0).max(5),
  generatedAt: z.number(),
});

/**
 * Scene Classification Schema (Wave 1, Feature #2)
 */
export const SceneClassificationSchema = z.object({
  sceneType: z.enum([
    'conflict',
    'reveal',
    'transition',
    'action',
    'emotional',
    'setup',
    'resolution',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

/**
 * Publishing Materials Schema (Wave 1, Feature #3)
 */
export const PublishingMaterialsSchema = z.object({
  blurb: z.string().min(100).max(300).optional(),
  queryLetter: z.string().min(200).max(500).optional(),
  synopsisOnePage: z.string().min(300).max(800).optional(),
  synopsisThreePage: z.string().min(800).max(2400).optional(),
  generatedAt: z.number(),
});

// ============================================================================
// Prompt Templates - Wave 1
// ============================================================================

/**
 * Chapter Synopsis Prompt (Feature #1)
 */
export function chapterSynopsisPrompt(chapter: Chapter): PromptTemplate<ChapterSynopsis> {
  return {
    system: `You are an expert literary analyst specializing in narrative structure and storytelling. Your task is to analyze chapter content and provide insightful summaries that help authors understand their work.

Focus on:
- Key narrative beats and plot developments
- Emotional trajectory and character arcs
- Central conflicts and tensions
- Scene-level story mechanics

Provide concise, actionable insights that respect the author's voice and vision.`,

    user: `Analyze this chapter and provide a structured synopsis:

**Chapter Title:** ${chapter.title || 'Untitled'}
**Word Count:** ${chapter.wordCount || 0} words

**Content:**
${chapter.content || '(No content)'}

Return a JSON object with:
- summary: A 2-3 sentence overview of the chapter (50-500 chars)
- keyBeats: Array of 3-7 key narrative moments
- emotionalArc: One sentence describing the emotional journey (20-200 chars)
- conflicts: Array of main conflicts present (0-5 items)
- generatedAt: Current timestamp

Be specific and use examples from the text.`,

    schema: ChapterSynopsisSchema,
    temperature: 0.3,
    maxTokens: 800,
  };
}

/**
 * Scene Classification Prompt (Feature #2)
 */
export function sceneClassificationPrompt(content: string): PromptTemplate<{
  sceneType: SceneType;
  confidence: number;
  reasoning?: string;
}> {
  // Truncate content if too long
  const truncatedContent = content.length > 3000 ? content.slice(0, 3000) + '...' : content;

  return {
    system: `You are a narrative structure expert. Classify scenes into one of these types:

- **conflict**: Direct confrontation, argument, or struggle between forces
- **reveal**: Discovery, revelation, or new information that changes understanding
- **transition**: Bridge between major scenes, travel, passage of time
- **action**: Physical activity, chase, fight, or dynamic movement
- **emotional**: Internal character experience, introspection, or emotional processing
- **setup**: Establishing information, introducing elements, building context
- **resolution**: Concluding action, wrapping up threads, aftermath

Consider the primary purpose of the scene, not secondary elements.`,

    user: `Classify this scene:

${truncatedContent}

Return JSON with:
- sceneType: One of the types above
- confidence: 0-1 score for classification certainty
- reasoning: Brief explanation (optional)`,

    schema: SceneClassificationSchema,
    temperature: 0.2,
    maxTokens: 200,
  };
}

/**
 * Publishing Tools Prompt (Feature #3)
 */
export function publishingMaterialsPrompt(params: {
  chapters: Chapter[];
  genre?: string;
  description?: string;
  type: 'blurb' | 'query' | 'synopsis-1' | 'synopsis-3';
}): PromptTemplate<PublishingMaterials> {
  const { chapters, genre, description, type } = params;

  // Aggregate chapter content (use summaries if available, otherwise first 200 chars)
  const manuscript = chapters
    .map((ch, idx) => {
      const preview = ch.summary || ch.content?.slice(0, 200) || '';
      return `Chapter ${idx + 1}: ${ch.title || 'Untitled'}\n${preview}`;
    })
    .join('\n\n');

  const truncated = manuscript.length > 10000 ? manuscript.slice(0, 10000) + '...' : manuscript;

  let specificPrompt = '';
  let field: keyof PublishingMaterials = 'blurb';

  switch (type) {
    case 'blurb':
      field = 'blurb';
      specificPrompt = `Write a compelling back-cover blurb (100-300 words) that hooks readers without spoilers. Include:
- Intriguing hook
- Main character and stakes
- Central conflict
- Tone that matches the genre`;
      break;

    case 'query':
      field = 'queryLetter';
      specificPrompt = `Write a professional query letter body paragraph (200-500 words) following industry standards:
- Compelling hook in first sentence
- Protagonist, goal, and obstacles
- Stakes and why readers will care
- Comparable titles (comps) if relevant
- Word count and genre`;
      break;

    case 'synopsis-1':
      field = 'synopsisOnePage';
      specificPrompt = `Write a one-page synopsis (300-800 words) that:
- Reveals the complete story arc including ending
- Covers major plot points in order
- Shows character development
- Demonstrates story structure`;
      break;

    case 'synopsis-3':
      field = 'synopsisThreePage';
      specificPrompt = `Write a three-page synopsis (800-2400 words) that:
- Provides comprehensive plot summary
- Includes all major characters and arcs
- Details key turning points
- Shows subplots and their resolution
- Reveals complete ending`;
      break;
  }

  return {
    system: `You are a professional publishing consultant specializing in query packages for literary agents and publishers. You understand industry standards and what makes manuscripts marketable.`,

    user: `Create publishing materials for this manuscript:

**Genre:** ${genre || 'Unspecified'}
**Description:** ${description || 'N/A'}

**Manuscript Overview:**
${truncated}

**Request:** ${specificPrompt}

Return JSON with:
- ${field}: The generated material
- generatedAt: Current timestamp`,

    schema: PublishingMaterialsSchema,
    temperature: 0.7,
    maxTokens: type === 'synopsis-3' ? 3000 : type === 'synopsis-1' ? 1000 : 500,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate AI response against schema
 */
export function validateResponse<T>(response: unknown, schema: z.ZodSchema<T>): T {
  return schema.parse(response);
}

/**
 * Extract JSON from AI response (handles markdown code blocks)
 */
export function extractJSON(text: string): unknown {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch && jsonMatch[0]) {
    return JSON.parse(jsonMatch[0]);
  }

  // Fallback: parse entire text
  return JSON.parse(text);
}
