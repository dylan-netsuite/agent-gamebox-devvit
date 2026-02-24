/**
 * Answer validation for Scattergories.
 *
 * Rules:
 * 1. Must start with the required letter
 * 2. Minimum 2 characters
 * 3. Cannot be just the letter repeated (e.g. "aaa")
 * 4. Must contain at least one vowel (catches random consonant mashing)
 * 5. Cannot be a single character repeated with spaces
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

export function isAnswerValid(answer: string, letter: string): boolean {
  const norm = answer.trim().toLowerCase();

  if (norm.length < 2) return false;

  if (!norm.startsWith(letter.toLowerCase())) return false;

  const alphaOnly = norm.replace(/[^a-z]/g, '');
  if (alphaOnly.length < 2) return false;

  const uniqueChars = new Set(alphaOnly);
  if (uniqueChars.size === 1) return false;

  const hasVowel = alphaOnly.split('').some((c) => VOWELS.has(c));
  if (!hasVowel) return false;

  return true;
}
