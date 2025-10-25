// LLM-enhanced plot analysis

import type { BookMetrics, Insight, Scorecard, Grade } from './types';

const SYSTEM_PROMPT = `You are an expert fiction editor specializing in middle-grade mystery pacing and structure.
Return concise, actionable findings. Do not summarize plot. No fluff.
Output MUST be valid JSON matching the provided schema. If data is insufficient, explain why in one insight and still return valid JSON.`;

const USER_PROMPT_TEMPLATE = `BOOK_DATA:
{BOOK_JSON}

TASK:
1) Apply the rules below to produce 3–6 high-value insights total.
2) For each insight, include: id, severity ("low"|"med"|"high"), finding (max 40 words), suggestion (max 30 words), affectedChapters (array of indices).
3) Compute the scorecard fields exactly as described.

RULES (abridged):
- Midpoint late/early: midpoint window 45–55% by cumulative words.
- Inciting late: first conflict/inciting tag must appear by 20% by word share.
- Climax placement: heaviest chapter should land 80–95% into book or be matched by equally heavy late chapter.
- Sagging middle: 15–20% window around midpoint with 20% under-average rolling wordcount and missing turn/complication.
- Chapter length variance: stdev > 0.6×mean flags, and sub-600 words without bridge tag are suspect.
- Idle chapter: no purpose tags and summary lacks goal/outcome markers.
- POV balance: any POV >60% or <10% when ≥2 POVs.
- Whiplash: adjacent |Δwords| ≥70% of mean without bridge tag.
- Resolution thin: last 10% <5% of total words and no resolution/aftermath tag.

OUTPUT SCHEMA:
{
  "scorecard": {
    "structure": 0,
    "pacing": 0,
    "scenePurpose": 0,
    "coverage": 0,
    "grade": "A|B|C|D|F"
  },
  "insights": [
    {
      "id": "string",
      "severity": "low|med|high",
      "finding": "string",
      "suggestion": "string",
      "affectedChapters": [0]
    }
  ],
  "notes": "optional, <=30 words"
}

CONSTRAINTS:
- Max 6 insights. Prefer high-impact issues.
- Keep language specific and actionable.
- Never include code blocks or markdown in values.
- If ties occur, prefer midpoint, inciting, sag.`;

interface LLMResponse {
  scorecard: {
    structure: number;
    pacing: number;
    scenePurpose: number;
    coverage: number;
    overall?: number; // Optional from LLM, will recalculate
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  insights: Array<{
    id: string;
    severity: 'low' | 'med' | 'high';
    finding: string;
    suggestion: string;
    affectedChapters: number[];
  }>;
  notes?: string;
}

/**
 * Call Claude API for enhanced analysis
 */
export async function callClaudeAPI(data: BookMetrics): Promise<LLMResponse | null> {
  const apiKey = localStorage.getItem('claude_api_key');

  if (!apiKey) {
    console.warn('No Claude API key found, skipping LLM analysis');
    return null;
  }

  const bookJson = JSON.stringify(data, null, 2);
  const userPrompt = USER_PROMPT_TEMPLATE.replace('{BOOK_JSON}', bookJson);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.2,
        top_p: 0.9,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return null;
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      console.error('No content in Claude API response');
      return null;
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText) as LLMResponse;
    return parsed;
  } catch (error) {
    console.error('Failed to call Claude API:', error);
    return null;
  }
}

/**
 * Merge LLM insights with rule-based insights
 */
export function mergeInsights(ruleInsights: Insight[], llmInsights: Insight[]): Insight[] {
  const merged = new Map<string, Insight>();

  // Add rule insights first
  ruleInsights.forEach((insight) => {
    merged.set(insight.id, insight);
  });

  // Add or enhance with LLM insights
  llmInsights.forEach((insight) => {
    const existing = merged.get(insight.id);
    if (existing) {
      // LLM can enhance the suggestion
      merged.set(insight.id, {
        ...existing,
        suggestion: insight.suggestion || existing.suggestion,
      });
    } else {
      // Add new LLM insight
      merged.set(insight.id, insight);
    }
  });

  return Array.from(merged.values()).slice(0, 6);
}

/**
 * Merge scorecards (prefer LLM if available, otherwise use rules)
 */
export function mergeScorecard(
  ruleScorecard: Scorecard,
  llmScorecard?: Partial<Scorecard> & { grade: Grade },
): Scorecard {
  if (!llmScorecard) return ruleScorecard;

  // Use LLM scores if they're reasonable (within 20% of rule scores)
  const isReasonable = (llm: number | undefined, rule: number) =>
    llm !== undefined && Math.abs(llm - rule) <= 20;

  const structure =
    isReasonable(llmScorecard.structure, ruleScorecard.structure) &&
    llmScorecard.structure !== undefined
      ? llmScorecard.structure
      : ruleScorecard.structure;
  const pacing =
    isReasonable(llmScorecard.pacing, ruleScorecard.pacing) && llmScorecard.pacing !== undefined
      ? llmScorecard.pacing
      : ruleScorecard.pacing;
  const scenePurpose =
    isReasonable(llmScorecard.scenePurpose, ruleScorecard.scenePurpose) &&
    llmScorecard.scenePurpose !== undefined
      ? llmScorecard.scenePurpose
      : ruleScorecard.scenePurpose;
  const coverage =
    isReasonable(llmScorecard.coverage, ruleScorecard.coverage) &&
    llmScorecard.coverage !== undefined
      ? llmScorecard.coverage
      : ruleScorecard.coverage;

  // Recalculate overall from merged components
  const overall = Math.round(structure * 0.4 + pacing * 0.3 + scenePurpose * 0.2 + coverage * 0.1);

  return {
    structure,
    pacing,
    scenePurpose,
    coverage,
    overall,
    grade: llmScorecard.grade || ruleScorecard.grade,
  };
}
