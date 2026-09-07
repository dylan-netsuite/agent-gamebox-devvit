import type { Draft } from "./types";
export const SCENARIO = "crossworld-live-turn-1-v1";

export const RESTRICTIONS = [
  { id: "brief", name: "Keep it brief", rule: "Use at most 4 words." },
  { id: "seven", name: "Seven words", rule: "Use exactly 7 words." },
  {
    id: "no-e",
    name: "Without E",
    rule: "Do not use the letter E in your clue.",
  },
  {
    id: "no-articles",
    name: "Skip the articles",
    rule: "Do not use the words A, AN, or THE.",
  },
  {
    id: "short-words",
    name: "Small words",
    rule: "Every clue word must be 4 letters or fewer.",
  },
  {
    id: "same-start",
    name: "Same start",
    rule: "Use at least 2 words, all starting with the same letter.",
  },
  {
    id: "no-a",
    name: "Without A",
    rule: "Do not use the letter A in your clue.",
  },
];

// One explicit tokenizer serves the displayed rules and every restriction.
export const clueWords = (clue: string): string[] =>
  clue.toLowerCase().match(/[a-z]+/g) ?? [];

export function validateTurn(turn: Draft) {
  const issues = [];
  const word = turn.word.trim().toUpperCase();
  const clue = turn.clue.trim();
  const words = clueWords(clue);
  if (!turn.revealed) issues.push("Reveal today’s slot first.");
  if (!RESTRICTIONS.some(({ id }) => id === turn.restriction))
    issues.push("Choose one restriction.");
  if (!/^[A-Z]{5}$/.test(word))
    issues.push("Your answer must be exactly 5 letters, A–Z.");
  else if (word[1] !== "A")
    issues.push("The second letter must be A to match the crossing.");
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
      case "no-a":
        if (/a/i.test(clue)) issues.push("Remove every A from your clue.");
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
        if (words.length < 2 || words.some((w) => w[0] !== words[0]?.[0]))
          issues.push("Use at least 2 words with the same starting letter.");
        break;
    }
  }
  return { issues, word, clue, wordCount: words.length };
}
