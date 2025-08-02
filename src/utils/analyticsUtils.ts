// src/utils/analyticsUtils.ts

// Define basic types locally to avoid import issues
interface WritingSession {
  id: string;
  date: string;
  startTime: Date;
  wordsWritten: number;
  timeSpent: number;
}

interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  target: number;
}

interface ProjectAnalytics {
  milestones: Array<{
    name: string;
    target: number;
    achieved: boolean;
    date?: Date;
  }>;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ExportedData {
  sessions: WritingSession[];
  goals: WritingGoal[];
  insights: any[];
  exportedAt: string;
  version: string;
}

/**
 * Validates the structure of imported analytics data
 */
export function validateImportedData(data: any): DataValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    errors.push('Data must be a valid object');
    return { isValid: false, errors };
  }

  if (!data.version || typeof data.version !== 'string') {
    errors.push('Missing or invalid version field');
  }

  if (data.sessions) {
    if (!Array.isArray(data.sessions)) {
      errors.push('Sessions must be an array');
    } else {
      data.sessions.forEach((session: any, index: number) => {
        if (!session.id || typeof session.id !== 'string') {
          errors.push(`Session ${index}: missing or invalid id`);
        }
        if (!session.date || typeof session.date !== 'string') {
          errors.push(`Session ${index}: missing or invalid date`);
        }
        if (typeof session.wordsWritten !== 'number' || session.wordsWritten < 0) {
          errors.push(`Session ${index}: invalid wordsWritten`);
        }
      });
    }
  }

  if (data.goals) {
    if (!Array.isArray(data.goals)) {
      errors.push('Goals must be an array');
    } else {
      data.goals.forEach((goal: any, index: number) => {
        if (!goal.id || typeof goal.id !== 'string') {
          errors.push(`Goal ${index}: missing or invalid id`);
        }
        if (!goal.type || !['daily', 'weekly', 'monthly', 'project'].includes(goal.type)) {
          errors.push(`Goal ${index}: invalid type`);
        }
        if (typeof goal.target !== 'number' || goal.target <= 0) {
          errors.push(`Goal ${index}: invalid target`);
        }
      });
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Calculates daily averages from writing sessions
 */
export function calculateDailyAverage(sessions: WritingSession[]): number {
  if (sessions.length === 0) return 0;
  
  const dailyTotals = new Map<string, number>();
  
  sessions.forEach(session => {
    const date = session.date;
    dailyTotals.set(date, (dailyTotals.get(date) || 0) + session.wordsWritten);
  });
  
  const values = Array.from(dailyTotals.values());
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}

/**
 * Calculates weekly writing trends
 */
export function calculateWeeklyTrend(sessions: WritingSession[]): { week: string; words: number }[] {
  const weeklyData = new Map<string, number>();
  
  sessions.forEach(session => {
    const date = new Date(session.date);
    const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + session.wordsWritten);
  });
  
  return Array.from(weeklyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, words]) => ({ week, words }));
}

/**
 * Analyzes productivity patterns by time of day
 */
export function analyzeTimeOfDayPatterns(sessions: WritingSession[]): { hour: number; productivity: number }[] {
  const hourlyData = new Array(24).fill(null).map((_, hour) => ({ hour, productivity: 0, count: 0 }));
  
  sessions.forEach(session => {
    const hour = session.startTime.getHours();
    const productivity = session.timeSpent > 0 ? session.wordsWritten / session.timeSpent : 0;
    
    hourlyData[hour].productivity += productivity;
    hourlyData[hour].count++;
  });
  
  return hourlyData.map(data => ({
    hour: data.hour,
    productivity: data.count > 0 ? Math.round(data.productivity / data.count * 100) / 100 : 0,
  }));
}

/**
 * Analyzes productivity patterns by day of week
 */
export function analyzeDayOfWeekPatterns(sessions: WritingSession[]): { day: string; productivity: number }[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyData = days.map(day => ({ day, productivity: 0, count: 0 }));
  
  sessions.forEach(session => {
    const dayIndex = session.startTime.getDay();
    const productivity = session.timeSpent > 0 ? session.wordsWritten / session.timeSpent : 0;
    
    dailyData[dayIndex].productivity += productivity;
    dailyData[dayIndex].count++;
  });
  
  return dailyData.map(data => ({
    day: data.day,
    productivity: data.count > 0 ? Math.round(data.productivity / data.count * 100) / 100 : 0,
  }));
}

/**
 * Analyzes writing efficiency by session length
 */
export function analyzeSessionLengthPatterns(sessions: WritingSession[]): { duration: number; efficiency: number }[] {
  const durationRanges = [
    { min: 0, max: 15, duration: 15 },
    { min: 15, max: 30, duration: 30 },
    { min: 30, max: 60, duration: 60 },
    { min: 60, max: 120, duration: 120 },
    { min: 120, max: Infinity, duration: 180 },
  ];
  
  const rangeData = durationRanges.map(range => ({ ...range, efficiency: 0, count: 0 }));
  
  sessions.forEach(session => {
    const range = rangeData.find(r => session.timeSpent >= r.min && session.timeSpent < r.max);
    if (range) {
      const efficiency = session.timeSpent > 0 ? session.wordsWritten / session.timeSpent : 0;
      range.efficiency += efficiency;
      range.count++;
    }
  });
  
  return rangeData.map(range => ({
    duration: range.duration,
    efficiency: range.count > 0 ? Math.round(range.efficiency / range.count * 100) / 100 : 0,
  }));
}

