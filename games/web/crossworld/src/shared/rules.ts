import type { Draft } from "./types";
export const SCENARIO = "chatterbloom-postcard-v1";
export const API_ROOT = `/api/${SCENARIO}`;

/**
 * What a card actually asks you to do. Playtest finding: the original ten cards
 * were four ideas in ten hats -- six counted the length of something and two
 * were the same ban-a-letter rule with a different letter -- so a deck felt
 * like one move repeated. Families exist so a deck can be checked for spread,
 * not just for size.
 *
 * length  count words, letters or characters
 * ban     forbid a letter or a specific word
 * shape   a pattern across the clue's own words
 * answer  relate the clue to the answer being clued
 * link    relate the clue to another clue you wrote
 * voice   change the register of the clue itself
 */
export type CardFamily =
  "length" | "ban" | "shape" | "answer" | "link" | "voice";

/**
 * Context a card may read beyond its own clue. The judge still never rules on
 * constraint compliance: every family below is decided by string comparison.
 * Absent context fails a card closed rather than open.
 */
export type ClueContext = {
  /** Words from the other clue in this same turn. */
  companion?: string[];
  /** Words from every clue already accepted in this world. */
  earlier?: string[];
};

const NUMBER_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

// The deterministic mechanic registry. Every restriction is checkable on the
// clue string alone (plus ClueContext); the judge never rules on constraint
// compliance. Display names are per-world (see each world's deck) so the same
// mechanic can read as "Grains" on a beach and "Tiny Seeds" in a garden.
export const RESTRICTIONS = [
  {
    id: "brief",
    family: "length",
    label: "Up to 4 words",
    detail: "Keep it concise",
    rule: "Use at most 4 words.",
  },
  {
    id: "seven",
    family: "length",
    label: "7 words",
    detail: "Make every word count",
    rule: "Use exactly 7 words.",
  },
  {
    id: "no-e",
    family: "ban",
    label: "No E",
    detail: "Leave E out",
    rule: "Do not use the letter E in your clue.",
  },
  {
    id: "no-articles",
    family: "ban",
    label: "No articles",
    detail: "Skip a, an & the",
    rule: "Do not use the words A, AN, or THE.",
  },
  {
    id: "short-words",
    family: "length",
    label: "Short words",
    detail: "Up to 4 letters each",
    rule: "Every clue word must be 4 letters or fewer.",
  },
  {
    id: "same-start",
    family: "shape",
    label: "Same initials",
    detail: "Two matching initials",
    rule: "At least 2 clue words must start with the same letter.",
  },
  {
    id: "no-b",
    family: "ban",
    label: "No B",
    detail: "Leave B out",
    rule: "Do not use the letter B in your clue.",
  },
  {
    id: "two-breaths",
    family: "length",
    label: "2 words",
    detail: "Exactly two words",
    rule: "Use exactly 2 words.",
  },
  {
    id: "half-measure",
    family: "length",
    label: "30 characters",
    detail: "Thirty characters or fewer",
    rule: "Keep the whole clue within 30 characters.",
  },
  {
    id: "long-shadow",
    family: "length",
    label: "An 8+ letter word",
    detail: "One word of eight or more",
    rule: "At least one clue word must be 8 letters or longer.",
  },
  {
    id: "mirror-length",
    family: "answer",
    label: "A word per letter",
    detail: "Match your answer's length",
    rule: "Use exactly as many words as your answer has letters.",
  },
  {
    id: "shared-initial",
    family: "answer",
    label: "Answer's initial",
    detail: "Start a word with it",
    rule: "One clue word must start with your answer's first letter.",
  },
  {
    id: "echo",
    family: "link",
    label: "Echo",
    detail: "Share a word across the pair",
    rule: "Reuse one word from your other clue this turn.",
  },
  {
    id: "fresh-words",
    family: "link",
    label: "All new words",
    detail: "Nothing used here before",
    rule: "Use no word that appears in a clue you already wrote in this world.",
  },
  {
    id: "ask",
    family: "voice",
    label: "A question",
    detail: "End with a question mark",
    rule: "Write your clue as a question.",
  },
  {
    id: "count-me-in",
    family: "voice",
    label: "A number",
    detail: "One through ten",
    rule: "Include a number word from ONE to TEN.",
  },
  {
    id: "twin-endings",
    family: "shape",
    label: "Twin endings",
    detail: "Two words end alike",
    rule: "Two clue words must end with the same two letters.",
  },
  {
    id: "double-trouble",
    family: "shape",
    label: "A doubled letter",
    detail: "Like LL or SS",
    rule: "Include a word with a doubled letter.",
  },
] satisfies {
  id: string;
  family: CardFamily;
  label: string;
  detail: string;
  rule: string;
}[];

export const familyOf = (id: string): CardFamily | undefined =>
  RESTRICTIONS.find((mechanic) => mechanic.id === id)?.family;
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
  context: ClueContext = {},
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
      case "mirror-length":
        // Scales with the slot: a four-letter answer wants a four-word clue.
        if (word.length && words.length !== word.length)
          issues.push(
            `Use exactly ${word.length} clue words, one for each letter of your answer.`,
          );
        break;
      case "shared-initial":
        if (word.length && !words.some((w) => w[0] === word[0]!.toLowerCase()))
          issues.push(`Start one clue word with ${word[0]}.`);
        break;
      case "echo":
        // Absent context fails closed: never pass a link card by default.
        if (!words.some((w) => (context.companion ?? []).includes(w)))
          issues.push("Reuse one word from your other clue this turn.");
        break;
      case "fresh-words": {
        const repeat = words.find((w) => (context.earlier ?? []).includes(w));
        if (repeat) issues.push(`You already used “${repeat}” in this world.`);
        break;
      }
      case "ask":
        if (!clue.endsWith("?"))
          issues.push(
            "Write your clue as a question, ending in a question mark.",
          );
        break;
      case "count-me-in":
        if (!words.some((w) => NUMBER_WORDS.includes(w)))
          issues.push("Include a number word from ONE to TEN.");
        break;
      case "twin-endings": {
        const tails = words
          .filter((w) => w.length >= 2)
          .map((w) => w.slice(-2));
        if (new Set(tails).size === tails.length)
          issues.push("Two clue words must end with the same two letters.");
        break;
      }
      case "double-trouble":
        if (!words.some((w) => /(.)\1/.test(w)))
          issues.push("Include a word with a doubled letter, like LL or SS.");
        break;
    }
  }
  return { issues, word, clue, wordCount: words.length };
}
