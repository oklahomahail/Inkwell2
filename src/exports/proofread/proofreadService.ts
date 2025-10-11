// File: src/exports/proofread/proofreadService.ts
// AI-powered proofreading using Claude integration

import { ManuscriptDraft } from '../exportTypes';
import { countWords } from '../manuscriptAssembler';

import {
  ProofreadReport,
  ProofreadSuggestion,
  ProofreadOptions,
  ProofreadProgress,
  ReadabilityMetrics,
  DEFAULT_PROOFREAD_OPTIONS,
  ProofreadServiceError,
} from './proofreadTypes';

// ===== Claude service interface (replace with your real integration) =====
export interface ClaudeService {
  sendMessage: (_message: string) => Promise<string>;
  isAvailable: () => boolean;
}

// Mock implementation, swap out with your real service in production
const claudeService: ClaudeService = {
  sendMessage: async (_message: string) => {
    await new Promise((r) => setTimeout(r, 1000));

    if (message.includes('proofread') || message.includes('suggestions')) {
      return JSON.stringify({
        suggestions: [
          {
            location: { chapter: 1, scene: 1, start: 45, end: 67 },
            before: 'The writing was really good',
            after: 'The prose was compelling',
            rationale: 'More precise and literary language',
            category: 'style',
            severity: 'suggestion',
            confidence: 85,
          },
          {
            location: { chapter: 1, scene: 1, start: 120, end: 140 },
            before: 'very unique',
            after: 'unique',
            rationale: "Redundant qualifier - 'unique' cannot be modified",
            category: 'grammar',
            severity: 'warning',
            confidence: 95,
          },
        ],
        summary:
          'The manuscript shows strong narrative voice with room for tightening prose and improving dialogue tags.',
      });
    }

    if (message.includes('readability')) {
      return JSON.stringify({
        gradeLevel: 8.2,
        avgWordsPerSentence: 15.4,
        avgSyllablesPerWord: 1.6,
        passiveVoicePercentage: 12,
        sentenceVariety: 'medium',
      });
    }

    return 'Analysis complete.';
  },
  isAvailable: () => true,
};

// ===== Internal types =====
type ProgressCallback = (_progress: ProofreadProgress) => void;

