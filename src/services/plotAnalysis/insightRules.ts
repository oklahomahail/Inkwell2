// Deterministic insight rules for plot analysis

import type { BookMetrics, ChapterMetrics, Insight, Scorecard, Grade } from './types';

/**
 * Calculate cumulative word percentages for each chapter
 */
function getCumulativePercentages(chapters: ChapterMetrics[], totalWords: number): number[] {
  let cumulative = 0;
  return chapters.map((ch) => {
    cumulative += ch.words;
    return cumulative / totalWords;
  });
}

/**
 * Rule 1: Midpoint placement
 */
function checkMidpointPlacement(data: BookMetrics): Insight | null {
  const { chapters, totalWords, targets } = data;
  const cumPct = getCumulativePercentages(chapters, totalWords);

  const midpointIndex = cumPct.findIndex((pct) => pct >= 0.5);
  if (midpointIndex === -1) return null;

  const actualPct = cumPct[midpointIndex];
  const [minPct, maxPct] = targets.midpointPct;

  if (actualPct < minPct || actualPct > maxPct) {
    return {
      id: 'midpoint-placement',
      severity: 'high',
      finding: `Midpoint arrives at ${(actualPct * 100).toFixed(0)}% (target: ${(minPct * 100).toFixed(0)}-${(maxPct * 100).toFixed(0)}%). Story structure may feel unbalanced.`,
      suggestion: `Move or condense setup before Chapter ${midpointIndex + 1}, or advance key turn into earlier chapters.`,
      affectedChapters: [midpointIndex],
    };
  }

  return null;
}

/**
 * Rule 2: Opening hook strength
 */
function checkOpeningHook(data: BookMetrics): Insight | null {
  const { chapters } = data;
  if (chapters.length < 3) return null;

  const ch1 = chapters[0];
  const conflictVerbs = [
    'struggle',
    'lose',
    'risk',
    'discover',
    'chase',
    'fight',
    'escape',
    'confront',
  ];
  const hasConflict = conflictVerbs.some(
    (verb) => ch1.summary.toLowerCase().includes(verb) || ch1.tags.includes('conflict'),
  );

  const avgNext = (chapters[1].words + chapters[2].words) / 2;

  if (!hasConflict && ch1.words < 1200 && avgNext > 1500) {
    return {
      id: 'opening-hook',
      severity: 'high',
      finding:
        'Chapter 1 lacks conflict markers and is notably short compared to following chapters.',
      suggestion: 'Sharpen Chapter 1 stakes, plant a concrete problem in first 300-500 words.',
      affectedChapters: [0],
    };
  }

  return null;
}

/**
 * Rule 3: Sagging middle
 */
function checkSaggingMiddle(data: BookMetrics): Insight | null {
  const { chapters, totalWords } = data;
  if (chapters.length < 10) return null;

  const cumPct = getCumulativePercentages(chapters, totalWords);
  const midStart = cumPct.findIndex((pct) => pct >= 0.4);
  const midEnd = cumPct.findIndex((pct) => pct >= 0.6);

  if (midStart === -1 || midEnd === -1) return null;

  const middleChapters = chapters.slice(midStart, midEnd + 1);
  const avgWords = totalWords / chapters.length;
  const middleAvg = middleChapters.reduce((sum, ch) => sum + ch.words, 0) / middleChapters.length;

  const hasTurnTag = middleChapters.some(
    (ch) => ch.tags.includes('turn') || ch.tags.includes('complication'),
  );

  if (middleAvg < avgWords * 0.8 && !hasTurnTag) {
    return {
      id: 'sagging-middle',
      severity: 'high',
      finding: `Middle section (40-60%) averages ${middleAvg.toFixed(0)} words vs book avg ${avgWords.toFixed(0)}. No turn/complication tags detected.`,
      suggestion: `Insert escalation beat or merge low-impact chapters into one purposeful scene.`,
      affectedChapters: middleChapters.map((ch) => ch.i),
    };
  }

  return null;
}

/**
 * Rule 4: Climax timing
 */
function checkClimaxTiming(data: BookMetrics): Insight | null {
  const { chapters, totalWords, targets } = data;
  if (chapters.length < 5) return null;

  const cumPct = getCumulativePercentages(chapters, totalWords);
  const maxWordsIndex = chapters.reduce(
    (maxI, ch, i) => (ch.words > chapters[maxI].words ? i : maxI),
    0,
  );

  const climaxPct = cumPct[maxWordsIndex];
  const [minPct, maxPct] = targets.climaxPct;

  if (climaxPct < minPct || climaxPct > maxPct) {
    return {
      id: 'climax-timing',
      severity: 'med',
      finding: `Highest-intensity chapter (${chapters[maxWordsIndex].title}) lands at ${(climaxPct * 100).toFixed(0)}% (target: ${(minPct * 100).toFixed(0)}-${(maxPct * 100).toFixed(0)}%).`,
      suggestion: `Shift highest-intensity material to ~85-90% mark or raise stakes in late chapters.`,
      affectedChapters: [maxWordsIndex],
    };
  }

  return null;
}

