// proofreadService.ts - AI-powered proofreading using Claude integration

import { ManuscriptDraft } from '../exportTypes';
import { countWords } from '../manuscriptAssembler';

import {
  ProofreadReport,
  ProofreadSuggestion,
  ProofreadOptions,
  ProofreadProgress,
  ReadabilityMetrics,
  DEFAULT_PROOFREAD_OPTIONS,
  ProofreadServiceError
} from './proofreadTypes';

// Mock Claude service - in production this would import from your actual Claude integration
interface ClaudeService {
  sendMessage: (message: string) => Promise<string>;
  isAvailable: () => boolean;
}

// Mock implementation - replace with actual service
const claudeService: ClaudeService = {
  sendMessage: async (message: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response based on the prompt
    if (message.includes('proofread') || message.includes('suggestions')) {
      return JSON.stringify({
        suggestions: [
          {
            location: { chapter: 1, scene: 1, start: 45, end: 67 },
            before: "The writing was really good",
            after: "The prose was compelling",
            rationale: "More precise and literary language",
            category: "style",
            severity: "suggestion",
            confidence: 85
          },
          {
            location: { chapter: 1, scene: 1, start: 120, end: 140 },
            before: "very unique",
            after: "unique",
            rationale: "Redundant qualifier - 'unique' cannot be modified",
            category: "grammar",
            severity: "warning",
            confidence: 95
          }
        ],
        summary: "The manuscript shows strong narrative voice with room for tightening prose and improving dialogue tags."
      });
    } else if (message.includes('readability')) {
      return JSON.stringify({
        gradeLevel: 8.2,
        avgWordsPerSentence: 15.4,
        avgSyllablesPerWord: 1.6,
        passiveVoicePercentage: 12,
        sentenceVariety: "medium"
      });
    }
    
    return 'Analysis complete.';
  },
  isAvailable: () => true
};

/**
 * Progress callback type for proofreading
 */
type ProgressCallback = (progress: ProofreadProgress) => void;

/**
 * Splits text into chunks for processing
 */
