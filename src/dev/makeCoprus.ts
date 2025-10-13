// src/dev/makeCorpus.ts

/** Build a synthetic corpus with approximately `targetWords` words. */
export function _makeCorpus(targetWords: number, vocabParam?: readonly string[]): string {
  const vocabDefault = [
    'alpha',
    'bravo',
    'charlie',
    'delta',
    'echo',
    'foxtrot',
    'golf',
    'hotel',
    'india',
    'juliet',
    'kilo',
    'lima',
    'mike',
    'november',
    'oscar',
    'papa',
    'quebec',
    'romeo',
    'sierra',
    'tango',
    'uniform',
    'victor',
    'whiskey',
    'xray',
    'yankee',
    'zulu',
  ] as const;

  const vocab: readonly string[] = (
    vocabParam && vocabParam.length > 0 ? vocabParam : vocabDefault
  ) as readonly string[];

  // Safe picker for arrays even with noUncheckedIndexedAccess
  const pick = (arr: readonly string[]): string => {
    if (arr.length === 0) return 'word';
    const idx = Math.floor(Math.random() * arr.length);
    const val = arr[idx];
    return typeof val === 'string' ? val : 'word';
  };

  let words = 0;
  const parts: string[] = [];

  while (words < targetWords) {
    const sentenceLen = 8 + Math.floor(Math.random() * 12); // 8–19 words
    const sentence: string[] = [];

    for (let i = 0; i < sentenceLen && words < targetWords; i++) {
      const w: string = pick(vocab);
      const out = i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w; // charAt safe
      sentence.push(out);
      words++;
    }

    parts.push(sentence.join(' ') + '.');
    if (words % 120 === 0) parts.push('\n'); // paragraph break every ~120 words
  }

  return parts.join(' ');
}

/** Quick approximate word counter for validation in benchmarks. */
export function _approxWordCount(s: string | null | undefined): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// Public API
export const makeCorpus = _makeCorpus;
export const approxWordCount = _approxWordCount;
