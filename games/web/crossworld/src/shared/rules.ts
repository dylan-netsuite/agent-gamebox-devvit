import type { Draft } from "./types";
export const SCENARIO = "chatterbloom-postcard-v1";
export const API_ROOT = `/api/${SCENARIO}`;

export const RESTRICTIONS = [
  { id: "brief", name: "Pocket Posy", rule: "Use at most 4 words." },
  { id: "seven", name: "Seven Petals", rule: "Use exactly 7 words." },
  {
    id: "no-e",
    name: "E’s Day Off",
    rule: "Do not use the letter E in your clue.",
  },
  {
    id: "no-articles",
    name: "Pull the Weeds",
    rule: "Do not use the words A, AN, or THE.",
  },
  {
    id: "short-words",
    name: "Tiny Seeds",
    rule: "Every clue word must be 4 letters or fewer.",
  },
  {
    id: "same-start",
    name: "Twin Blossoms",
    rule: "At least 2 clue words must start with the same letter.",
  },
  {
    id: "no-b",
    name: "Bee-Free Patch",
    rule: "Do not use the letter B in your clue.",
  },
];

// One explicit tokenizer serves the displayed rules and every restriction.
export const clueWords = (clue: string): string[] =>
  clue.toLowerCase().match(/[a-z]+/g) ?? [];

export function validateTurn(
  turn: Draft,
  crossing: { index: number; letter: string } | null = {
    index: 1,
    letter: "A",
  },
) {
  const issues = [];
  const word = turn.word.trim().toUpperCase();
  const clue = turn.clue.trim();
  const words = clueWords(clue);
  if (!turn.revealed) issues.push("Reveal today’s slot first.");
  if (!RESTRICTIONS.some(({ id }) => id === turn.restriction))
    issues.push("Choose one restriction.");
  if (!/^[A-Z]{5}$/.test(word))
    issues.push("Your answer must be exactly 5 letters, A–Z.");
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
    }
  }
  return { issues, word, clue, wordCount: words.length };
}