// ===== Helpers =====
function _chunkText(text: string, maxChunkSize: number = 2000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);

  let current = '';
  for (const p of paragraphs) {
    const add = current ? `\n\n${p}` : p;
    if (current.length + add.length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current += add;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function _generateProofreadPrompt(
  text: string,
  options: ProofreadOptions,
  context: { chapterTitle?: string; chapterNumber?: number },
): string {
  const focusAreas = options.focusAreas.join(', ');
  const audienceDescription =
    {
      general: 'general adult readers',
      young_adult: 'young adult readers (ages 13-18)',
      literary: 'literary fiction readers who appreciate nuanced prose',
      commercial: 'mainstream commercial fiction readers',
    }[options.targetAudience] ?? 'general adult readers';

  const chapterCtx =
    context.chapterTitle && context.chapterTitle.trim().length > 0
      ? `"${context.chapterTitle}"`
      : `Chapter ${context.chapterNumber ?? 'Unknown'}`;

  const maxSug = Math.min(options.maxSuggestions, 15);

  return `Please proofread the following text excerpt and provide specific suggestions for improvement. Focus on: ${focusAreas}.

Target audience: ${audienceDescription}
Chapter context: ${chapterCtx}

Guidelines:
- Provide up to ${maxSug} specific suggestions
- Include exact before/after text for each suggestion
- Explain the rationale for each change
- Categorize suggestions as: clarity, conciseness, consistency, tone, grammar, style, or flow
- Rate severity as: note, suggestion, warning, or error
- Rate your confidence (0-100) in each suggestion

Text to proofread:
"""
${text}
"""

Please respond with a JSON object containing:
{
  "suggestions": [
    {
      "before": "exact text to change",
      "after": "suggested replacement",
      "rationale": "explanation of why this improves the text",
      "category": "one of the focus areas",
      "severity": "note|suggestion|warning|error",
      "confidence": 0-100
    }
  ],
  "summary": "Brief overall assessment of the text quality and main improvement areas"
}`;
}

function _generateReadabilityPrompt(text: string): string {
  return `Analyze the readability of this text and provide detailed metrics:

"""
${text}
"""

Please respond with a JSON object containing:
{
  "gradeLevel": number,
  "avgWordsPerSentence": number,
  "avgSyllablesPerWord": number,
  "passiveVoicePercentage": number,
  "sentenceVariety": "low" | "medium" | "high"
}`;
}

function _calculateTextStats(text: string) {
  const words = text.match(/\b[\w’'-]+\b/g) ?? [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return {
    totalWords: words.length,
    totalSentences: sentences.length,
    totalParagraphs: paragraphs.length,
  };
}

function _processClaudeResponse(
  response: string,
  chapterNumber: number,
  sceneNumber: number,
  textOffset: number = 0,
): ProofreadSuggestion[] {
  try {
    const parsed: unknown = JSON.parse(response);
    const obj = parsed as { suggestions?: Array<Record<string, unknown>> };

    if (!obj.suggestions || !Array.isArray(obj.suggestions)) return [];

    return obj.suggestions.map((sugg, index): ProofreadSuggestion => {
      const before = typeof sugg.before === 'string' ? sugg.before : '';
      const after = typeof sugg.after === 'string' ? sugg.after : '';
      const rationale = typeof sugg.rationale === 'string' ? sugg.rationale : '';
      const categoryRaw = typeof sugg.category === 'string' ? sugg.category : 'style';
      const severityRaw = typeof sugg.severity === 'string' ? sugg.severity : 'suggestion';
      const confidenceRaw = typeof sugg.confidence === 'number' ? sugg.confidence : 70;

      // Narrow category and severity to known union values
      const category: ProofreadSuggestion['category'] = [
        'clarity',
        'conciseness',
        'consistency',
        'tone',
        'grammar',
        'style',
        'flow',
      ].includes(categoryRaw)
        ? (categoryRaw as ProofreadSuggestion['category'])
        : 'style';

      const severity: ProofreadSuggestion['severity'] = [
        'note',
        'suggestion',
        'warning',
        'error',
      ].includes(severityRaw)
        ? (severityRaw as ProofreadSuggestion['severity'])
        : 'suggestion';

      const confidence = Math.min(100, Math.max(0, confidenceRaw));

      return {
        id: `suggestion_${chapterNumber}_${sceneNumber}_${index}_${Date.now()}`,
        location: {
          chapter: chapterNumber,
          scene: sceneNumber,
          start: textOffset,
          end: textOffset + before.length,
        },
        before,
        after,
        rationale,
        category,
        severity,
        confidence,
      };
    });
  } catch (err) {
    console.warn('Failed to parse Claude response:', err);
    return [];
  }
}

function _processReadabilityResponse(response: string): ReadabilityMetrics {
  try {
    const parsed: unknown = JSON.parse(response);
    const r = parsed as Partial<ReadabilityMetrics> & {
      gradeLevel?: number;
      avgWordsPerSentence?: number;
      avgSyllablesPerWord?: number;
      passiveVoicePercentage?: number;
      sentenceVariety?: 'low' | 'medium' | 'high' | string;
    };

    const gradeLevel = Number.isFinite(r.gradeLevel) ? (r.gradeLevel as number) : 8;
    const avgWordsPerSentence = Number.isFinite(r.avgWordsPerSentence)
      ? (r.avgWordsPerSentence as number)
      : 15;
    const avgSyllablesPerWord = Number.isFinite(r.avgSyllablesPerWord)
      ? (r.avgSyllablesPerWord as number)
      : 1.5;
    const passiveVoicePercentage = Number.isFinite(r.passiveVoicePercentage)
      ? (r.passiveVoicePercentage as number)
      : 10;
    const variety: ReadabilityMetrics['sentenceVariety'] =
      r.sentenceVariety === 'low' || r.sentenceVariety === 'medium' || r.sentenceVariety === 'high'
        ? r.sentenceVariety
        : 'medium';

    return {
      gradeLevel: Math.max(1, Math.min(18, gradeLevel)),
      avgWordsPerSentence: Math.max(1, avgWordsPerSentence),
      avgSyllablesPerWord: Math.max(1, avgSyllablesPerWord),
      passiveVoicePercentage: Math.max(0, Math.min(100, passiveVoicePercentage)),
      readingTimeMinutes: 0, // fill after we know wordCount
      sentenceVariety: variety,
    };
  } catch {
    // Safe defaults
    return {
      gradeLevel: 8,
      avgWordsPerSentence: 15,
      avgSyllablesPerWord: 1.5,
      passiveVoicePercentage: 10,
      readingTimeMinutes: 0,
      sentenceVariety: 'medium',
    };
  }
}

// ===== Main API =====
export async function _runProofread(
  draft: ManuscriptDraft,
  options: ProofreadOptions = DEFAULT_PROOFREAD_OPTIONS,
  onProgress?: ProgressCallback,
): Promise<ProofreadReport> {
  if (!claudeService.isAvailable()) {
    throw new ProofreadServiceError('Claude AI service is not available');
  }

  const start = Date.now();
  let allSuggestions: ProofreadSuggestion[] = [];
  let combinedText = '';

  onProgress?.({
    phase: 'analyzing',
    percentage: 0,
    totalChapters: draft.chapters.length,
    message: 'Analyzing manuscript structure...',
  });

  try {
    const totalChapters = draft.chapters.length;

    for (let chapterIndex = 0; chapterIndex < totalChapters; chapterIndex++) {
      const chapter = draft.chapters[chapterIndex];
      if (!chapter) continue;

      const chapterNumber = chapter.number ?? chapterIndex + 1;
      const chapterTitle = chapter.title ?? '';

      onProgress?.({
        phase: 'processing',
        percentage: (chapterIndex / Math.max(1, totalChapters)) * 70,
        currentChapter: chapterIndex + 1,
        totalChapters,
        message: `Processing ${chapterTitle || `Chapter ${chapterNumber}`}...`,
      });

      const scenes: string[] = Array.isArray(chapter.scenes) ? chapter.scenes : [];
      for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
        const sceneText = scenes[sceneIndex] ?? '';
        combinedText += sceneText + '\n\n';

        if (countWords(sceneText) < 50) continue;

        const chunks = chunkText(sceneText);
        let sceneOffset = 0;

        for (const chunk of chunks) {
          try {
            const prompt = generateProofreadPrompt(chunk, options, {
              chapterTitle,
              chapterNumber,
            });

            const response = await claudeService.sendMessage(prompt);
            const suggestions = processClaudeResponse(
              response,
              chapterNumber,
              sceneIndex + 1,
              sceneOffset,
            );

            allSuggestions = allSuggestions.concat(suggestions);
            sceneOffset += chunk.length;

            if (allSuggestions.length >= options.maxSuggestions) {
              allSuggestions = allSuggestions.slice(0, options.maxSuggestions);
              break;
            }

            // gentle pacing for rate limits
            await new Promise((r) => setTimeout(r, 100));
          } catch (err) {
            console.warn(`Failed to process chunk in chapter ${chapterNumber}:`, err);
          }
        }

        if (allSuggestions.length >= options.maxSuggestions) break;
      }

      if (allSuggestions.length >= options.maxSuggestions) break;
    }

    onProgress?.({
      phase: 'generating',
      percentage: 80,
      message: 'Calculating readability metrics...',
    });

    let readability: ReadabilityMetrics;
    try {
      const readabilitySample = combinedText.slice(0, 5000);
      const readabilityPrompt = generateReadabilityPrompt(readabilitySample);
      const readabilityResponse = await claudeService.sendMessage(readabilityPrompt);
      readability = processReadabilityResponse(readabilityResponse);
    } catch {
      readability = {
        gradeLevel: 8,
        avgWordsPerSentence: 15,
        avgSyllablesPerWord: 1.5,
        passiveVoicePercentage: 10,
        readingTimeMinutes: 0,
        sentenceVariety: 'medium',
      };
    }

    // Compute reading time (200 wpm) using draft.wordCount if present, else from combinedText
    const wordCount =
      typeof draft.wordCount === 'number' && Number.isFinite(draft.wordCount)
        ? draft.wordCount
        : calculateTextStats(combinedText).totalWords;
    readability.readingTimeMinutes = Math.ceil(wordCount / 200);

    const textStats = calculateTextStats(combinedText);

    const issuesByCategory: Record<ProofreadSuggestion['category'], number> = {
      clarity: 0,
      conciseness: 0,
      consistency: 0,
      tone: 0,
      grammar: 0,
      style: 0,
      flow: 0,
    };

    const issuesBySeverity: Record<ProofreadSuggestion['severity'], number> = {
      note: 0,
      suggestion: 0,
      warning: 0,
      error: 0,
    };

    for (const s of allSuggestions) {
      issuesByCategory[s.category] += 1;
      issuesBySeverity[s.severity] += 1;
    }

    const summary = generateReportSummary(allSuggestions, readability, textStats);
    const highlights = generateReportHighlights(allSuggestions, readability);

    onProgress?.({
      phase: 'complete',
      percentage: 100,
      message: 'Proofreading complete!',
    });

    const report: ProofreadReport = {
      id: `proofread_${draft.projectId}_${Date.now()}`,
      projectId: draft.projectId,
      generatedAt: Date.now(),
      totalSuggestions: allSuggestions.length,
      suggestions: allSuggestions,
      readability,
      summary,
      highlights,
      stats: {
        ...textStats,
        issuesByCategory,
        issuesBySeverity,
      },
    };

    return report;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    throw new ProofreadServiceError(`Proofreading failed: ${err.message}`, {
      originalError: err,
      duration: Date.now() - start,
    });
  }
}

// ===== Report synthesis =====
function _generateReportSummary(
  suggestions: ProofreadSuggestion[],
  readability: ReadabilityMetrics,
  _stats: { totalWords: number; totalSentences: number; totalParagraphs: number },
): string {
  if (suggestions.length === 0) {
    return `Your manuscript is in excellent shape. The text shows strong readability (grade level ${readability.gradeLevel}) and clear, engaging prose. No significant issues were identified.`;
  }

  const majorIssues = suggestions.filter(
    (s) => s.severity === 'error' || s.severity === 'warning',
  ).length;
  const styleIssues = suggestions.filter(
    (s) => s.category === 'style' || s.category === 'tone',
  ).length;
  const grammarIssues = suggestions.filter((s) => s.category === 'grammar').length;

  const issueIntro =
    majorIssues > 5 ? 'several areas' : majorIssues > 0 ? 'some areas' : 'minor areas';

  let summary = `Your manuscript shows ${issueIntro} for improvement. `;
  if (grammarIssues > 0) {
    summary += `${grammarIssues} grammar and usage suggestions were identified. `;
  }
  if (styleIssues > 0) {
    summary += `${styleIssues} style and tone enhancements were suggested to strengthen your prose. `;
  }
  summary += `The text maintains a readable style (grade level ${readability.gradeLevel}) with ${readability.sentenceVariety} sentence variety.`;

  return summary;
}

function _generateReportHighlights(
  suggestions: ProofreadSuggestion[],
  readability: ReadabilityMetrics,
): string[] {
  const highlights: string[] = [];

  // Readability
  if (readability.gradeLevel <= 10) {
    highlights.push(`Excellent readability at grade level ${readability.gradeLevel}.`);
  } else {
    highlights.push(`Consider simplifying some sentences (grade level ${readability.gradeLevel}).`);
  }

  // Passive voice
  if (readability.passiveVoicePercentage > 20) {
    highlights.push(`High passive voice usage (${readability.passiveVoicePercentage}%).`);
  } else {
    highlights.push(`Good active voice usage (${readability.passiveVoicePercentage}% passive).`);
  }

  // Sentence variety
  if (readability.sentenceVariety === 'high') {
    highlights.push('Strong sentence variety keeps readers engaged.');
  } else if (readability.sentenceVariety === 'low') {
    highlights.push('Consider varying sentence lengths for better flow.');
  }

  // Error / warning counts
  const errors = suggestions.filter((s) => s.severity === 'error').length;
  const warnings = suggestions.filter((s) => s.severity === 'warning').length;

  if (errors > 0) highlights.push(`${errors} errors require attention.`);
  if (warnings > 0) highlights.push(`${warnings} warnings identified.`);

  return highlights;
}

// ===== Aggregate stats for UI =====
export function _getProofreadStats(reports: ProofreadReport[]) {
  if (!reports || reports.length === 0) {
    return {
      totalReports: 0,
      avgSuggestions: 0,
      avgGradeLevel: 0,
      commonIssues: [] as string[],
      improvement: 0,
    };
  }

  const totalSuggestions = reports.reduce((sum, _r) => sum + r.totalSuggestions, 0);
  const totalGradeLevel = reports.reduce((sum, _r) => sum + r.readability.gradeLevel, 0);

  // Safely compute first-vs-last improvement
  const first = reports.at(0);
  const last = reports.at(-1);
  const improvement = first && last ? first.totalSuggestions - last.totalSuggestions : 0;

  // Tally common issues
  const issueCategories: Record<string, number> = {};
  for (const report of reports) {
    for (const [cat, count] of Object.entries(report.stats.issuesByCategory)) {
      issueCategories[cat] = (issueCategories[cat] ?? 0) + count;
    }
  }

  const commonIssues = Object.entries(issueCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  return {
    totalReports: reports.length,
    avgSuggestions: Math.round(totalSuggestions / reports.length),
    avgGradeLevel: Math.round((totalGradeLevel / reports.length) * 10) / 10,
    commonIssues,
    improvement,
  };
}
