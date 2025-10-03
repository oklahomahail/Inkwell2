// src/services/voiceConsistencyService.ts
// Service for analyzing character voice consistency

export interface VoiceFingerprint {
  characterId: string;
  characterName: string;
  metrics: {
    avgSentenceLength: number;
    typeTokenRatio: number; // vocabulary richness
    avgWordsPerSentence: number;
    punctuationFrequency: {
      exclamation: number;
      question: number;
      ellipsis: number;
      dash: number;
    };
    commonWords: Array<{ word: string; frequency: number }>; // top 20 most used words
    syntacticPatterns: {
      contractions: number; // "don't", "can't", etc.
      formalPhrases: number; // "I would suggest", "Perhaps", etc.
      casualPhrases: number; // "gonna", "wanna", etc.
    };
  };
  sampleSize: number; // total words analyzed
  confidence: number; // 0-1, based on sample size
  lastUpdated: number;
}

export interface VoiceAnalysisResult {
  characterId: string;
  textSample: string;
  matchScore: number; // 0-1, how well it matches the fingerprint
  deviations: Array<{
    type: 'sentence-length' | 'vocabulary' | 'punctuation' | 'syntax';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
  }>;
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface DialogueLine {
  text: string;
  characterId?: string;
  characterName?: string;
  context?: string; // surrounding text for context
}

class VoiceConsistencyService {
  private readonly STORAGE_KEY = 'voice_fingerprints';
  private fingerprints: Map<string, Map<string, VoiceFingerprint>> = new Map(); // projectId -> characterId -> fingerprint

  // Load fingerprints from storage
  constructor() {
    this.loadFingerprints();
  }

