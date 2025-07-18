// src/utils/textAnalysis.ts
export interface TextStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number; // minutes at 200wpm
  averageWordsPerSentence: number;
  lengthCategory: 'Short' | 'Medium' | 'Long' | 'Very Long';
}

export function analyzeText(content: string): TextStats {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const wordCount = words.length;
  const characterCount = content.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // Minimum 1 minute

  let lengthCategory: TextStats['lengthCategory'] = 'Short';
  if (wordCount >= 5000) lengthCategory = 'Very Long';
  else if (wordCount >= 2000) lengthCategory = 'Long';
  else if (wordCount >= 500) lengthCategory = 'Medium';

  return {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    readingTime,
    averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
    lengthCategory,
  };
}
 