function chunkText(text: string, maxChunkSize: number = 2000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generates proofreading prompt for Claude
 */
function generateProofreadPrompt(
  text: string, 
  options: ProofreadOptions,
  context: { chapterTitle?: string; chapterNumber?: number }
): string {
  const focusAreas = options.focusAreas.join(', ');
  const audienceDescription = {
    general: 'general adult readers',
    young_adult: 'young adult readers (ages 13-18)',
    literary: 'literary fiction readers who appreciate nuanced prose',
    commercial: 'mainstream commercial fiction readers'
  }[options.targetAudience];

  return `Please proofread the following text excerpt and provide specific suggestions for improvement. Focus on: ${focusAreas}.

Target audience: ${audienceDescription}
Chapter context: ${context.chapterTitle ? `"${context.chapterTitle}"` : `Chapter ${context.chapterNumber || 'Unknown'}`}

Guidelines:
- Provide up to ${Math.min(options.maxSuggestions, 15)} specific suggestions
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

/**
 * Generates readability analysis prompt
 */
function generateReadabilityPrompt(text: string): string {
  return `Analyze the readability of this text and provide detailed metrics:

"""
${text}
"""

Please respond with a JSON object containing:
{
  "gradeLevel": number (Flesch-Kincaid grade level),
  "avgWordsPerSentence": number,
  "avgSyllablesPerWord": number (estimate),
  "passiveVoicePercentage": number (0-100),
  "sentenceVariety": "low|medium|high" (based on sentence length and structure variation)
}`;
}

/**
 * Calculates basic text statistics
 */
function calculateTextStats(text: string) {
  const words = text.match(/\b\w+\b/g) || [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return {
    totalWords: words.length,
    totalSentences: sentences.length,
    totalParagraphs: paragraphs.length
  };
}

/**
 * Processes Claude response and creates ProofreadSuggestion objects
 */
function processClaudeResponse(
  response: string,
  chapterNumber: number,
  sceneNumber: number,
  textOffset: number = 0
): ProofreadSuggestion[] {
  try {
    const parsed = JSON.parse(response);
    
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      return [];
    }
    
    return parsed.suggestions.map((suggestion: any, index: number): ProofreadSuggestion => ({
      id: `suggestion_${chapterNumber}_${sceneNumber}_${index}_${Date.now()}`,
      location: {
        chapter: chapterNumber,
        scene: sceneNumber,
        start: textOffset,
        end: textOffset + (suggestion.before?.length || 0)
      },
      before: suggestion.before || '',
      after: suggestion.after || '',
      rationale: suggestion.rationale || '',
      category: suggestion.category || 'style',
      severity: suggestion.severity || 'suggestion',
      confidence: Math.min(100, Math.max(0, suggestion.confidence || 70))
    }));
  } catch (error) {
    console.warn('Failed to parse Claude response:', error);
    return [];
  }
}

/**
 * Processes readability response
 */
function processReadabilityResponse(response: string): ReadabilityMetrics {
  try {
    const parsed = JSON.parse(response);
    
    return {
      gradeLevel: Math.max(1, Math.min(18, parsed.gradeLevel || 8)),
      avgWordsPerSentence: Math.max(1, parsed.avgWordsPerSentence || 15),
      avgSyllablesPerWord: Math.max(1, parsed.avgSyllablesPerWord || 1.5),
      passiveVoicePercentage: Math.max(0, Math.min(100, parsed.passiveVoicePercentage || 10)),
      readingTimeMinutes: 0, // Will be calculated separately
      sentenceVariety: parsed.sentenceVariety || 'medium'
    };
  } catch (error) {
    // Return default metrics if parsing fails
    return {
      gradeLevel: 8,
      avgWordsPerSentence: 15,
      avgSyllablesPerWord: 1.5,
      passiveVoicePercentage: 10,
      readingTimeMinutes: 0,
      sentenceVariety: 'medium'
    };
  }
}

/**
 * Main proofreading function
 */
export async function runProofread(
  draft: ManuscriptDraft,
  options: ProofreadOptions = DEFAULT_PROOFREAD_OPTIONS,
  onProgress?: ProgressCallback
): Promise<ProofreadReport> {
  
  // Check if Claude service is available
  if (!claudeService.isAvailable()) {
    throw new ProofreadServiceError('Claude AI service is not available');
  }
  
  const startTime = Date.now();
  let allSuggestions: ProofreadSuggestion[] = [];
  let combinedText = '';
  
  // Initialize progress
  onProgress?.({
    phase: 'analyzing',
    percentage: 0,
    totalChapters: draft.chapters.length,
    message: 'Analyzing manuscript structure...'
  });
  
  try {
    // Process each chapter
    for (let chapterIndex = 0; chapterIndex < draft.chapters.length; chapterIndex++) {
      const chapter = draft.chapters[chapterIndex];
      
      onProgress?.({
        phase: 'processing',
        percentage: (chapterIndex / draft.chapters.length) * 70,
        currentChapter: chapterIndex + 1,
        totalChapters: draft.chapters.length,
        message: `Processing ${chapter.title || `Chapter ${chapter.number}`}...`
      });
      
      // Process each scene in the chapter
      for (let sceneIndex = 0; sceneIndex < chapter.scenes.length; sceneIndex++) {
        const scene = chapter.scenes[sceneIndex];
        combinedText += scene + '\n\n';
        
        // Only process scenes with substantial content
        if (countWords(scene) < 50) continue;
        
        // Chunk the scene if it's too long
        const chunks = chunkText(scene);
        let sceneOffset = 0;
        
        for (const chunk of chunks) {
          try {
            const prompt = generateProofreadPrompt(chunk, options, {
              chapterTitle: chapter.title,
              chapterNumber: chapter.number
            });
            
            const response = await claudeService.sendMessage(prompt);
            const suggestions = processClaudeResponse(
              response,
              chapter.number,
              sceneIndex + 1,
              sceneOffset
            );
            
            allSuggestions.push(...suggestions);
            sceneOffset += chunk.length;
            
            // Respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.warn(`Failed to process chunk in chapter ${chapter.number}:`, error);
          }
        }
      }
      
      // Check if we've hit suggestion limit
      if (allSuggestions.length >= options.maxSuggestions) {
        allSuggestions = allSuggestions.slice(0, options.maxSuggestions);
        break;
      }
    }
    
    // Calculate readability metrics
    onProgress?.({
      phase: 'generating',
      percentage: 80,
      message: 'Calculating readability metrics...'
    });
    
    let readability: ReadabilityMetrics;
    try {
      const readabilityPrompt = generateReadabilityPrompt(
        combinedText.slice(0, 5000) // Sample for readability analysis
      );
      const readabilityResponse = await claudeService.sendMessage(readabilityPrompt);
      readability = processReadabilityResponse(readabilityResponse);
    } catch (error) {
      readability = {
        gradeLevel: 8,
        avgWordsPerSentence: 15,
        avgSyllablesPerWord: 1.5,
        passiveVoicePercentage: 10,
        readingTimeMinutes: 0,
        sentenceVariety: 'medium'
      };
    }
    
    // Calculate reading time (average 200 words per minute)
    readability.readingTimeMinutes = Math.ceil(draft.wordCount / 200);
    
    // Calculate statistics
    const textStats = calculateTextStats(combinedText);
    
    const issuesByCategory: Record<ProofreadSuggestion['category'], number> = {
      clarity: 0,
      conciseness: 0,
      consistency: 0,
      tone: 0,
      grammar: 0,
      style: 0,
      flow: 0
    };
    
    const issuesBySeverity: Record<ProofreadSuggestion['severity'], number> = {
      note: 0,
      suggestion: 0,
      warning: 0,
      error: 0
    };
    
    allSuggestions.forEach(suggestion => {
      issuesByCategory[suggestion.category]++;
      issuesBySeverity[suggestion.severity]++;
    });
    
    // Generate summary and highlights
    const summary = generateReportSummary(allSuggestions, readability, textStats);
    const highlights = generateReportHighlights(allSuggestions, readability);
    
    onProgress?.({
      phase: 'complete',
      percentage: 100,
      message: 'Proofreading complete!'
    });
    
    return {
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
        issuesBySeverity
      }
    };
    
  } catch (error) {
    if (error instanceof ProofreadServiceError) {
      throw error;
    }
    
    throw new ProofreadServiceError(
      `Proofreading failed: ${error.message}`,
      { originalError: error, duration: Date.now() - startTime }
    );
  }
}

/**
 * Generates a summary of the proofreading report
 */
function generateReportSummary(
  suggestions: ProofreadSuggestion[],
  readability: ReadabilityMetrics,
  stats: { totalWords: number; totalSentences: number; totalParagraphs: number }
): string {
  if (suggestions.length === 0) {
    return `Your manuscript is in excellent shape! The text shows strong readability (grade level ${readability.gradeLevel}) and clear, engaging prose. No significant issues were identified.`;
  }
  
  const majorIssues = suggestions.filter(s => s.severity === 'error' || s.severity === 'warning').length;
  const styleIssues = suggestions.filter(s => s.category === 'style' || s.category === 'tone').length;
  const grammarIssues = suggestions.filter(s => s.category === 'grammar').length;
  
  let summary = `Your manuscript shows ${majorIssues > 5 ? 'several areas' : 'minor areas'} for improvement. `;
  
  if (grammarIssues > 0) {
    summary += `${grammarIssues} grammar and usage suggestions were identified. `;
  }
  
  if (styleIssues > 0) {
    summary += `${styleIssues} style and tone enhancements were suggested to strengthen your prose. `;
  }
  
  summary += `The text maintains a readable style (grade level ${readability.gradeLevel}) with ${readability.sentenceVariety} sentence variety.`;
  
  return summary;
}

/**
 * Generates key highlights for the report
 */
function generateReportHighlights(
  suggestions: ProofreadSuggestion[],
  readability: ReadabilityMetrics
): string[] {
  const highlights: string[] = [];
  
  // Readability highlight
  if (readability.gradeLevel <= 10) {
    highlights.push(`📖 Excellent readability at ${readability.gradeLevel}th grade level`);
  } else {
    highlights.push(`📚 Consider simplifying some sentences (grade level ${readability.gradeLevel})`);
  }
  
  // Passive voice
  if (readability.passiveVoicePercentage > 20) {
    highlights.push(`⚠️ High passive voice usage (${readability.passiveVoicePercentage}%)`);
  } else {
    highlights.push(`✅ Good active voice usage (${readability.passiveVoicePercentage}% passive)`);
  }
  
  // Sentence variety
  if (readability.sentenceVariety === 'high') {
    highlights.push('🎯 Excellent sentence variety keeps readers engaged');
  } else if (readability.sentenceVariety === 'low') {
    highlights.push('📝 Consider varying sentence lengths for better flow');
  }
  
  // Error summary
  const errors = suggestions.filter(s => s.severity === 'error').length;
  const warnings = suggestions.filter(s => s.severity === 'warning').length;
  
  if (errors > 0) {
    highlights.push(`🔍 ${errors} errors require attention`);
  }
  
  if (warnings > 3) {
    highlights.push(`💡 ${warnings} suggestions to strengthen your prose`);
  }
  
  return highlights;
}

/**
 * Gets proofreading statistics for a project
 */
export function getProofreadStats(reports: ProofreadReport[]) {
  if (reports.length === 0) {
    return {
      totalReports: 0,
      avgSuggestions: 0,
      avgGradeLevel: 0,
      commonIssues: [],
      improvement: 0
    };
  }
  
  const totalSuggestions = reports.reduce((sum, r) => sum + r.totalSuggestions, 0);
  const totalGradeLevel = reports.reduce((sum, r) => sum + r.readability.gradeLevel, 0);
  
  // Calculate improvement trend (first vs last report)
  const improvement = reports.length > 1 ? 
    reports[0].totalSuggestions - reports[reports.length - 1].totalSuggestions : 0;
  
  // Find most common issues
  const issueCategories: Record<string, number> = {};
  reports.forEach(report => {
    Object.entries(report.stats.issuesByCategory).forEach(([category, count]) => {
      issueCategories[category] = (issueCategories[category] || 0) + count;
    });
  });
  
  const commonIssues = Object.entries(issueCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
  
  return {
    totalReports: reports.length,
    avgSuggestions: Math.round(totalSuggestions / reports.length),
    avgGradeLevel: Math.round((totalGradeLevel / reports.length) * 10) / 10,
    commonIssues,
    improvement
  };
}