/**
 * Rule 5: Chapter length variance
 */
function checkChapterVariance(data: BookMetrics): Insight | null {
  const { chapters } = data;
  if (chapters.length < 5) return null;

  const mean = chapters.reduce((sum, ch) => sum + ch.words, 0) / chapters.length;
  const variance =
    chapters.reduce((sum, ch) => sum + Math.pow(ch.words - mean, 2), 0) / chapters.length;
  const stdDev = Math.sqrt(variance);

  const shortChapters = chapters.filter(
    (ch) => ch.words < 600 && !ch.tags.includes('bridge') && !ch.tags.includes('beat'),
  );

  if (stdDev > 0.6 * mean && shortChapters.length >= 2) {
    return {
      id: 'chapter-variance',
      severity: 'low',
      finding: `High chapter length variance (σ=${stdDev.toFixed(0)}). ${shortChapters.length} ultra-short chapters detected.`,
      suggestion: `Normalize chapter lengths, convert ultra-shorts into scene beats inside adjacent chapters.`,
      affectedChapters: shortChapters.map((ch) => ch.i),
    };
  }

  return null;
}

/**
 * Rule 6: Idle chapters (low purpose)
 */
function checkIdleChapters(data: BookMetrics): Insight | null {
  const { chapters } = data;
  const purposeTags = ['setup', 'conflict', 'turn', 'payoff'];
  const goalMarkers = ['to ', 'so that', 'but', 'therefore', 'goal:', 'outcome:'];

  const idle = chapters.filter((ch) => {
    const hasTag = purposeTags.some((tag) => ch.tags.includes(tag));
    const hasGoal = goalMarkers.some((marker) => ch.summary.toLowerCase().includes(marker));
    return !hasTag && !hasGoal;
  });

  if (idle.length > 0 && idle.length <= 3) {
    const first = idle[0];
    return {
      id: 'idle-chapters',
      severity: 'med',
      finding: `${idle.length} chapter(s) lack clear purpose tags and goal/outcome markers.`,
      suggestion: `Give Chapter ${first.i + 1} a clear objective and outcome, or fold into adjacent chapter.`,
      affectedChapters: idle.map((ch) => ch.i),
    };
  }

  return null;
}

/**
 * Rule 7: POV balance
 */
function checkPOVBalance(data: BookMetrics): Insight | null {
  const { chapters } = data;

  const povCounts = new Map<string, number>();
  chapters.forEach((ch) => {
    if (ch.pov) {
      povCounts.set(ch.pov, (povCounts.get(ch.pov) || 0) + 1);
    }
  });

  if (povCounts.size < 2) return null; // Single POV is fine

  const total = chapters.length;
  const imbalanced = Array.from(povCounts.entries()).filter(([_pov, count]) => {
    const share = count / total;
    return share > 0.6 || share < 0.1;
  });

  if (imbalanced.length > 0) {
    const [pov, count] = imbalanced[0];
    const share = ((count / total) * 100).toFixed(0);
    return {
      id: 'pov-balance',
      severity: 'low',
      finding: `POV "${pov}" appears in ${share}% of chapters. Consider balancing viewpoint distribution.`,
      suggestion: `Re-distribute POV chapters so secondary POV appears at key turns only.`,
      affectedChapters: [],
    };
  }

  return null;
}

/**
 * Rule 8: Pacing whiplash
 */
function checkPacingWhiplash(data: BookMetrics): Insight | null {
  const { chapters } = data;
  if (chapters.length < 3) return null;

  const mean = chapters.reduce((sum, ch) => sum + ch.words, 0) / chapters.length;
  const whiplash: number[] = [];

  for (let i = 0; i < chapters.length - 1; i++) {
    const delta = Math.abs(chapters[i + 1].words - chapters[i].words);
    const isBridge = chapters[i].tags.includes('bridge') || chapters[i + 1].tags.includes('bridge');

    if (delta >= 0.7 * mean && !isBridge) {
      whiplash.push(i);
    }
  }

  if (whiplash.length > 0) {
    const first = whiplash[0];
    return {
      id: 'pacing-whiplash',
      severity: 'low',
      finding: `${whiplash.length} abrupt length change(s) detected between adjacent chapters.`,
      suggestion: `Add a short decompression beat or trim the spike to smooth transition around Chapter ${first + 1}.`,
      affectedChapters: whiplash.slice(0, 3),
    };
  }

  return null;
}

/**
 * Rule 9: Late inciting incident
 */
function checkLateInciting(data: BookMetrics): Insight | null {
  const { chapters, totalWords, targets } = data;
  if (chapters.length < 3) return null;

  const cumPct = getCumulativePercentages(chapters, totalWords);
  const firstConflict = chapters.findIndex(
    (ch) => ch.tags.includes('conflict') || ch.tags.includes('inciting'),
  );

  if (firstConflict > 0 && cumPct[firstConflict] > targets.incitingPctMax) {
    return {
      id: 'late-inciting',
      severity: 'med',
      finding: `First conflict/inciting tag appears at ${(cumPct[firstConflict] * 100).toFixed(0)}% (target: <${(targets.incitingPctMax * 100).toFixed(0)}%).`,
      suggestion: `Pull the inciting event earlier (by ~1 chapter) or foreshadow the threat in Chapter 1.`,
      affectedChapters: [firstConflict],
    };
  }

  return null;
}