/**
 * Analyzes word count distribution across sessions
 */
export function analyzeWordCountDistribution(sessions: WritingSession[]): { range: string; frequency: number }[] {
  const ranges = [
    { range: '0-100', min: 0, max: 100 },
    { range: '100-300', min: 100, max: 300 },
    { range: '300-500', min: 300, max: 500 },
    { range: '500-1000', min: 500, max: 1000 },
    { range: '1000+', min: 1000, max: Infinity },
  ];
  
  const distribution = ranges.map(r => ({ range: r.range, frequency: 0 }));
  
  sessions.forEach(session => {
    const range = ranges.find(r => session.wordsWritten >= r.min && session.wordsWritten < r.max);
    if (range) {
      const distIndex = distribution.findIndex(d => d.range === range.range);
      if (distIndex !== -1) {
        distribution[distIndex].frequency++;
      }
    }
  });
  
  return distribution;
}

/**
 * Calculates writing velocity (recent average words per day)
 */
export function calculateVelocity(sessions: WritingSession[], lookbackDays: number = 7): number {
  if (sessions.length < 3) return 0;
  
  const recentSessions = sessions.slice(-lookbackDays);
  const totalWords = recentSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
  const uniqueDays = new Set(recentSessions.map(s => s.date)).size;
  
  return uniqueDays > 0 ? Math.round(totalWords / uniqueDays) : 0;
}

/**
 * Estimates project completion date based on current progress and velocity
 */
export function estimateCompletion(
  currentWords: number, 
  targetWords: number, 
  velocity: number
): { date: Date | null; message: string } {
  if (currentWords >= targetWords) {
    return { date: new Date(), message: 'Project completed!' };
  }

  if (velocity <= 0) {
    return { date: null, message: 'Not enough writing data to estimate completion' };
  }
  
  const remainingWords = targetWords - currentWords;
  const daysNeeded = Math.ceil(remainingWords / velocity);
  
  if (daysNeeded > 730) { // More than 2 years
    return { date: null, message: 'Completion estimate exceeds 2 years' };
  }
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeeded);
  
  const message = daysNeeded === 1 ? 'Tomorrow' : 
                  daysNeeded <= 7 ? `In ${daysNeeded} days` :
                  daysNeeded <= 30 ? `In ${Math.ceil(daysNeeded / 7)} weeks` :
                  `In ${Math.ceil(daysNeeded / 30)} months`;
  
  return { date: completionDate, message };
}

/**
 * Generates project milestones with achievement status
 */
export function generateMilestones(targetWords: number, currentWords: number): ProjectAnalytics['milestones'] {
  const milestones = [
    { name: '25% Complete', target: Math.round(targetWords * 0.25) },
    { name: '50% Complete', target: Math.round(targetWords * 0.5) },
    { name: '75% Complete', target: Math.round(targetWords * 0.75) },
    { name: 'First Draft Complete', target: targetWords },
  ];
  
  return milestones.map(milestone => ({
    ...milestone,
    achieved: currentWords >= milestone.target,
    date: currentWords >= milestone.target ? new Date() : undefined,
  }));
}

/**
 * Calculates consistency score (percentage of days with writing activity)
 */
export function calculateConsistency(sessions: WritingSession[]): number {
  if (sessions.length === 0) return 0;
  
  const daysWithWriting = new Set(sessions.map(s => s.date)).size;
  const firstSession = sessions.reduce((earliest, session) => 
    new Date(session.date) < new Date(earliest.date) ? session : earliest
  );
  const totalDays = Math.max(1, Math.ceil((Date.now() - new Date(firstSession.date).getTime()) / (1000 * 60 * 60 * 24)));
  
  return Math.round((daysWithWriting / totalDays) * 100);
}

/**
 * Calculates current writing streak in days
 */
export function calculateStreak(sessions: WritingSession[]): number {
  if (sessions.length === 0) return 0;
  
  const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  
  let streak = 0;
  let currentDate = today;
  
  for (const date of sortedDates) {
    if (date === currentDate) {
      streak++;
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      currentDate = prevDate.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Formats hour for display (e.g., "9:00 AM")
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Counts syllables in a word (for readability scoring)
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const vowelGroups = word.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

/**
 * Determines text complexity based on sentence length and vocabulary richness
 */
export function determineComplexity(avgWordsPerSentence: number, vocabularyRichness: number): 'simple' | 'moderate' | 'complex' {
  const complexityScore = avgWordsPerSentence * 0.6 + vocabularyRichness * 40;
  
  if (complexityScore >= 25) return 'complex';
  if (complexityScore >= 15) return 'moderate';
  return 'simple';
}

/**
 * Gets top frequent words from text (excluding common words)
 */
export function getTopWords(words: string[], count: number): { word: string; frequency: number }[] {
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 
    'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my'
  ]);
  
  const wordCount = new Map<string, number>();
  
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word, frequency]) => ({ word, frequency }));
}

/**
 * Splits text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

/**
 * Calculates Flesch Reading Ease score
 */
export function calculateReadabilityScore(text: string): number {
  const sentences = splitIntoSentences(text);
  const words = text.match(/\b\w+\b/g) || [];
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}