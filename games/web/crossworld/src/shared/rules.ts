import type { Draft } from "./types";
export const SCENARIO = "chatterbloom-postcard-v1";
export const API_ROOT = `/api/${SCENARIO}`;

// The deterministic mechanic registry. Every restriction is checkable on the
// clue string alone; the judge never rules on constraint compliance. Display
// names are per-world (see each world's deck) so the same mechanic can read as
// "Grains" on a beach and "Tiny Seeds" in a garden without forking this switch.
export const RESTRICTIONS = [
  {
    id: "brief",
    label: "Up to 4 words",
    detail: "Keep it concise",
    rule: "Use at most 4 words.",
  },
  {
    id: "seven",
    label: "7 words",
    detail: "Make every word count",
    rule: "Use exactly 7 words.",
  },
  {
    id: "no-e",
    label: "No E",
    detail: "Leave E out",
    rule: "Do not use the letter E in your clue.",
  },
  {
    id: "no-articles",
    label: "No articles",
    detail: "Skip a, an & the",
    rule: "Do not use the words A, AN, or THE.",
  },
  {
    id: "short-words",
    label: "Short words",
    detail: "Up to 4 letters each",
    rule: "Every clue word must be 4 letters or fewer.",
  },
  {
    id: "same-start",
    label: "Same initials",
    detail: "Two matching initials",
    rule: "At least 2 clue words must start with the same letter.",
  },
  {
    id: "no-b",
    label: "No B",
    detail: "Leave B out",
    rule: "Do not use the letter B in your clue.",
  },
  {
    id: "two-breaths",
    label: "2 words",
    detail: "Exactly two words",
    rule: "Use exactly 2 words.",
  },
  {
    id: "half-measure",
    label: "30 characters",
    detail: "Thirty characters or fewer",
    rule: "Keep the whole clue within 30 characters.",
  },
  {
    id: "long-shadow",
    label: "An 8+ letter word",
    detail: "One word of eight or more",
    rule: "At least one clue word must be 8 letters or longer.",
  },
];
export const mechanicFor = (id: string) =>
  RESTRICTIONS.find((mechanic) => mechanic.id === id);

// One explicit tokenizer serves the displayed rules and every restriction.
export const clueWords = (clue: string): string[] =>
  clue.toLowerCase().match(/[a-z]+/g) ?? [];

export function validateTurn(
  turn: Draft,
  crossing: { index: number; letter: string } | null = {
    index: 1,
    letter: "A",
  },
  length = 5,
) {
  const issues = [];
  const word = turn.word.trim().toUpperCase();
  const clue = turn.clue.trim();
  const words = clueWords(clue);
  if (!turn.revealed) issues.push("Reveal today’s slot first.");
  if (!RESTRICTIONS.some(({ id }) => id === turn.restriction))
    issues.push("Choose one restriction.");
  if (word.length !== length || !/^[A-Z]+$/.test(word))
    issues.push(`Your answer must be exactly ${length} letters, A–Z.`);
  else if (crossing && word[crossing.index] !== crossing.letter)
    issues.push(
      crossing.index === 1 && crossing.letter === "A"
        ? "The second letter must be A to match the crossing."
        : `Letter ${crossing.index + 1} must be ${crossing.letter} to match the crossing.`,
    );
  if (!words.length) issues.push("Write a clue with at least one word.");
  if (clue.length > 140) issues.push("Keep your clue within 140 characters.");
  if (words.includes(word.toLowerCase()))
    issues.push(
      "Do not include your exact answer as a whole word in the clue.",
    );
  if (words.length) {
    switch (turn.restriction) {
      case "brief":
        if (words.length > 4) issues.push("Use at most 4 clue words.");
        break;
      case "seven":
        if (words.length !== 7) issues.push("Use exactly 7 clue words.");
        break;
      case "no-e":
        if (/e/i.test(clue)) issues.push("Remove every E from your clue.");
        break;
      case "no-b":
        if (/b/i.test(clue)) issues.push("Remove every B from your clue.");
        break;
      case "no-articles":
        if (words.some((w) => ["a", "an", "the"].includes(w)))
          issues.push("Remove the whole words A, AN, and THE.");
        break;
      case "short-words":
        if (words.some((w) => w.length > 4))
          issues.push("Each clue word must be 4 letters or fewer.");
        break;
      case "same-start":
        if (new Set(words.map((w) => w[0])).size === words.length)
          issues.push("Use at least 2 words with the same starting letter.");
        break;
      case "two-breaths":
        if (words.length !== 2) issues.push("Use exactly 2 clue words.");
        break;
      case "half-measure":
        if (clue.length > 30)
          issues.push("Keep this clue within 30 characters.");
        break;
      case "long-shadow":
        if (!words.some((w) => w.length >= 8))
          issues.push("Include one clue word of 8 letters or more.");
        break;
    }
  }
  return { issues, word, clue, wordCount: words.length };
}
