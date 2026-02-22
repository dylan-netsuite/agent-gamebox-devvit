/**
 * Fuzzy answer matching for Jeopardy.
 *
 * Normalizes both the player's input and the correct answer, then
 * compares using multiple strategies to determine a "good enough" match.
 */

const JEOPARDY_PREFIXES = [
  'what is',
  'what are',
  'what was',
  'what were',
  'who is',
  'who are',
  'who was',
  'who were',
  'where is',
  'where are',
  'when is',
  'when was',
];

const ARTICLES = ['a', 'an', 'the'];

/** Strip common Jeopardy answer prefixes like "What is..." */
function stripPrefix(s: string): string {
  for (const prefix of JEOPARDY_PREFIXES) {
    if (s.startsWith(prefix + ' ')) {
      return s.slice(prefix.length + 1).trim();
    }
    if (s.startsWith(prefix + '...')) {
      return s.slice(prefix.length + 3).trim();
    }
  }
  return s;
}

/** Strip leading articles */
function stripArticles(s: string): string {
  const words = s.split(/\s+/);
  while (words.length > 1 && ARTICLES.includes(words[0]!)) {
    words.shift();
  }
  return words.join(' ');
}

/** Normalize a string for comparison */
function normalize(raw: string): string {
  let s = raw.toLowerCase().trim();
  // Remove punctuation
  s = s.replace(/[^a-z0-9\s]/g, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  s = stripPrefix(s);
  s = stripArticles(s);
  return s;
}

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

/** Similarity ratio between 0 and 1 */
function similarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export interface MatchResult {
  correct: boolean;
  similarity: number;
}

/**
 * Check if the player's answer is "good enough" to count as correct.
 *
 * Matching strategies (in order):
 * 1. Exact normalized match → correct
 * 2. One contains the other → correct
 * 3. Levenshtein similarity >= 0.75 → correct
 */
export function checkAnswer(playerAnswer: string, correctAnswer: string): MatchResult {
  if (!playerAnswer.trim()) {
    return { correct: false, similarity: 0 };
  }

  const pNorm = normalize(playerAnswer);
  const cNorm = normalize(correctAnswer);

  if (!pNorm || !cNorm) {
    return { correct: false, similarity: 0 };
  }

  // Exact match
  if (pNorm === cNorm) {
    return { correct: true, similarity: 1 };
  }

  // Containment check: if one fully contains the other
  if (pNorm.includes(cNorm) || cNorm.includes(pNorm)) {
    return { correct: true, similarity: 0.95 };
  }

  // Fuzzy match via Levenshtein
  const sim = similarity(pNorm, cNorm);
  return { correct: sim >= 0.75, similarity: sim };
}
