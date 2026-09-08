import { RESTRICTIONS, validateTurn } from "./rules";
import { type Draft, type Judgment } from "./types";

export const SHORE_SCENARIO = "sandy-shore-pairs-v1";
export const SHORE_API_ROOT = `/api/${SHORE_SCENARIO}`;
export const ROWS = 10;
export const COLS = 5;
export const DIRECTIONS = ["across", "down"] as const;
export type Direction = (typeof DIRECTIONS)[number];
type Path = { row: number; col: number; length: number };
// The supplied reference, in discovery order. Rows/columns are zero-based.
export const DAYS: { across: Path; down: Path; place: string; note: string }[] =
  [
    {
      across: { row: 2, col: 0, length: 5 },
      down: { row: 0, col: 1, length: 6 },
      place: "Sand drifts",
      note: "The sand shifts. Two paths appear.",
    },
    {
      across: { row: 4, col: 1, length: 3 },
      down: { row: 1, col: 3, length: 5 },
      place: "Tide pool",
      note: "The tide slips away, leaving a crossing behind.",
    },
    {
      across: { row: 5, col: 0, length: 5 },
      down: { row: 4, col: 2, length: 6 },
      place: "Sea grass",
      note: "The grass parts around two more paths.",
    },
    {
      across: { row: 7, col: 0, length: 3 },
      down: { row: 5, col: 0, length: 5 },
      place: "Shell bank",
      note: "A few shells roll aside. There is more to find.",
    },
    {
      across: { row: 9, col: 0, length: 5 },
      down: { row: 5, col: 4, length: 5 },
      place: "Smooth stones",
      note: "The last stones settle. Your shore is uncovered.",
    },
  ];
export const CRITERIA = RESTRICTIONS.map((rule, i) => ({
  ...rule,
  name: [
    "Keep it brief",
    "Seven words",
    "No letter E",
    "No articles",
    "Small words",
    "Matching initials",
    "No letter B",
  ][i]!,
}));
export type Entry = { word: string; clue: string; criterion: string };
export type PairDraft = { revealed: boolean; across: Entry; down: Entry };
export type Pair = PairDraft & { reviews: Record<Direction, Judgment | null> };
export type Shore = { completed: Pair[]; turn: Pair | null };
export type ShoreView = {
  scenario: string;
  signedIn: boolean;
  judgeReady: boolean;
  shore: Shore;
};
export const emptyPair = (): Pair => ({
  revealed: false,
  across: { word: "", clue: "", criterion: "" },
  down: { word: "", clue: "", criterion: "" },
  reviews: { across: null, down: null },
});
export const emptyShore = (): Shore => ({ completed: [], turn: emptyPair() });
export const cellsFor = (day: number, direction: Direction) => {
  const path = DAYS[day]?.[direction];
  return path
    ? Array.from({ length: path.length }, (_, i) => ({
        row: path.row + (direction === "down" ? i : 0),
        col: path.col + (direction === "across" ? i : 0),
      }))
    : [];
};
export const cellKey = (cell: { row: number; col: number }) =>
  `${cell.row},${cell.col}`;
export function lettersFor(completed: Pair[]) {
  const letters = new Map<string, string>();
  completed.forEach((pair, day) => {
    for (const direction of DIRECTIONS)
      cellsFor(day, direction).forEach((cell, i) =>
        letters.set(cellKey(cell), pair[direction].word[i]!),
      );
  });
  return letters;
}
export function crossingsFor(
  day: number,
  direction: Direction,
  completed: Pair[],
  pair?: PairDraft,
) {
  const fixed = lettersFor(completed);
  const other = direction === "across" ? "down" : "across";
  const companion = new Map<string, string>();
  if (pair)
    cellsFor(day, other).forEach((cell, i) => {
      const letter = pair[other].word.toUpperCase()[i];
      if (letter && /^[A-Z]$/.test(letter))
        companion.set(cellKey(cell), letter);
    });
  return cellsFor(day, direction).flatMap((cell, index) => {
    const key = cellKey(cell),
      letter = fixed.get(key) ?? companion.get(key);
    return letter ? [{ index, letter, fixed: fixed.has(key) }] : [];
  });
}
export const asDraft = (pair: PairDraft, direction: Direction): Draft => ({
  word: pair[direction].word,
  clue: pair[direction].clue,
  revealed: pair.revealed,
  restriction: pair[direction].criterion,
});
export function parsePair(raw: unknown): PairDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.revealed !== "boolean") return null;
  const entries: Entry[] = [];
  for (const direction of DIRECTIONS) {
    const entry = p[direction];
    if (!entry || typeof entry !== "object") return null;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.word !== "string" ||
      e.word.length > 20 ||
      typeof e.clue !== "string" ||
      e.clue.length > 140 ||
      typeof e.criterion !== "string" ||
      e.criterion.length > 30
    )
      return null;
    entries.push({ word: e.word, clue: e.clue, criterion: e.criterion });
  }
  return { revealed: p.revealed, across: entries[0]!, down: entries[1]! };
}
export function validatePair(pair: PairDraft, completed: Pair[]) {
  const day = completed.length,
    layout = DAYS[day];
  const issues: string[] = [];
  const normalized = parsePair(pair)!;
  if (!layout)
    return { issues: ["All five turns are complete."], pair: normalized };
  for (const direction of DIRECTIONS) {
    const result = validateTurn(
      asDraft(pair, direction),
      null,
      layout[direction].length,
    );
    normalized[direction] = {
      word: result.word,
      clue: result.clue,
      criterion: pair[direction].criterion,
    };
    issues.push(
      ...result.issues.map(
        (issue) => `${direction === "across" ? "Across" : "Down"}: ${issue}`,
      ),
    );
    for (const crossing of crossingsFor(day, direction, completed, pair))
      if (
        result.word.length === layout[direction].length &&
        result.word[crossing.index] !== crossing.letter
      )
        issues.push(
          `${direction === "across" ? "Across" : "Down"}: letter ${crossing.index + 1} must be ${crossing.letter} to match ${crossing.fixed ? "an earlier path" : "the other word in this pair"}.`,
        );
  }
  return { issues, pair: normalized };
}