  /**
   * Extract dialogue lines from text content
   */
  extractDialogue(content: string): DialogueLine[] {
    const lines: DialogueLine[] = [];
    
    // Common dialogue patterns
    const dialoguePatterns = [
      /"([^"]+)"/g, // Double quotes
      /'([^']+)'/g, // Single quotes
      /"([^"]+)"/g, // Smart quotes
      /["""']([^"""']+)["""']/g // Unicode quotes
    ];

    for (const pattern of dialoguePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1];
        if (text && text.length > 5) { // Filter out very short dialogue
          lines.push({
            text: text.trim(),
            context: this.extractContext(content, match.index, 50)
          });
        }
      }
    }

    return lines;
  }

  /**
   * Analyze dialogue and create/update voice fingerprint for a character
   */
  analyzeCharacterVoice(
    projectId: string, 
    characterId: string, 
    characterName: string, 
    dialogueLines: DialogueLine[]
  ): VoiceFingerprint {
    const combinedText = dialogueLines.map(line => line.text).join(' ');
    const words = this.tokenize(combinedText);
    
    if (words.length < 10) {
      // Not enough data for meaningful analysis
      return {
        characterId,
        characterName,
        metrics: this.createEmptyMetrics(),
        sampleSize: words.length,
        confidence: 0,
        lastUpdated: Date.now()
      };
    }

    const metrics = this.calculateVoiceMetrics(combinedText, words);
    const confidence = this.calculateConfidence(words.length);

    const fingerprint: VoiceFingerprint = {
      characterId,
      characterName,
      metrics,
      sampleSize: words.length,
      confidence,
      lastUpdated: Date.now()
    };

    // Store the fingerprint
    this.storeFingerprint(projectId, fingerprint);

    return fingerprint;
  }

  /**
   * Analyze a text sample against an existing voice fingerprint
   */
  analyzeVoiceConsistency(
    projectId: string, 
    characterId: string, 
    textSample: string
  ): VoiceAnalysisResult | null {
    const fingerprint = this.getFingerprint(projectId, characterId);
    if (!fingerprint || fingerprint.confidence < 0.3) {
      return null; // Not enough data for comparison
    }

    const words = this.tokenize(textSample);
    if (words.length < 5) {
      return null; // Sample too small
    }

    const sampleMetrics = this.calculateVoiceMetrics(textSample, words);
    const matchScore = this.calculateMatchScore(fingerprint.metrics, sampleMetrics);
    const deviations = this.identifyDeviations(fingerprint.metrics, sampleMetrics);
    
    const confidenceLevel = fingerprint.confidence > 0.7 ? 'high' :
                          fingerprint.confidence > 0.4 ? 'medium' : 'low';

    return {
      characterId,
      textSample,
      matchScore,
      deviations,
      confidenceLevel
    };
  }

  /**
   * Get voice fingerprint for a character
   */
  getFingerprint(projectId: string, characterId: string): VoiceFingerprint | null {
    const projectFingerprints = this.fingerprints.get(projectId);
    return projectFingerprints?.get(characterId) || null;
  }

  /**
   * Get all fingerprints for a project
   */
  getProjectFingerprints(projectId: string): VoiceFingerprint[] {
    const projectFingerprints = this.fingerprints.get(projectId);
    return projectFingerprints ? Array.from(projectFingerprints.values()) : [];
  }

  /**
   * Update fingerprint with new dialogue sample (incremental learning)
   */
  updateFingerprint(
    projectId: string, 
    characterId: string, 
    newDialogue: DialogueLine[]
  ): VoiceFingerprint | null {
    const existing = this.getFingerprint(projectId, characterId);
    if (!existing) return null;

    const newText = newDialogue.map(line => line.text).join(' ');
    const newWords = this.tokenize(newText);
    
    if (newWords.length < 5) return existing; // Not enough new data

    const newMetrics = this.calculateVoiceMetrics(newText, newWords);
    
    // Weighted average based on sample sizes
    const totalSampleSize = existing.sampleSize + newWords.length;
    const existingWeight = existing.sampleSize / totalSampleSize;
    const newWeight = newWords.length / totalSampleSize;

    const updatedFingerprint: VoiceFingerprint = {
      ...existing,
      metrics: {
        avgSentenceLength: 
          existing.metrics.avgSentenceLength * existingWeight + 
          newMetrics.avgSentenceLength * newWeight,
        typeTokenRatio:
          existing.metrics.typeTokenRatio * existingWeight +
          newMetrics.typeTokenRatio * newWeight,
        avgWordsPerSentence:
          existing.metrics.avgWordsPerSentence * existingWeight +
          newMetrics.avgWordsPerSentence * newWeight,
        punctuationFrequency: {
          exclamation: 
            existing.metrics.punctuationFrequency.exclamation * existingWeight +
            newMetrics.punctuationFrequency.exclamation * newWeight,
          question:
            existing.metrics.punctuationFrequency.question * existingWeight +
            newMetrics.punctuationFrequency.question * newWeight,
          ellipsis:
            existing.metrics.punctuationFrequency.ellipsis * existingWeight +
            newMetrics.punctuationFrequency.ellipsis * newWeight,
          dash:
            existing.metrics.punctuationFrequency.dash * existingWeight +
            newMetrics.punctuationFrequency.dash * newWeight,
        },
        commonWords: this.mergeCommonWords(existing.metrics.commonWords, newMetrics.commonWords),
        syntacticPatterns: {
          contractions:
            existing.metrics.syntacticPatterns.contractions * existingWeight +
            newMetrics.syntacticPatterns.contractions * newWeight,
          formalPhrases:
            existing.metrics.syntacticPatterns.formalPhrases * existingWeight +
            newMetrics.syntacticPatterns.formalPhrases * newWeight,
          casualPhrases:
            existing.metrics.syntacticPatterns.casualPhrases * existingWeight +
            newMetrics.syntacticPatterns.casualPhrases * newWeight,
        }
      },
      sampleSize: totalSampleSize,
      confidence: this.calculateConfidence(totalSampleSize),
      lastUpdated: Date.now()
    };

    this.storeFingerprint(projectId, updatedFingerprint);
    return updatedFingerprint;
  }

  private calculateVoiceMetrics(text: string, words: string[]) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.length / Math.max(sentences.length, 1);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const typeTokenRatio = uniqueWords.size / Math.max(words.length, 1);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);

    // Punctuation analysis
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    const ellipsisCount = (text.match(/\.{3,}|…/g) || []).length;
    const dashCount = (text.match(/--|\u2014/g) || []).length;
    const totalChars = text.length;

    // Common words analysis
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const lower = word.toLowerCase();
      wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1);
    });
    const commonWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, frequency: count / words.length }));

    // Syntactic patterns
    const textLower = text.toLowerCase();
    const contractionPatterns = /\b\w+'\w+\b/g; // don't, can't, etc.
    const contractionsCount = (textLower.match(contractionPatterns) || []).length;
    
    const formalPatterns = /\b(perhaps|however|nonetheless|furthermore|moreover|therefore|consequently)\b/g;
    const formalCount = (textLower.match(formalPatterns) || []).length;
    
    const casualPatterns = /\b(gonna|wanna|gotta|yeah|yep|nah|kinda|sorta)\b/g;
    const casualCount = (textLower.match(casualPatterns) || []).length;

    return {
      avgSentenceLength,
      typeTokenRatio,
      avgWordsPerSentence,
      punctuationFrequency: {
        exclamation: exclamationCount / Math.max(totalChars, 1) * 1000,
        question: questionCount / Math.max(totalChars, 1) * 1000,
        ellipsis: ellipsisCount / Math.max(totalChars, 1) * 1000,
        dash: dashCount / Math.max(totalChars, 1) * 1000,
      },
      commonWords,
      syntacticPatterns: {
        contractions: contractionsCount / Math.max(words.length, 1) * 100,
        formalPhrases: formalCount / Math.max(words.length, 1) * 100,
        casualPhrases: casualCount / Math.max(words.length, 1) * 100,
      }
    };
  }

  private calculateMatchScore(fingerprint: VoiceFingerprint['metrics'], sample: VoiceFingerprint['metrics']): number {
    let totalScore = 0;
    let weights = 0;

    // Sentence length similarity (weight: 2)
    const sentenceLengthSimilarity = 1 - Math.min(1, 
      Math.abs(fingerprint.avgSentenceLength - sample.avgSentenceLength) / 
      Math.max(fingerprint.avgSentenceLength, sample.avgSentenceLength, 1)
    );
    totalScore += sentenceLengthSimilarity * 2;
    weights += 2;

    // Type-token ratio similarity (weight: 3)
    const ttrSimilarity = 1 - Math.min(1,
      Math.abs(fingerprint.typeTokenRatio - sample.typeTokenRatio) / 
      Math.max(fingerprint.typeTokenRatio, sample.typeTokenRatio, 0.1)
    );
    totalScore += ttrSimilarity * 3;
    weights += 3;

    // Punctuation similarity (weight: 2)
    const punctSimilarity = 1 - (
      Math.abs(fingerprint.punctuationFrequency.exclamation - sample.punctuationFrequency.exclamation) +
      Math.abs(fingerprint.punctuationFrequency.question - sample.punctuationFrequency.question) +
      Math.abs(fingerprint.punctuationFrequency.ellipsis - sample.punctuationFrequency.ellipsis)
    ) / 30; // normalize by max expected difference
    totalScore += Math.max(0, punctSimilarity) * 2;
    weights += 2;

    // Syntactic patterns similarity (weight: 3)
    const syntaxSimilarity = 1 - (
      Math.abs(fingerprint.syntacticPatterns.contractions - sample.syntacticPatterns.contractions) +
      Math.abs(fingerprint.syntacticPatterns.formalPhrases - sample.syntacticPatterns.formalPhrases) +
      Math.abs(fingerprint.syntacticPatterns.casualPhrases - sample.syntacticPatterns.casualPhrases)
    ) / 30; // normalize by max expected difference
    totalScore += Math.max(0, syntaxSimilarity) * 3;
    weights += 3;

    return Math.max(0, Math.min(1, totalScore / weights));
  }

  private identifyDeviations(
    fingerprint: VoiceFingerprint['metrics'], 
    sample: VoiceFingerprint['metrics']
  ): VoiceAnalysisResult['deviations'] {
    const deviations: VoiceAnalysisResult['deviations'] = [];

    // Check sentence length deviation
    const sentenceDiff = Math.abs(fingerprint.avgSentenceLength - sample.avgSentenceLength);
    const sentenceThreshold = fingerprint.avgSentenceLength * 0.3;
    if (sentenceDiff > sentenceThreshold) {
      const severity = sentenceDiff > sentenceThreshold * 2 ? 'high' : 
                     sentenceDiff > sentenceThreshold * 1.5 ? 'medium' : 'low';
      deviations.push({
        type: 'sentence-length',
        severity,
        description: `Average sentence length differs significantly (${Math.round(sample.avgSentenceLength)} vs expected ${Math.round(fingerprint.avgSentenceLength)})`,
        suggestion: sample.avgSentenceLength > fingerprint.avgSentenceLength ?
          'Consider using shorter, more typical sentences for this character' :
          'Consider using longer sentences that match this character\'s usual style'
      });
    }

    // Check vocabulary richness
    const ttrDiff = Math.abs(fingerprint.typeTokenRatio - sample.typeTokenRatio);
    if (ttrDiff > 0.1) {
      const severity = ttrDiff > 0.2 ? 'high' : 'medium';
      deviations.push({
        type: 'vocabulary',
        severity,
        description: `Vocabulary richness differs from character's typical range`,
        suggestion: sample.typeTokenRatio > fingerprint.typeTokenRatio ?
          'Character is using more varied vocabulary than usual' :
          'Character is being more repetitive than usual'
      });
    }

    // Check punctuation patterns
    const exclamationDiff = Math.abs(fingerprint.punctuationFrequency.exclamation - sample.punctuationFrequency.exclamation);
    if (exclamationDiff > 5) {
      deviations.push({
        type: 'punctuation',
        severity: exclamationDiff > 15 ? 'high' : 'medium',
        description: 'Exclamation mark usage differs from character\'s typical pattern',
        suggestion: sample.punctuationFrequency.exclamation > fingerprint.punctuationFrequency.exclamation ?
          'Character is using more exclamations than usual' :
          'Character is using fewer exclamations than usual'
      });
    }

    return deviations;
  }

  private calculateConfidence(sampleSize: number): number {
    // Confidence based on sample size (words)
    if (sampleSize < 20) return 0.1;
    if (sampleSize < 50) return 0.3;
    if (sampleSize < 100) return 0.5;
    if (sampleSize < 200) return 0.7;
    if (sampleSize < 500) return 0.85;
    return 0.95;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s']/g, ' ') // Keep apostrophes for contractions
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private extractContext(text: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end).trim();
  }

  private createEmptyMetrics(): VoiceFingerprint['metrics'] {
    return {
      avgSentenceLength: 0,
      typeTokenRatio: 0,
      avgWordsPerSentence: 0,
      punctuationFrequency: {
        exclamation: 0,
        question: 0,
        ellipsis: 0,
        dash: 0,
      },
      commonWords: [],
      syntacticPatterns: {
        contractions: 0,
        formalPhrases: 0,
        casualPhrases: 0,
      }
    };
  }

  private mergeCommonWords(
    existing: Array<{ word: string; frequency: number }>,
    newWords: Array<{ word: string; frequency: number }>
  ): Array<{ word: string; frequency: number }> {
    const merged = new Map<string, number>();
    
    existing.forEach(({ word, frequency }) => {
      merged.set(word, frequency);
    });
    
    newWords.forEach(({ word, frequency }) => {
      merged.set(word, (merged.get(word) || 0) + frequency);
    });
    
    return Array.from(merged.entries())
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }

  private storeFingerprint(projectId: string, fingerprint: VoiceFingerprint): void {
    if (!this.fingerprints.has(projectId)) {
      this.fingerprints.set(projectId, new Map());
    }
    
    this.fingerprints.get(projectId)!.set(fingerprint.characterId, fingerprint);
    this.saveFingerprints();
  }

  private loadFingerprints(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        for (const [projectId, projectData] of Object.entries(data)) {
          const projectMap = new Map<string, VoiceFingerprint>();
          for (const [characterId, fingerprint] of Object.entries(projectData as Record<string, VoiceFingerprint>)) {
            projectMap.set(characterId, fingerprint);
          }
          this.fingerprints.set(projectId, projectMap);
        }
      }
    } catch (error) {
      console.warn('Failed to load voice fingerprints:', error);
    }
  }

  private saveFingerprints(): void {
    try {
      const data: Record<string, Record<string, VoiceFingerprint>> = {};
      for (const [projectId, projectMap] of this.fingerprints.entries()) {
        data[projectId] = {};
        for (const [characterId, fingerprint] of projectMap.entries()) {
          data[projectId][characterId] = fingerprint;
        }
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save voice fingerprints:', error);
    }
  }
}

export const voiceConsistencyService = new VoiceConsistencyService();