/**
 * Rule 10: Underused resolution
 */
function checkResolution(data: BookMetrics): Insight | null {
  const { chapters, totalWords } = data;
  if (chapters.length < 5) return null;

  const cumPct = getCumulativePercentages(chapters, totalWords);
  const last10PctIndex = cumPct.findIndex((pct) => pct >= 0.9);

  if (last10PctIndex === -1) return null;

  const finalChapters = chapters.slice(last10PctIndex);
  const finalWords = finalChapters.reduce((sum, ch) => sum + ch.words, 0);
  const finalShare = finalWords / totalWords;

  const hasResolution = finalChapters.some(
    (ch) => ch.tags.includes('resolution') || ch.tags.includes('aftermath'),
  );

  if (finalShare < 0.05 && !hasResolution) {
    return {
      id: 'thin-resolution',
      severity: 'med',
      finding: 'Final 10% has <5% of total words and no resolution/aftermath tag.',
      suggestion: 'Allocate a short aftermath chapter to show consequences and new normal.',
      affectedChapters: finalChapters.map((ch) => ch.i),
    };
  }

  return null;
}

/**
 * Run all insight rules and return top insights
 */
export function generateInsights(data: BookMetrics): Insight[] {
  const rules = [
    checkMidpointPlacement,
    checkOpeningHook,
    checkSaggingMiddle,
    checkClimaxTiming,
    checkChapterVariance,
    checkIdleChapters,
    checkPOVBalance,
    checkPacingWhiplash,
    checkLateInciting,
    checkResolution,
  ];

  const insights = rules
    .map((rule) => rule(data))
    .filter((insight): insight is Insight => insight !== null);

  // Sort by severity (high > med > low) and take top 6
  const severityOrder = { high: 3, med: 2, low: 1 };
  insights.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return insights.slice(0, 6);
}

/**
 * Compute scorecard metrics
 */
export function computeScorecard(data: BookMetrics, insights: Insight[]): Scorecard {
  const { chapters, totalWords } = data;

  // Structure score (40 points)
  let structureScore = 40;
  if (insights.some((i) => i.id === 'midpoint-placement')) structureScore -= 20;
  if (insights.some((i) => i.id === 'late-inciting')) structureScore -= 10;
  if (insights.some((i) => i.id === 'climax-timing')) structureScore -= 10;

  // Pacing score (30 points)
  let pacingScore = 30;
  if (insights.some((i) => i.id === 'chapter-variance')) pacingScore -= 10;
  if (insights.some((i) => i.id === 'sagging-middle')) pacingScore -= 10;
  if (insights.some((i) => i.id === 'pacing-whiplash')) pacingScore -= 10;

  // Scene purpose score (20 points)
  const purposeTags = ['setup', 'conflict', 'turn', 'payoff'];
  const withPurpose = chapters.filter((ch) =>
    purposeTags.some((tag) => ch.tags.includes(tag)),
  ).length;
  const purposePct = withPurpose / chapters.length;
  const scenePurposeScore = Math.round(purposePct * 20);

  // Coverage score (10 points)
  const cumPct = getCumulativePercentages(chapters, totalWords);
  const beginEnd = cumPct.findIndex((p) => p >= 0.25);
  const middleEnd = cumPct.findIndex((p) => p >= 0.75);

  let coverageScore = 10;
  if (beginEnd < 0 || middleEnd < 0) coverageScore = 0;
  else {
    const beginShare = cumPct[beginEnd];
    const endShare = 1 - cumPct[middleEnd];

    if (Math.abs(beginShare - 0.25) > 0.1) coverageScore -= 3;
    if (Math.abs(endShare - 0.25) > 0.1) coverageScore -= 3;
  }

  // Normalize to 0-100 scale
  const structure = Math.max(0, Math.round((structureScore / 40) * 100));
  const pacing = Math.max(0, Math.round((pacingScore / 30) * 100));
  const scenePurpose = Math.max(0, Math.round((scenePurposeScore / 20) * 100));
  const coverage = Math.max(0, Math.round((coverageScore / 10) * 100));

  const overall = Math.round(structure * 0.4 + pacing * 0.3 + scenePurpose * 0.2 + coverage * 0.1);

  // Assign grade
  let grade: Grade = 'F';
  if (overall >= 90) grade = 'A';
  else if (overall >= 80) grade = 'B';
  else if (overall >= 70) grade = 'C';
  else if (overall >= 60) grade = 'D';

  return {
    structure,
    pacing,
    scenePurpose,
    coverage,
    overall,
    grade,
  };
}
